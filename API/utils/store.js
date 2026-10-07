const {
    GOOGLE_SHEET_ID,
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    GOOGLE_SERVICE_ACCOUNT_JSON,
} = require('../config');

// The spreadsheet is the database, so the schema has to be written down
// somewhere both sides agree on. It lives here as "tab name + header row",
// which is the whole of it: the columns are already fixed by what routes/ uses,
// and the first connection creates whatever is missing. An empty spreadsheet is
// enough to boot, there is no migration to run.
const TABLES = {
    users: ['id', 'username', 'password'],
    characters: ['id', 'name', 'atk', 'intelligence', 'health', 'isMonster', 'img', 'idPlayer'],
};

// The Sheets API answers with formatted values by default, so every cell comes
// back as text: 15 arrives as "15" and a boolean as "TRUE". The routes hand
// these objects to clients as JSON, where atk has to be a number and isMonster
// a boolean, so each row is converted on the way out instead of trusting the
// cell type. A blank cell reads as 0/false rather than NaN, because the callers
// do arithmetic on these values.
const readString = (value) => (value === undefined || value === null ? '' : String(value));

const readNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const readBoolean = (value) =>
    value === true ||
    String(value ?? '')
        .trim()
        .toLowerCase() === 'true';

const toUser = (row) => ({
    id: readString(row.get('id')),
    username: readString(row.get('username')),
    password: readString(row.get('password')),
});

const toCharacter = (row) => ({
    id: readString(row.get('id')),
    name: readString(row.get('name')),
    atk: readNumber(row.get('atk')),
    intelligence: readNumber(row.get('intelligence')),
    health: readNumber(row.get('health')),
    isMonster: readBoolean(row.get('isMonster')),
    img: readString(row.get('img')),
    idPlayer: readString(row.get('idPlayer')),
});

// The connection is built on the first query rather than when this file is
// required. Three things depend on that: `jest.mock('../utils/store')` loads
// this module to discover its shape, and the test suite must not need Google
// to be reachable; the Sheets library cannot be loaded by Jest at all (see
// openDocument); and a missing configuration is reported on the first request
// with a message that says what to fix, instead of crashing at boot.
let documentPromise = null;

const serviceAccountCredentials = () => {
    // .env carries either the two fields copied out of the service account key
    // file or the whole JSON on one line. The JSON wins when both are present.
    const keyFile = GOOGLE_SERVICE_ACCOUNT_JSON ? JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON) : null;
    const clientEmail = keyFile?.client_email || GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = keyFile?.private_key || GOOGLE_PRIVATE_KEY;

    if (!GOOGLE_SHEET_ID) {
        throw new Error(
            'GOOGLE_SHEET_ID is not set. It is the part of the spreadsheet URL between /d/ and /edit.',
        );
    }

    if (!clientEmail || !privateKey) {
        throw new Error(
            'Google service account credentials are missing. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY (or GOOGLE_SERVICE_ACCOUNT_JSON) in .env.',
        );
    }

    return {
        clientEmail,
        // A .env file cannot carry real newlines, so the key file's \n escape
        // sequences have to be turned back into line breaks here.
        privateKey: privateKey.replace(/\\n/g, '\n'),
    };
};

// A blank tab has no header row to read, and loadHeaderRow reports that as an
// error rather than as "nothing here yet". Only those two messages mean the tab
// is empty: any other failure (a network hiccup, a rate limit) is re-thrown
// instead of being answered by writing a header row over data.
const isBlankHeaderError = (error) =>
    /No values in the header row|All your header cells are blank/.test(error.message);

const ensureHeader = async (sheet, header) => {
    let actual;
    try {
        await sheet.loadHeaderRow();
        actual = sheet.headerValues;
    } catch (error) {
        if (!isBlankHeaderError(error)) throw error;
        await sheet.setHeaderRow(header);
        return;
    }

    // The columns are read by name, so a tab with different headers would
    // silently return undefined for every field. Failing loudly here turns that
    // into one message naming both columns instead of an empty API.
    if (actual.join('|') !== header.join('|')) {
        throw new Error(
            `The "${sheet.title}" tab has the wrong columns. Expected: ${header.join(', ')}. Found: ${actual.filter(Boolean).join(', ')}.`,
        );
    }
};

const ensureTable = async (doc, title, header) => {
    const existing = doc.sheetsByTitle[title];

    if (!existing) return doc.addSheet({ title, headerValues: header });

    await ensureHeader(existing, header);
    return existing;
};

const openDocument = async () => {
    // Required here rather than at the top of the file for the same reason the
    // connection is lazy: google-spreadsheet pulls in `ky`, which is ESM-only,
    // and Jest's CommonJS loader cannot parse it. The tests load this module to
    // mock it, so requiring the library at module scope would fail the whole
    // suite before a single assertion ran.
    const { GoogleSpreadsheet } = require('google-spreadsheet');
    const { JWT } = require('google-auth-library');

    const { clientEmail, privateKey } = serviceAccountCredentials();

    const auth = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();

    for (const [title, header] of Object.entries(TABLES)) {
        await ensureTable(doc, title, header);
    }

    return doc;
};

