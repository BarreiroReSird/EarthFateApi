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
} = require('./config');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');
const healthRoutes = require('./routes/health');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

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

const UNCOMPRESSED_PATHS = new Set([`${API_PREFIX}/auth/signup`, `${API_PREFIX}/auth/login`]);

app.use(
    compression({
        filter: (req, res) => {
            if (UNCOMPRESSED_PATHS.has(req.path) || req.headers.authorization) {
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
    });

app.use(buildLimiter(RATE_LIMITS.GENERAL, 'Too many requests, please try again later.'));
app.use(
    `${API_PREFIX}/auth`,
    buildLimiter(RATE_LIMITS.AUTH, 'Too many authentication attempts, please try again later.'),
);

app.use('/health', healthRoutes);

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/characters`, characterRoutes);

app.use(notFound);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
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
}

module.exports = app;
