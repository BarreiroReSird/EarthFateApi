const isTest = process.env.NODE_ENV === 'test';

const formatMessage = (level, message) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
};

const logger = {
    info: (message, ...args) => {
        if (!isTest) {
            console.log(formatMessage('info', message), ...args);
        }
    },
    warn: (message, ...args) => {
        if (!isTest) {
            console.warn(formatMessage('warn', message), ...args);
        }
    },
    error: (message, ...args) => {
        if (!isTest) {
            console.error(formatMessage('error', message), ...args);
        }
    },
    debug: (message, ...args) => {
        if (!isTest && process.env.NODE_ENV === 'development') {
            console.debug(formatMessage('debug', message), ...args);
        }
    },
};

module.exports = logger;