const getDocument = () => {
    if (!documentPromise) {
        documentPromise = openDocument().catch((error) => {
            // A connection that failed once must not poison the process: drop
            // it so the next request tries again, then let this one see why.
            documentPromise = null;
            throw error;
        });
    }

    return documentPromise;
};

const getTable = async (title) => {
    const doc = await getDocument();
    return doc.sheetsByTitle[title];
};

const readRows = async (title) => {
    const sheet = await getTable(title);
    // The whole tab is read in one request. At this size that is a few hundred
    // bytes, and the row interface has no "where id = ?" to use instead.
    const rows = await sheet.getRows();

    // Sheets pads the range out to the last row it knows about, so blank rows
    // come back as row objects with no id. They are padding, not data.
    return rows.filter((row) => row.get('id'));
};

/**
 * Look up a user by exact username.
 *
 * @param {string} username
 * @returns {Promise<object|null>} The user row, or `null` when there is no
 *   match. The row includes the `password` column; login needs it for the bcrypt
 *   comparison, signup reads only the existence.
 * @throws {Error} Any failure to reach the spreadsheet or to read the tab.
 */
async function findUserByUsername(username) {
    const rows = await readRows('users');
    const row = rows.find((candidate) => readString(candidate.get('username')) === username);

    return row ? toUser(row) : null;
}

/**
 * Insert a new user.
 *
 * @param {{id: string, username: string, password: string}} user The caller
 *   supplies the generated `id` and the bcrypt hash, so plaintext never reaches
 *   this file.
 * @returns {Promise<object>} The inserted row.
 * @throws {Error} Any failure to reach the spreadsheet. A spreadsheet has no
 *   unique constraint, so a duplicate username is not detected here: routes/auth.js
 *   looks the name up first, which is what answers a second signup with 409.
 */
async function createUser(user) {
    const sheet = await getTable('users');
    const row = await sheet.addRow(user);

    return toUser(row);
}

/**
 * Look up a character by id.
 *
 * @param {string} id
 * @returns {Promise<object|null>} The character row, or `null` when absent.
 * @throws {Error} Any failure to reach the spreadsheet or to read the tab.
 */
async function findCharacter(id) {
    const rows = await readRows('characters');
    const row = rows.find((candidate) => readString(candidate.get('id')) === id);

    return row ? toCharacter(row) : null;
}

/**
 * List every character a player owns, ordered by name.
 *
 * @param {string} idPlayer
 * @returns {Promise<object[]>} Empty array when the player has no characters.
 * @throws {Error} Any failure to reach the spreadsheet or to read the tab.
 */
async function findCharactersByPlayer(idPlayer) {
    const rows = await readRows('characters');
    const owned = rows
        .filter((row) => readString(row.get('idPlayer')) === idPlayer)
        .map(toCharacter);

    return owned.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/**
 * Pick one random character from the whole tab.
 *
 * @returns {Promise<object|null>} `null` when there are no characters.
 *   Callers fall back to a default character.
 * @throws {Error} Any failure to reach the spreadsheet or to read the tab.
 */
async function getRandomCharacter() {
    const rows = await readRows('characters');
    if (rows.length === 0) return null;

    return toCharacter(rows[Math.floor(Math.random() * rows.length)]);
}

/**
 * Insert a character.
 *
 * @param {object} character The caller fills in `id` (a generated uuid),
 *   `idPlayer` and `isMonster` from the server. Nothing here reads the request
 *   body, which is what keeps those three fields out of the caller's reach.
 * @returns {Promise<object>} The inserted row.
 * @throws {Error} Any failure to reach the spreadsheet.
 */
async function createCharacter(character) {
    const sheet = await getTable('characters');
    const row = await sheet.addRow(character);

    return toCharacter(row);
}

/**
 * Apply a partial update to a character.
 *
 * @param {string} id
 * @param {object} fields The subset of columns to change. The caller builds it
 *   field by field; never pass the request body straight through.
 * @returns {Promise<object>} The updated row.
 * @throws {Error} Any failure to reach the spreadsheet. Unlike findCharacter,
 *   an update that matches no row throws rather than returning null: it is a bug
 *   upstream (routes/ already looked the character up), not a lookup miss, so it
 *   is allowed to surface as a 500.
 */
async function updateCharacter(id, fields) {
    const rows = await readRows('characters');
    const row = rows.find((candidate) => readString(candidate.get('id')) === id);

    if (!row) throw new Error(`updateCharacter: no character with id "${id}"`);

    row.assign(fields);
    await row.save();

    return toCharacter(row);
}

/**
 * Delete a character.
 *
 * @param {string} id
 * @returns {Promise<void>} Resolves even when no row matched, so deleting an
 *   already-deleted id is not an error.
 * @throws {Error} Any failure to reach the spreadsheet.
 */
async function deleteCharacter(id) {
    const rows = await readRows('characters');
    const row = rows.find((candidate) => readString(candidate.get('id')) === id);

    if (!row) return;

    await row.delete();
}

module.exports = {
    findUserByUsername,
    createUser,
    findCharacter,
    findCharactersByPlayer,
    getRandomCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,
};
