const {
    validateCredentials,
    validateCharacterName,
    validateCharacterStats,
} = require('./validators');

describe('validateCredentials', () => {
    it('should return valid when username and password are correct', () => {
        const result = validateCredentials('carlos', '12345678');
        expect(result).toEqual({ valid: true });
    });

    it('should return invalid when username is too short', () => {
        const result = validateCredentials('ca', '12345678');
        expect(result).toEqual({
            valid: false,
            message: 'Username must be between 3 and 30 characters long',
        });
    });

    it('should return invalid when username is too long', () => {
        const result = validateCredentials('a'.repeat(31), '12345678');
        expect(result).toEqual({
            valid: false,
            message: 'Username must be between 3 and 30 characters long',
        });
    });

    it('should return invalid when username is empty', () => {
        const result = validateCredentials('', '12345678');
        expect(result).toEqual({
            valid: false,
            message: 'Username must be between 3 and 30 characters long',
        });
    });

    it('should return invalid when username is undefined', () => {
        const result = validateCredentials(undefined, '12345678');
        expect(result).toEqual({
            valid: false,
            message: 'Username must be between 3 and 30 characters long',
        });
    });

    it('should return invalid when password is too short', () => {
        const result = validateCredentials('carlos', '1234567');
        expect(result).toEqual({
            valid: false,
            message: 'Password must be at least 8 characters long',
        });
    });

    it('should return invalid when password is empty', () => {
        const result = validateCredentials('carlos', '');
        expect(result).toEqual({
            valid: false,
            message: 'Password must be at least 8 characters long',
        });
    });

    it('should return invalid when password is undefined', () => {
        const result = validateCredentials('carlos', undefined);
        expect(result).toEqual({
            valid: false,
            message: 'Password must be at least 8 characters long',
        });
    });
});

describe('validateCharacterName', () => {
    it('should return valid for normal character name', () => {
        expect(validateCharacterName('Conan')).toEqual({ valid: true });
    });

    it('should return invalid when name is too short', () => {
        expect(validateCharacterName('A')).toEqual({
            valid: false,
            message: 'Name must be between 2 and 30 characters',
        });
    });

    it('should return invalid when name is too long', () => {
        expect(validateCharacterName('a'.repeat(31))).toEqual({
            valid: false,
            message: 'Name must be between 2 and 30 characters',
        });
    });

    it('should return invalid when name is not a string', () => {
        expect(validateCharacterName(123)).toEqual({
            valid: false,
            message: 'Name must be between 2 and 30 characters',
        });
    });

    it('should return invalid when name is undefined or empty', () => {
        expect(validateCharacterName(undefined)).toEqual({
            valid: false,
            message: 'Name must be between 2 and 30 characters',
        });
        expect(validateCharacterName('   ')).toEqual({
            valid: false,
            message: 'Name must be between 2 and 30 characters',
        });
    });
});

describe('validateCharacterStats', () => {
    it('should return valid when all stats are within range', () => {
        const result = validateCharacterStats(50, 50, 250);
        expect(result).toEqual({ valid: true });
    });

    it('should return valid with boundary values', () => {
        expect(validateCharacterStats(0, 0, 1)).toEqual({ valid: true });
        expect(validateCharacterStats(100, 100, 500)).toEqual({ valid: true });
    });

    it('should return invalid when ATK is not a number', () => {
        const result = validateCharacterStats('high', 50, 250);
        expect(result).toEqual({ valid: false, message: 'ATK must be a number between 0 and 100' });
    });

    it('should return invalid when ATK is negative', () => {
        const result = validateCharacterStats(-1, 50, 250);
        expect(result).toEqual({ valid: false, message: 'ATK must be a number between 0 and 100' });
    });

    it('should return invalid when ATK exceeds 100', () => {
        const result = validateCharacterStats(101, 50, 250);
        expect(result).toEqual({ valid: false, message: 'ATK must be a number between 0 and 100' });
    });

    it('should return invalid when intelligence is not a number', () => {
        const result = validateCharacterStats(50, 'smart', 250);
        expect(result).toEqual({ valid: false, message: 'INT must be a number between 0 and 100' });
    });

    it('should return invalid when intelligence is negative', () => {
        const result = validateCharacterStats(50, -1, 250);
        expect(result).toEqual({ valid: false, message: 'INT must be a number between 0 and 100' });
    });

    it('should return invalid when intelligence exceeds 100', () => {
        const result = validateCharacterStats(50, 101, 250);
        expect(result).toEqual({ valid: false, message: 'INT must be a number between 0 and 100' });
    });

    it('should return invalid when health is not a number', () => {
        const result = validateCharacterStats(50, 50, 'full');
        expect(result).toEqual({
            valid: false,
            message: 'Health must be a number between 1 and 500',
        });
    });

    it('should return invalid when health is zero', () => {
        const result = validateCharacterStats(50, 50, 0);
        expect(result).toEqual({
            valid: false,
            message: 'Health must be a number between 1 and 500',
        });
    });

    it('should return invalid when health is negative', () => {
        const result = validateCharacterStats(50, 50, -1);
        expect(result).toEqual({
            valid: false,
            message: 'Health must be a number between 1 and 500',
        });
    });

    it('should return invalid when health exceeds 500', () => {
        const result = validateCharacterStats(50, 50, 501);
        expect(result).toEqual({
            valid: false,
            message: 'Health must be a number between 1 and 500',
        });
    });
});
