require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

if (
    isProduction &&
    (!process.env.JWT_SECRET ||
        process.env.JWT_SECRET === 'super_secret_earth_fate_key_change_in_production')
) {
    throw new Error(
        'FATAL SECURITY ERROR: JWT_SECRET environment variable is missing or uses fallback in production!',
    );
}

const parsedSaltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
const saltRounds =
    !isNaN(parsedSaltRounds) && parsedSaltRounds >= 10 ? parsedSaltRounds : isProduction ? 12 : 10;

const parseMaxRequests = (envKey, fallback) => {
    const parsed = parseInt(process.env[envKey], 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : fallback;
};

module.exports = {
    PORT: process.env.PORT || 3000,
    IS_PRODUCTION: isProduction,
    API_PREFIX: '/api/v1',
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    JWT_SECRET: process.env.JWT_SECRET || 'super_secret_earth_fate_key_change_in_production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    BCRYPT_SALT_ROUNDS: saltRounds,
    EXPRESS_JSON_LIMIT: '10kb',
    DEFAULT_MONSTER: {
        id: 'monster_1',
        name: 'Dragon',
        atk: 15,
        intelligence: 15,
        health: 75,
        isMonster: true,
        img: 'dragon.png',
        idPlayer: 'npc',
    },
    LIMITS: {
        USER_CREDENTIALS: {
            MIN_USERNAME_LENGTH: 3,
            MAX_USERNAME_LENGTH: 30,
            MIN_PASSWORD_LENGTH: 8,
        },
        CHARACTER_NAME: {
            MIN_LENGTH: 2,
            MAX_LENGTH: 30,
        },
        CHARACTER_STATS: {
            MIN_ATK: 0,
            MAX_ATK: 100,
            MIN_INT: 0,
            MAX_INT: 100,
            MIN_HEALTH: 1,
            MAX_HEALTH: 500,
        },
        RESOURCE_ID: {
            MAX_LENGTH: 64,
        },
    },
    RATE_LIMITS: {
        GENERAL: {
            WINDOW_MS: 15 * 60 * 1000,
            MAX_REQUESTS: parseMaxRequests('RATE_LIMIT_GENERAL_MAX', 300),
        },
        AUTH: {
            WINDOW_MS: 15 * 60 * 1000,
            MAX_REQUESTS: parseMaxRequests('RATE_LIMIT_AUTH_MAX', 10),
        },
    },
    HSTS: { MAX_AGE: 15552000, INCLUDE_SUBDOMAINS: true },
};
