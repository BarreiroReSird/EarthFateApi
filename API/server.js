const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DATABASE ====================

// TODO: Replace in-memory storage with a persistent database;
let users = [];
let characters = [];

// ==================== VERIFICATION ====================

const validateCredentials = (username, password) => {
    if (!username || username.length < 3) {
        return { valid: false, message: 'The username must be at least 3 characters long' };
    }
    if (!password || password.length < 6) {
        return { valid: false, message: 'The password must be at least 6 characters long' };
    }
    return { valid: true };
};

const validateCharacterStats = (atk, int, vida) => {
    if (typeof atk !== 'number' || atk < 0 || atk > 100) {
        return { valid: false, message: 'ATK must be a number between 0 and 100' };
    }
    if (typeof int !== 'number' || int < 0 || int > 100) {
        return { valid: false, message: 'INT must be a number between 0 and 100' };
    }
    if (typeof vida !== 'number' || vida < 1 || vida > 500) {
        return { valid: false, message: 'VIDA (HEALTH) must be a number between 1 and 500' };
    }
    return { valid: true };
};

// ==================== AUTHENTICATION ====================

// Registration with password hash (bcrypt)
app.post('/signup', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validation
        const credCheck = validateCredentials(username, password);
        if (!credCheck.valid) {
            return res.status(400).json({ success: false, message: credCheck.message });
        }

        // Checks for duplicates (Status code 409)
        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'The user already exists' });
        }

        // Password hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // Unique ID using crypto
        const newUser = {
            id: crypto.randomUUID(),
            username,
            password: hashedPassword
        };

        users.push(newUser);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            userId: newUser.id,
            username: newUser.username
        });
    } catch (error) {
        next(error);
    }
});

// Login with hash verification
app.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        const user = users.find(u => u.username === username);

        // If it cannot be found or the password does not match
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            userId: user.id,
            username: user.username
        });
    } catch (error) {
        next(error);
    }
});

// ==================== CHARACTERS ====================

app.get('/getRandomChar', (req, res, next) => {
    try {
        if (characters.length === 0) {
            // Default NPC
            const randomChar = {
                id: 'monster_1',
                name: 'Dragon',
                atk: Math.floor(Math.random() * 20) + 10,
                int: Math.floor(Math.random() * 20) + 10,
                vida: Math.floor(Math.random() * 50) + 50,
                isMonster: 'true',
                img: 'dragon.png',
                idPlayer: 'npc'
            };
            return res.status(200).json(randomChar);
        }

        const randomIndex = Math.floor(Math.random() * characters.length);
        res.status(200).json(characters[randomIndex]);
    } catch (error) {
        next(error);
    }
});

app.post('/createChart', async (req, res, next) => {
    try {
        const { name, atk, int, vida, username, password, isMonster } = req.body;

        // Check credentials first
        const user = users.find(u => u.username === username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check the character's stats
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Name must have at least 2 characters' });
        }
        const statsCheck = validateCharacterStats(atk, int, vida);
        if (!statsCheck.valid) {
            return res.status(400).json({ success: false, message: statsCheck.message });
        }

        // Generate unique ID
        const newChar = {
            id: crypto.randomUUID(),
            name: name.trim(),
            atk,
            int,
            vida,
            isMonster: isMonster || 'false',
            img: 'hero.png',
            idPlayer: user.id
        };

        characters.push(newChar);

        res.status(201).json({
            success: true,
            message: 'Character successfully created',
            character: newChar
        });
    } catch (error) {
        next(error);
    }
});

app.get('/getChar', (req, res, next) => {
    try {
        const PlayerID = req.query.PlayerID;

        if (!PlayerID) {
            return res.status(400).json({ success: false, message: 'PlayerID is required' });
        }

        const character = characters.find(c => c.id === PlayerID);

        if (!character) {
            return res.status(404).json({ success: false, message: 'Character not found' });
        }

        res.status(200).json(character);
    } catch (error) {
        next(error);
    }
});

app.post('/updateChart', async (req, res, next) => {
    try {
        const { idChar, name, atk, int, vida, username, password, isMonster } = req.body;

        // Check credentials
        const user = users.find(u => u.username === username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Validate input data
        if (!idChar) {
            return res.status(400).json({ success: false, message: 'idChar is required' });
        }
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Name must have at least 2 characters' });
        }
        const statsCheck = validateCharacterStats(atk, int, vida);
        if (!statsCheck.valid) {
            return res.status(400).json({ success: false, message: statsCheck.message });
        }

        // Search the character
        const charIndex = characters.findIndex(c => c.id === idChar);

        if (charIndex === -1) {
            return res.status(404).json({ success: false, message: 'Character not found' });
        }

        // Checks whether the character belongs to the authenticated user
        if (characters[charIndex].idPlayer !== user.id) {
            return res.status(403).json({ success: false, message: 'You do not have permission to edit this character' });
        }

        // Updates
        characters[charIndex] = {
            ...characters[charIndex],
            name: name.trim(),
            atk,
            int,
            vida
        };

        res.status(200).json({
            success: true,
            message: 'Character updated successfully.',
            character: characters[charIndex]
        });
    } catch (error) {
        next(error);
    }
});

// ==================== GLOBAL ERROR MIDDLEWARE ====================

// This middleware captures any error that has been passed with next(error)
app.use((err, req, res, next) => {
    console.error('Internal error:', err.stack || err.message);

    res.status(500).json({
        success: false,
        message: 'An internal error occurred, please try again later'
    });
});

// ==================== SERVER ====================

app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
    console.log(`Available endpoints (improved version):`);
    console.log(`   POST http://localhost:${PORT}/signup   (with bcrypt + validation)`);
    console.log(`   POST http://localhost:${PORT}/login    (with bcrypt)`);
    console.log(`   GET  http://localhost:${PORT}/getRandomChar`);
    console.log(`   POST http://localhost:${PORT}/createChart (with stats validation)`);
    console.log(`   GET  http://localhost:${PORT}/getChar?PlayerID=ID`);
    console.log(`   POST http://localhost:${PORT}/updateChart (with owner permission check)`);
});