require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { PORT, CORS_ORIGIN, EXPRESS_JSON_LIMIT } = require('./config');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const corsOptions =
    CORS_ORIGIN && CORS_ORIGIN !== '*'
        ? { origin: CORS_ORIGIN.split(',').map((o) => o.trim()) }
        : {};

app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: EXPRESS_JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: EXPRESS_JSON_LIMIT }));

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.',
    },
});

app.use('/signup', authLimiter);
app.use('/login', authLimiter);

app.use('/', authRoutes);
app.use('/', characterRoutes);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`API running at http://localhost:${PORT}`);
        logger.info(`Available endpoints:`);
        logger.info(`   POST http://localhost:${PORT}/signup`);
        logger.info(`   POST http://localhost:${PORT}/login`);
        logger.info(`   GET  http://localhost:${PORT}/getRandomChar`);
        logger.info(`   POST http://localhost:${PORT}/createCharacter`);
        logger.info(`   GET  http://localhost:${PORT}/getChar?characterId=ID`);
        logger.info(`   POST http://localhost:${PORT}/updateCharacter`);
    });
}

module.exports = app;
