const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const AppError = require('../utils/appError');

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(AppError.unauthorized('Authentication token is required'));
    }

    const token = authHeader.split(' ')[1];

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        return next(AppError.unauthorized('Invalid or expired token'));
    }
}

module.exports = authMiddleware;
