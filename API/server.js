require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const characterRoutes = require('./routes/characters');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', authRoutes);
app.use('/', characterRoutes);

app.use(errorHandler);

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
