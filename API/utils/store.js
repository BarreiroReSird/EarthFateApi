const supabase = require('./supabase');

// PGRST116 is PostgREST's "0 rows returned". The lookups below treat it as
// "not found" and return null instead of throwing, so a missing row is a normal
// answer rather than a failure. Every other Supabase error is re-thrown
// untouched and ends up as a 500 in middleware/errorHandler.js.

/**
 * Look up a user by exact username.
 *
 * @param {string} username
 * @returns {Promise<object|null>} The user row, or `null` when there is no
 *   match. The row is `select('*')`, so it includes the `password` column; login
 *   needs it for the bcrypt comparison, signup reads only the existence.
 * @throws {Error} Any Supabase error other than PGRST116.
 */
async function findUserByUsername(username) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

/**
 * Insert a new user.
 *
 * @param {{id: string, username: string, password: string}} user The caller
 *   supplies the generated `id` and the bcrypt hash, so plaintext never reaches
 *   this file.
 * @returns {Promise<object>} The inserted row.
 * @throws {Error} Any Supabase error, including the unique violation raised
 *   when the username is already taken. routes/auth.js answers that with a 409.
 */
async function createUser(user) {
    const { data, error } = await supabase.from('users').insert(user).select().single();
    if (error) throw error;
    return data;
}

/**
 * Look up a character by id.
 *
 * @param {string} id
 * @returns {Promise<object|null>} The character row, or `null` when absent.
 * @throws {Error} Any Supabase error other than PGRST116.
 */
async function findCharacter(id) {
    const { data, error } = await supabase.from('characters').select('*').eq('id', id).single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

/**
 * List every character a player owns, ordered by name.
 *
 * @param {string} idPlayer
 * @returns {Promise<object[]>} Empty array when the player has no characters.
 * @throws {Error} Any Supabase error.
 */
async function findCharactersByPlayer(idPlayer) {
    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('idPlayer', idPlayer)
        .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Pick one random character from the whole table.
 *
 * Counts the rows and then reads the single row at a random offset, so the
 * table is never loaded into memory. That is two round trips, so the row can
 * disappear in between; the offset then lands past the end and this returns
 * `null` rather than failing.
 *
 * @returns {Promise<object|null>} `null` when the table is empty or the chosen
 *   row was deleted in between. Callers fall back to a default character.
 * @throws {Error} Any Supabase error other than PGRST116.
 */
async function getRandomCharacter() {
    const { count, error: countError } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    if (!count || count === 0) return null;

    const randomOffset = Math.floor(Math.random() * count);
    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .range(randomOffset, randomOffset)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
}

/**
 * Insert a character.
 *
 * @param {object} character The caller fills in `id` (a generated uuid),
 *   `idPlayer` and `isMonster` from the server. Nothing here reads the request
 *   body, which is what keeps those three fields out of the caller's reach.
 * @returns {Promise<object>} The inserted row.
 * @throws {Error} Any Supabase error.
 */
async function createCharacter(character) {
    const { data, error } = await supabase.from('characters').insert(character).select().single();
    if (error) throw error;
    return data;
}

/**
 * Apply a partial update to a character.
 *
 * @param {string} id
 * @param {object} fields The subset of columns to change. The caller builds it
 *   field by field; never pass the request body straight through.
 * @returns {Promise<object>} The updated row.
 * @throws {Error} Any Supabase error. Unlike findCharacter, PGRST116 is *not*
 *   treated as "not found" here: an update that matched no row is a bug
 *   upstream, not a lookup miss, so it is allowed to surface as a 500.
 */
async function updateCharacter(id, fields) {
    const { data, error } = await supabase
        .from('characters')
        .update(fields)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

/**
 * Delete a character.
 *
 * @param {string} id
 * @returns {Promise<void>} Resolves even when no row matched, so deleting an
 *   already-deleted id is not an error.
 * @throws {Error} Any Supabase error.
 */
async function deleteCharacter(id) {
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (error) throw error;
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
