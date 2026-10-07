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

const CORS_ORIGINS = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

// A wildcard in production would let any site on the internet call this API
// from a browser on behalf of a logged-in user, so it fails here rather than
// shipping quietly. A read-only public API would be the exception, and this one
// is not: everything except /health and /characters/random needs a token.
//
// The list is matched exactly, so a pattern like "*.example.com" never matches
// anything at all. Rejecting it here turns that silent breakage into a boot
// error, and it is also the one way to make a permissive-looking value safe.
if (isProduction) {
    if (CORS_ORIGINS.length === 0) {
        throw new Error(
            'FATAL SECURITY ERROR: CORS_ORIGIN must list the allowed origins in production, e.g. https://your-frontend.com. A wildcard ("*") is not allowed!',
        );
    }

    for (const origin of CORS_ORIGINS) {
        // "https://*.example.com" parses as a perfectly valid URL, so it would
        // pass every other check here and then never match a single request.
        // Any wildcard is rejected instead of being silently useless.
        if (origin.includes('*')) {
            throw new Error(
                `FATAL SECURITY ERROR: CORS_ORIGIN entry "${origin}" is a pattern. List each origin in full, e.g. https://game.example.com,https://www.example.com`,
            );
        }

        let parsed;
        try {
            parsed = new URL(origin);
        } catch {
            throw new Error(
                `FATAL SECURITY ERROR: CORS_ORIGIN entry "${origin}" is not a valid origin, e.g. https://your-frontend.com`,
            );
        }

        // Plain HTTP in production would let the origin be reached in the clear,
        // and a path or port suffix means the value is not what will be compared
        // against the browser's Origin header, so it would silently never match.
        if (parsed.protocol !== 'https:') {
            throw new Error(
                `FATAL SECURITY ERROR: CORS_ORIGIN entry "${origin}" must use https in production!`,
            );
        }

        if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
            throw new Error(
                `FATAL SECURITY ERROR: CORS_ORIGIN entry "${origin}" must be a bare origin with no path, query or fragment!`,
            );
        }
    }
}

const parsedSaltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10);
const saltRounds =
    !isNaN(parsedSaltRounds) && parsedSaltRounds >= 10 ? parsedSaltRounds : isProduction ? 12 : 10;

const parseMaxRequests = (envKey, fallback) => {
    const parsed = parseInt(process.env[envKey], 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : fallback;
};

// Number of reverse proxies in front of the app. It has to be right, because
// Express reads the client IP from X-Forwarded-For only for the hops it trusts.
// Too low and every visitor shares one rate-limit bucket; `true` trusts the
// header from anyone and lets a client forge its own IP to bypass the limits.
const parseTrustProxy = () => {
    const raw = process.env.TRUST_PROXY;
    if (raw === undefined || raw === '' || raw === 'false') return false;

    const parsed = parseInt(raw, 10);
    return !isNaN(parsed) && parsed >= 0 ? parsed : false;
};

const parseBooleanEnv = (envKey, fallback) => {
    const raw = process.env[envKey];
    if (raw === undefined || raw === '') return fallback;

    return raw.toLowerCase() === 'true';
};

module.exports = {
    PORT: process.env.PORT || 3000,
    IS_PRODUCTION: isProduction,
    API_PREFIX: '/api/v1',
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    CORS_ORIGINS,
    TRUST_PROXY: parseTrustProxy(),
    JWT_SECRET: process.env.JWT_SECRET || 'super_secret_earth_fate_key_change_in_production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    BCRYPT_SALT_ROUNDS: saltRounds,
    EXPRESS_JSON_LIMIT: '10kb',
    // Google Sheets is the datastore: the spreadsheet holds the rows and
    // utils/store.js is the only file that knows how to talk to it. The id is
    // the middle segment of the spreadsheet URL, and the credentials come from
    // a service account key (either the two fields copied out of it, or the
    // whole JSON pasted on one line).
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY || '',
    GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
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
    HSTS: {
        MAX_AGE: 15552000,
        // includeSubDomains and preload are both irreversible in practice: a
        // browser that has seen the header will refuse plain HTTP to the domain
        // and its subdomains for as long as max-age lasts, and preload makes it
        // near-impossible to undo. Both stay off unless someone knows the whole
        // domain is on HTTPS, including things like internal admin hosts.
        INCLUDE_SUBDOMAINS: parseBooleanEnv('HSTS_INCLUDE_SUBDOMAINS', false),
        PRELOAD: parseBooleanEnv('HSTS_PRELOAD', false),
    },
};
