const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { users, characters } = require('../utils/store');
const { validateCharacterStats } = require('../utils/validators');

const router = express.Router();

router.get('/getRandomChar', (req, res, next) => {
    try {
        if (characters.length === 0) {
            const randomChar = {
                id: 'monster_1',
                name: 'Dragon',
                atk: Math.floor(Math.random() * 20) + 10,
                intelligence: Math.floor(Math.random() * 20) + 10,
                health: Math.floor(Math.random() * 50) + 50,
                isMonster: true,
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

router.post('/createCharacter', async (req, res, next) => {
    try {
        const { name, atk, intelligence, health, username, password, isMonster } = req.body;

        const user = users.find(u => u.username === username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Name must have at least 2 characters' });
        }
        const statsCheck = validateCharacterStats(atk, intelligence, health);
        if (!statsCheck.valid) {
            return res.status(400).json({ success: false, message: statsCheck.message });
        }

        const newChar = {
            id: crypto.randomUUID(),
            name: name.trim(),
            atk,
            intelligence,
            health,
            isMonster: Boolean(isMonster),
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

router.get('/getChar', (req, res, next) => {
    try {
        const characterId = req.query.characterId;

        if (!characterId) {
            return res.status(400).json({ success: false, message: 'characterId is required' });
        }

        const character = characters.find(c => c.id === characterId);

        if (!character) {
            return res.status(404).json({ success: false, message: 'Character not found' });
        }

        res.status(200).json(character);
    } catch (error) {
        next(error);
    }
});

router.post('/updateCharacter', async (req, res, next) => {
    try {
        const { characterId, name, atk, intelligence, health, username, password } = req.body;

        const user = users.find(u => u.username === username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!characterId) {
            return res.status(400).json({ success: false, message: 'characterId is required' });
        }
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Name must have at least 2 characters' });
        }
        const statsCheck = validateCharacterStats(atk, intelligence, health);
        if (!statsCheck.valid) {
            return res.status(400).json({ success: false, message: statsCheck.message });
        }

        const charIndex = characters.findIndex(c => c.id === characterId);

        if (charIndex === -1) {
            return res.status(404).json({ success: false, message: 'Character not found' });
        }

        if (characters[charIndex].idPlayer !== user.id) {
            return res.status(403).json({ success: false, message: 'You do not have permission to edit this character' });
        }

        characters[charIndex] = {
            ...characters[charIndex],
            name: name.trim(),
            atk,
            intelligence,
            health
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

module.exports = router;
