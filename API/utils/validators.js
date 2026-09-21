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

const validateCharacterStats = (atk, intelligence, health) => {
    const { MIN_ATK, MAX_ATK, MIN_INT, MAX_INT, MIN_HEALTH, MAX_HEALTH } = LIMITS.CHARACTER_STATS;
    if (typeof atk !== 'number' || atk < MIN_ATK || atk > MAX_ATK) {
        return { valid: false, message: `ATK must be a number between ${MIN_ATK} and ${MAX_ATK}` };
    }
    if (typeof intelligence !== 'number' || intelligence < MIN_INT || intelligence > MAX_INT) {
        return { valid: false, message: `INT must be a number between ${MIN_INT} and ${MAX_INT}` };
    }
    if (typeof health !== 'number' || health < MIN_HEALTH || health > MAX_HEALTH) {
        return {
            valid: false,
            message: `Health must be a number between ${MIN_HEALTH} and ${MAX_HEALTH}`,
        };
    }
    return { valid: true };
};

module.exports = { validateCredentials, validateCharacterName, validateCharacterStats };
