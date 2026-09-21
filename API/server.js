require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = corsOrigin && corsOrigin !== '*'
    ? { origin: corsOrigin.split(',').map((o) => o.trim()) }
    : {};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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
        console.log(`API running at http://localhost:${PORT}`);
        console.log(`Available endpoints:`);
        console.log(`   POST http://localhost:${PORT}/signup`);
        console.log(`   POST http://localhost:${PORT}/login`);
        console.log(`   GET  http://localhost:${PORT}/getRandomChar`);
        console.log(`   POST http://localhost:${PORT}/createCharacter`);
        console.log(`   GET  http://localhost:${PORT}/getChar?characterId=ID`);
        console.log(`   POST http://localhost:${PORT}/updateCharacter`);
    });
}

module.exports = app;
