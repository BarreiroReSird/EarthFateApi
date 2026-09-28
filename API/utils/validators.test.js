const {
    validateCredentials,
    validateResourceId,
    validateCharacterName,
    validateCharacterStats,
    validateCharacterPatch,
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

describe('validateResourceId', () => {
    it('should accept a uuid', () => {
        expect(validateResourceId('33333333-3333-4333-8333-333333333333')).toEqual({ valid: true });
    });

    it('should accept a slug id like the default monster', () => {
        expect(validateResourceId('monster_1')).toEqual({ valid: true });
        expect(validateResourceId('npc')).toEqual({ valid: true });
    });

    it('should reject an id that is not a string', () => {
        expect(validateResourceId(123).valid).toBe(false);
        expect(validateResourceId(null).valid).toBe(false);
        expect(validateResourceId(undefined).valid).toBe(false);
        expect(validateResourceId({}).valid).toBe(false);
    });

    it('should reject an empty or whitespace id', () => {
        expect(validateResourceId('').valid).toBe(false);
        expect(validateResourceId('   ').valid).toBe(false);
    });

    it('should reject an id longer than the configured maximum', () => {
        expect(validateResourceId('a'.repeat(64)).valid).toBe(true);
        expect(validateResourceId('a'.repeat(65)).valid).toBe(false);
    });

    it('should reject characters outside the allowed set', () => {
        expect(validateResourceId('abc def').valid).toBe(false);
        expect(validateResourceId('abc/def').valid).toBe(false);
        expect(validateResourceId("'; DROP TABLE characters; --").valid).toBe(false);
        expect(validateResourceId('abc<script>').valid).toBe(false);
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

    it('should return invalid when stats are NaN', () => {
        expect(validateCharacterStats(NaN, 50, 250)).toEqual({
            valid: false,
            message: 'ATK must be a number between 0 and 100',
        });
        expect(validateCharacterStats(50, NaN, 250)).toEqual({
            valid: false,
            message: 'INT must be a number between 0 and 100',
        });
        expect(validateCharacterStats(50, 50, NaN)).toEqual({
            valid: false,
            message: 'Health must be a number between 1 and 500',
        });
    });

    it('should return invalid when stats are Infinity', () => {
        expect(validateCharacterStats(Infinity, 50, 250)).toEqual({
            valid: false,
            message: 'ATK must be a number between 0 and 100',
        });
        expect(validateCharacterStats(50, 50, -Infinity)).toEqual({
            valid: false,
            message: 'Health must be a number between 1 and 500',
        });
    });

    it('should return invalid when stats are null', () => {
        expect(validateCharacterStats(null, 50, 250)).toEqual({
            valid: false,
            message: 'ATK must be a number between 0 and 100',
        });
        expect(validateCharacterStats(50, 50, null)).toEqual({
            valid: false,
            message: 'Health must be a number between 1 and 500',
        });
    });
});

describe('validateCharacterPatch', () => {
    it('should return valid when a single field is provided', () => {
        expect(validateCharacterPatch({ name: 'Conan' })).toEqual({ valid: true });
        expect(validateCharacterPatch({ atk: 60 })).toEqual({ valid: true });
        expect(validateCharacterPatch({ intelligence: 40 })).toEqual({ valid: true });
        expect(validateCharacterPatch({ health: 250 })).toEqual({ valid: true });
    });

    it('should return valid when several fields are provided', () => {
        expect(
            validateCharacterPatch({ name: 'Conan', atk: 60, intelligence: 40, health: 250 }),
        ).toEqual({ valid: true });
    });

    it('should return invalid when no updatable field is provided', () => {
        expect(validateCharacterPatch({})).toEqual({
            valid: false,
            message: 'At least one field must be provided (name, atk, intelligence, health)',
        });
        expect(validateCharacterPatch({ isMonster: true, img: 'hero.png' })).toEqual({
            valid: false,
            message: 'At least one field must be provided (name, atk, intelligence, health)',
        });
    });

    it('should return invalid when name is provided but out of range', () => {
        expect(validateCharacterPatch({ name: 'A' })).toEqual({
            valid: false,
            message: 'Name must be between 2 and 30 characters',
        });
    });

    it('should return invalid when a provided stat is out of range', () => {
        expect(validateCharacterPatch({ atk: 101 })).toEqual({
            valid: false,
            message: 'ATK must be a number between 0 and 100',
        });
        expect(validateCharacterPatch({ health: 0 })).toEqual({
            valid: false,
            message: 'Health must be a number between 1 and 500',
        });
    });

    it('should return invalid when a provided stat is NaN', () => {
        expect(validateCharacterPatch({ atk: NaN })).toEqual({
            valid: false,
            message: 'ATK must be a number between 0 and 100',
        });
    });

    it('should return invalid when a provided field is null', () => {
        expect(validateCharacterPatch({ name: null })).toEqual({
            valid: false,
            message: 'Name must be between 2 and 30 characters',
        });
        expect(validateCharacterPatch({ health: null })).toEqual({
            valid: false,
            message: 'Health must be a number between 1 and 500',
        });
    });

    it('should treat explicitly undefined fields as not provided', () => {
        expect(validateCharacterPatch({ name: 'Conan', atk: undefined })).toEqual({ valid: true });
    });
});
