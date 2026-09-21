const logger = require('./logger');

describe('logger utility', () => {
    it('should sanitize sensitive keys from objects', () => {
        const input = {
            username: 'alice',
            password: 'mysecretpassword',
            token: 'bearer.jwt.token',
            secret: 'supersecret',
            authorization: 'Bearer 123',
            normalField: 'hello',
        };

        const sanitized = logger.sanitize(input);

        expect(sanitized.username).toBe('alice');
        expect(sanitized.normalField).toBe('hello');
        expect(sanitized.password).toBe('[REDACTED]');
        expect(sanitized.token).toBe('[REDACTED]');
        expect(sanitized.secret).toBe('[REDACTED]');
        expect(sanitized.authorization).toBe('[REDACTED]');
    });

    it('should handle non-object inputs safely', () => {
        expect(logger.sanitize('simple string')).toBe('simple string');
        expect(logger.sanitize(123)).toBe(123);
        expect(logger.sanitize(null)).toBeNull();
    });
});

