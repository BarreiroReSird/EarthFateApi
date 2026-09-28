const logger = require('../utils/logger');
const AppError = require('../utils/appError');

const CLIENT_ERRORS = {
    'entity.parse.failed': { status: 400, message: 'Malformed JSON in request body' },
    'entity.too.large': { status: 413, message: 'Request body is too large' },
};

module.exports = (err, req, res, _next) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    const clientError = CLIENT_ERRORS[err.type];
    if (clientError) {
        return res.status(clientError.status).json({ error: clientError.message });
    }

    logger.error('Internal error:', err.stack || err.message);

    res.status(500).json({ error: 'An internal error occurred, please try again later' });
};
