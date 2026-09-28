require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const {
    PORT,
    IS_PRODUCTION,
    CORS_ORIGIN,
    EXPRESS_JSON_LIMIT,
    API_PREFIX,
    RATE_LIMITS,
    HSTS,
    TRUST_PROXY,
} = require('./config');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');
const healthRoutes = require('./routes/health');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// Building the app inside a function is what lets a test make an app with
// different settings, instead of having to reload this whole module.
const createApp = ({ rateLimits = RATE_LIMITS } = {}) => {
    const app = express();

    // Without this the client IP is the reverse proxy's own address, so every
    // visitor would share a single rate-limit bucket. See .env.example.
    app.set('trust proxy', TRUST_PROXY);

    const corsOptions =
        CORS_ORIGIN && CORS_ORIGIN !== '*'
            ? { origin: CORS_ORIGIN.split(',').map((o) => o.trim()) }
            : {};

    app.use(
        helmet({
            // JSON-only API, no HTML is served so CSP would only get in the way
            contentSecurityPolicy: false,
            // CORS is handled by the cors middleware below
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            // HSTS is only honoured over HTTPS, so it is enabled for production only
            strictTransportSecurity: IS_PRODUCTION
                ? { maxAge: HSTS.MAX_AGE, includeSubDomains: HSTS.INCLUDE_SUBDOMAINS }
                : false,
        }),
    );

    const uncompressedPaths = new Set([`${API_PREFIX}/auth/signup`, `${API_PREFIX}/auth/login`]);

    app.use(
        compression({
            filter: (req, res) => {
                if (uncompressedPaths.has(req.path) || req.headers.authorization) {
                    return false;
                }
                return compression.filter(req, res);
            },
        }),
    );

    app.use(cors(corsOptions));
    app.use(express.json({ limit: EXPRESS_JSON_LIMIT }));
    app.use(express.urlencoded({ extended: true, limit: EXPRESS_JSON_LIMIT }));

    const buildLimiter = (limit, message) =>
        rateLimit({
            windowMs: limit.WINDOW_MS,
            limit: limit.MAX_REQUESTS,
            standardHeaders: 'draft-7',
            legacyHeaders: false,
            message: { error: message },
            // Log a loud error when the proxy configuration makes these limits
            // meaningless. It does not stop the request, so watch the logs for it.
            validate: { trustProxy: true, xForwardedForHeader: true },
        });

    // The auth limiter is registered after the general one, so auth requests are
    // counted against both and the stricter of the two is the one that answers.
    app.use(buildLimiter(rateLimits.GENERAL, 'Too many requests, please try again later.'));
    app.use(
        `${API_PREFIX}/auth`,
        buildLimiter(rateLimits.AUTH, 'Too many authentication attempts, please try again later.'),
    );

    app.use('/health', healthRoutes);

    app.use(`${API_PREFIX}/auth`, authRoutes);
    app.use(`${API_PREFIX}/characters`, characterRoutes);

    app.use(notFound);
    app.use(errorHandler);

    return app;
};

const startServer = () => {
    const app = createApp();

    app.listen(PORT, () => {
        logger.info(`API running at http://localhost:${PORT}`);
        logger.info(`Available endpoints:`);
        logger.info(`   GET    http://localhost:${PORT}/health`);
        logger.info(`   POST   http://localhost:${PORT}${API_PREFIX}/auth/signup`);
        logger.info(`   POST   http://localhost:${PORT}${API_PREFIX}/auth/login`);
        logger.info(`   GET    http://localhost:${PORT}${API_PREFIX}/characters/random`);
        logger.info(`   GET    http://localhost:${PORT}${API_PREFIX}/characters`);
        logger.info(`   POST   http://localhost:${PORT}${API_PREFIX}/characters`);
        logger.info(`   GET    http://localhost:${PORT}${API_PREFIX}/characters/:id`);
        logger.info(`   PATCH  http://localhost:${PORT}${API_PREFIX}/characters/:id`);
        logger.info(`   DELETE http://localhost:${PORT}${API_PREFIX}/characters/:id`);
    });
};

// Requiring this file builds an app; running it starts the server.
if (require.main === module) {
    startServer();
}

module.exports = { createApp, startServer };
