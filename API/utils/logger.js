const SENSITIVE_KEYS = new Set([
    'password',
    'token',
    'secret',
    'authorization',
    'jwt',
    'apikey',
    'key',
]);

const sanitize = (val) => {
    if (val === null || val === undefined) return val;
    if (typeof val === 'string') return val;
    if (typeof val !== 'object') return val;

    if (Array.isArray(val)) {
        return val.map(sanitize);
    }

    const sanitizedObj = {};
    for (const [key, value] of Object.entries(val)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
            sanitizedObj[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
            sanitizedObj[key] = sanitize(value);
        } else {
            sanitizedObj[key] = value;
        }
    }
    return sanitizedObj;
};

const formatMessage = (level, message) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
};

const logger = {
    sanitize,
    info: (message, ...args) => {
        if (process.env.NODE_ENV !== 'test') {
            console.log(formatMessage('info', message), ...args.map(sanitize));
        }
    },
    warn: (message, ...args) => {
        if (process.env.NODE_ENV !== 'test') {
            console.warn(formatMessage('warn', message), ...args.map(sanitize));
        }
    },
    error: (message, ...args) => {
        if (process.env.NODE_ENV !== 'test') {
            console.error(formatMessage('error', message), ...args.map(sanitize));
        }
    },
    debug: (message, ...args) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(formatMessage('debug', message), ...args.map(sanitize));
        }
    },
};

module.exports = logger;

