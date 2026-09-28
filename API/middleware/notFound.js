module.exports = (req, res, _next) => {
    res.status(404).json({
        error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};
