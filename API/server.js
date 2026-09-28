require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const {
    PORT,
    IS_PRODUCTION,
    CORS_ORIGINS,
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
const createApp = ({ rateLimits = RATE_LIMITS, trustProxy = TRUST_PROXY } = {}) => {
    const app = express();

    // Without this the client IP is the reverse proxy's own address, so every
    // visitor would share a single rate-limit bucket. See .env.example.
    app.set('trust proxy', trustProxy);

    // An empty list means development with nothing configured, where cors
    // falls back to reflecting any origin. Production cannot reach this: config
    // refuses to load without an explicit list of https origins.
    const corsOptions = CORS_ORIGINS.length ? { origin: CORS_ORIGINS } : {};

    app.use(
        helmet({
            // JSON-only API, no HTML is served so CSP would only get in the way
            contentSecurityPolicy: false,
            // CORS is handled by the cors middleware below
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            // HSTS is only honoured over HTTPS, so it is enabled for production only
            strictTransportSecurity: IS_PRODUCTION
                ? {
                      maxAge: HSTS.MAX_AGE,
                      includeSubDomains: HSTS.INCLUDE_SUBDOMAINS,
                      preload: HSTS.PRELOAD,
                  }
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

    // An /auth request runs through both limiters in series: each one counts
    // the request, and whichever exceeds its limit first is the one that
    // answers, with its own message. With the defaults the auth limit (10) is
    // the lower of the two, so that is the message a user actually sees. The
    // general limiter is registered first, so it would win if it were the
    // stricter one.
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

    const server = app.listen(PORT, () => {
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

    // Node does not wait for open requests on its own: on SIGTERM (what a host
    // sends during a rolling deploy) the process would drop whatever was still
    // in flight. Stopping the listener first lets those finish.
    const shutdown = (signal) => {
        logger.info(`${signal} received, waiting for open requests before exiting...`);

        server.close(() => {
            logger.info('All connections closed, exiting.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

// Requiring this file builds an app; running it starts the server.
if (require.main === module) {
    startServer();
}

module.exports = { createApp, startServer };
