const express = require('express');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const { DEFAULT_MONSTER } = require('../config');
const {
    findCharacter,
    getRandomCharacter,
    createCharacter,
    updateCharacter,
} = require('../utils/store');
const { validateCharacterName, validateCharacterStats } = require('../utils/validators');

const router = express.Router();

router.get('/getRandomChar', async (req, res, next) => {
    try {
        const character = await getRandomCharacter();

        if (!character) {
            return res.status(200).json(DEFAULT_MONSTER);
        }

        res.status(200).json(character);
    } catch (error) {
        next(error);
    }
});

router.post('/createCharacter', authMiddleware, async (req, res, next) => {
    try {
        const { name, atk, intelligence, health, isMonster } = req.body;
        const userId = req.user.id;

        const nameCheck = validateCharacterName(name);
        if (!nameCheck.valid) {
            return res.status(400).json({ success: false, message: nameCheck.message });
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
            idPlayer: userId,
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

router.post('/updateCharacter', authMiddleware, async (req, res, next) => {
    try {
        const { characterId, name, atk, intelligence, health } = req.body;
        const userId = req.user.id;

        if (!characterId) {
            return res.status(400).json({ success: false, message: 'characterId is required' });
        }

        const nameCheck = validateCharacterName(name);
        if (!nameCheck.valid) {
            return res.status(400).json({ success: false, message: nameCheck.message });
        }

        const statsCheck = validateCharacterStats(atk, intelligence, health);
        if (!statsCheck.valid) {
            return res.status(400).json({ success: false, message: statsCheck.message });
        }

        const character = await findCharacter(characterId);

        if (!character) {
            return res.status(404).json({ success: false, message: 'Character not found' });
        }

        if (character.idPlayer !== userId) {
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
