const { LIMITS } = require('../config');

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
