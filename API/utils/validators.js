const validateCredentials = (username, password) => {
    if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 30) {
        return { valid: false, message: 'Username must be between 3 and 30 characters long' };
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    return { valid: true };
};

const validateCharacterStats = (atk, intelligence, health) => {
    if (typeof atk !== 'number' || atk < 0 || atk > 100) {
        return { valid: false, message: 'ATK must be a number between 0 and 100' };
    }
    if (typeof intelligence !== 'number' || intelligence < 0 || intelligence > 100) {
        return { valid: false, message: 'INT must be a number between 0 and 100' };
    }
    if (typeof health !== 'number' || health < 1 || health > 500) {
        return { valid: false, message: 'Health must be a number between 1 and 500' };
    }
    return { valid: true };
};

module.exports = { validateCredentials, validateCharacterStats };
