// The message is sent to the client verbatim by the error handler, so it must
// always be a short literal written here. Never pass a database message or
// anything taken from an error object: that would leak internals.
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.isOperational = true;
    }

    static badRequest(message) {
        return new AppError(400, message);
    }

    static unauthorized(message) {
        return new AppError(401, message);
    }

    static forbidden(message) {
        return new AppError(403, message);
    }

    static notFound(message) {
        return new AppError(404, message);
    }

    static conflict(message) {
        return new AppError(409, message);
    }
}

module.exports = AppError;
