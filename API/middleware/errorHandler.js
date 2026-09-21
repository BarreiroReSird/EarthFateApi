const logger = require('../utils/logger');

module.exports = (err, req, res, _next) => {
    logger.error('Internal error:', err.stack || err.message);

    res.status(500).json({
        success: false,
        message: 'An internal error occurred, please try again later',
    });
};
