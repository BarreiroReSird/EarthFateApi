const { LIMITS } = require('../config');

// Every validator here returns { valid, message } instead of throwing, so a
// caller can collect several checks and decide which error to report first.
// routes/characters.js has the assertValid helper that turns a result back into
// an AppError. A new validator must return, never throw, or assertValid will not
// see it and the request will answer 500 instead of 400.

const validateCredentials = (username, password) => {
    const { MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH, MIN_PASSWORD_LENGTH } =
        LIMITS.USER_CREDENTIALS;
    if (
        !username ||
        typeof username !== 'string' ||
        username.trim().length < MIN_USERNAME_LENGTH ||
        username.trim().length > MAX_USERNAME_LENGTH
    ) {
        return {
            valid: false,
            message: `Username must be between ${MIN_USERNAME_LENGTH} and ${MAX_USERNAME_LENGTH} characters long`,
        };
    }
    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        return {
            valid: false,
            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        };
    }
    return { valid: true };
};

// Deliberately slugs, not UUIDs. The seeded rows in Supabase have ids like
// "monster_1", and characters are created here with crypto.randomUUID(). Both
// shapes have to keep working, so this allows letters, numbers, hyphen and
// underscore. Tightening it to a strict UUID pattern would 400 the seeded
// monsters. If the id column in Supabase turns out to be a uuid type, the
// seeded slugs have to be migrated instead of this pattern being narrowed.
const RESOURCE_ID_PATTERN = new RegExp(`^[A-Za-z0-9_-]{1,${LIMITS.RESOURCE_ID.MAX_LENGTH}}$`);

const validateResourceId = (id) => {
    if (typeof id !== 'string' || !RESOURCE_ID_PATTERN.test(id)) {
        return {
            valid: false,
            message: `Id must be 1 to ${LIMITS.RESOURCE_ID.MAX_LENGTH} characters long and contain only letters, numbers, hyphens or underscores`,
        };
    }
    return { valid: true };
};

const validateCharacterName = (name) => {
    const { MIN_LENGTH, MAX_LENGTH } = LIMITS.CHARACTER_NAME;
    if (
        !name ||
        typeof name !== 'string' ||
        name.trim().length < MIN_LENGTH ||
        name.trim().length > MAX_LENGTH
    ) {
        return {
            valid: false,
            message: `Name must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters`,
        };
    }
    return { valid: true };
};

// Number.isFinite, not typeof alone, and the reason is NaN specifically:
// typeof NaN === 'number', and every comparison with NaN is false, so a range
// check on its own (value < min || value > max) lets NaN straight through.
// Infinity is already caught by the range comparison, NaN is not.
const validateStat = (label, value, min, max) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
        return { valid: false, message: `${label} must be a number between ${min} and ${max}` };
    }
    return { valid: true };
};

const validateCharacterStats = (atk, intelligence, health) => {
    const { MIN_ATK, MAX_ATK, MIN_INT, MAX_INT, MIN_HEALTH, MAX_HEALTH } = LIMITS.CHARACTER_STATS;

    const atkCheck = validateStat('ATK', atk, MIN_ATK, MAX_ATK);
    if (!atkCheck.valid) return atkCheck;

    const intCheck = validateStat('INT', intelligence, MIN_INT, MAX_INT);
    if (!intCheck.valid) return intCheck;

    return validateStat('Health', health, MIN_HEALTH, MAX_HEALTH);
};

const UPDATABLE_CHARACTER_FIELDS = ['name', 'atk', 'intelligence', 'health'];

const validateCharacterPatch = (fields) => {
    const { name, atk, intelligence, health } = fields;

    const providedFields = UPDATABLE_CHARACTER_FIELDS.filter(
        (field) => fields[field] !== undefined,
    );

    if (providedFields.length === 0) {
        return {
            valid: false,
            message: `At least one field must be provided (${UPDATABLE_CHARACTER_FIELDS.join(', ')})`,
        };
    }

    if (name !== undefined) {
        const nameCheck = validateCharacterName(name);
        if (!nameCheck.valid) return nameCheck;
    }

    const { MIN_ATK, MAX_ATK, MIN_INT, MAX_INT, MIN_HEALTH, MAX_HEALTH } = LIMITS.CHARACTER_STATS;
    const statChecks = [
        ['ATK', atk, MIN_ATK, MAX_ATK],
        ['INT', intelligence, MIN_INT, MAX_INT],
        ['Health', health, MIN_HEALTH, MAX_HEALTH],
    ];

    for (const [label, value, min, max] of statChecks) {
        if (value === undefined) continue;
        const check = validateStat(label, value, min, max);
        if (!check.valid) return check;
    }

    return { valid: true };
};

module.exports = {
    validateCredentials,
    validateResourceId,
    validateCharacterName,
    validateCharacterStats,
    validateCharacterPatch,
};
