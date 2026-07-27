const validateCredentials = (username, password) => {
    if (!username || username.length < 3) {
        return { valid: false, message: 'The username must be at least 3 characters long' };
    }
    if (!password || password.length < 6) {
        return { valid: false, message: 'The password must be at least 6 characters long' };
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
