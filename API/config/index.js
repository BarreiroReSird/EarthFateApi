require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    JWT_SECRET: process.env.JWT_SECRET || 'super_secret_earth_fate_key_change_in_production',
    JWT_EXPIRES_IN: '24h',
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
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
    },
};
