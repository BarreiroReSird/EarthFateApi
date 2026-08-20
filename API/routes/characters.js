const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const {
    findUserByUsername,
    findCharacter,
    getRandomCharacter,
    createCharacter,
    updateCharacter,
} = require('../utils/store');
const { validateCharacterStats } = require('../utils/validators');

const router = express.Router();

router.get('/getRandomChar', async (req, res, next) => {
    try {
        const character = await getRandomCharacter();

        if (!character) {
            const randomChar = {
                id: 'monster_1',
                name: 'Dragon',
                atk: Math.floor(Math.random() * 20) + 10,
                intelligence: Math.floor(Math.random() * 20) + 10,
                health: Math.floor(Math.random() * 50) + 50,
                isMonster: true,
                img: 'dragon.png',
                idPlayer: 'npc',
            };
            return res.status(200).json(randomChar);
        }

        res.status(200).json(character);
    } catch (error) {
        next(error);
    }
});

router.post('/createCharacter', async (req, res, next) => {
    try {
        const { name, atk, intelligence, health, username, password, isMonster } = req.body;

        const user = await findUserByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!name || name.trim().length < 2) {
            return res
                .status(400)
                .json({ success: false, message: 'Name must have at least 2 characters' });
        }
        const statsCheck = validateCharacterStats(atk, intelligence, health);
        if (!statsCheck.valid) {
            return res.status(400).json({ success: false, message: statsCheck.message });
        }

        const newChar = await createCharacter({
            id: crypto.randomUUID(),
            name: name.trim(),
            atk,
            intelligence,
            health,
            isMonster: Boolean(isMonster),
            img: 'hero.png',
            idPlayer: user.id,
        });

        res.status(201).json({
            success: true,
            message: 'Character successfully created',
            character: newChar,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/getChar', async (req, res, next) => {
    try {
        const characterId = req.query.characterId;

        if (!characterId) {
            return res.status(400).json({ success: false, message: 'characterId is required' });
        }

        const character = await findCharacter(characterId);

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

        const user = await findUserByUsername(username);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!characterId) {
            return res.status(400).json({ success: false, message: 'characterId is required' });
        }
        if (!name || name.trim().length < 2) {
            return res
                .status(400)
                .json({ success: false, message: 'Name must have at least 2 characters' });
        }
        const statsCheck = validateCharacterStats(atk, intelligence, health);
        if (!statsCheck.valid) {
            return res.status(400).json({ success: false, message: statsCheck.message });
        }

        const character = await findCharacter(characterId);

        if (!character) {
            return res.status(404).json({ success: false, message: 'Character not found' });
        }

        if (character.idPlayer !== user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this character',
            });
        }

        const updated = await updateCharacter(characterId, {
            name: name.trim(),
            atk,
            intelligence,
            health,
        });

        res.status(200).json({
            success: true,
            message: 'Character updated successfully.',
            character: updated,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
