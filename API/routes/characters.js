const express = require('express');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const { DEFAULT_MONSTER } = require('../config');
const store = require('../utils/store');
const AppError = require('../utils/appError');
const {
    validateResourceId,
    validateCharacterName,
    validateCharacterStats,
    validateCharacterPatch,
} = require('../utils/validators');

const router = express.Router();

const assertValid = (check) => {
    if (!check.valid) throw AppError.badRequest(check.message);
};

// Validates the id before it ever reaches the database, so a malformed id is a
// 400 instead of a database error.
const findCharacterOrFail = async (id) => {
    assertValid(validateResourceId(id));

    const character = await store.findCharacter(id);
    if (!character) throw AppError.notFound('Character not found');

    return character;
};

// Answering 404 instead of 403 keeps the API from confirming that a character
// owned by someone else exists.
const assertOwnership = (character, userId) => {
    if (character.idPlayer !== userId) {
        throw AppError.notFound('Character not found');
    }
};

router.get('/random', async (req, res) => {
    const character = await store.getRandomCharacter();

    res.status(200).json(character || DEFAULT_MONSTER);
});

router.get('/', authMiddleware, async (req, res) => {
    const characters = await store.findCharactersByPlayer(req.user.id);

    res.status(200).json(characters);
});

router.post('/', authMiddleware, async (req, res) => {
    const { name, atk, intelligence, health } = req.body;

    assertValid(validateCharacterName(name));
    assertValid(validateCharacterStats(atk, intelligence, health));

    const character = await store.createCharacter({
        id: crypto.randomUUID(),
        name: name.trim(),
        atk,
        intelligence,
        health,
        // Monsters are seeded in the database, never chosen by the caller.
        isMonster: false,
        img: 'hero.png',
        idPlayer: req.user.id,
    });

    res.location(`${req.baseUrl}/${character.id}`).status(201).json(character);
});

router.get('/:id', async (req, res) => {
    const character = await findCharacterOrFail(req.params.id);

    res.status(200).json(character);
});

router.patch('/:id', authMiddleware, async (req, res) => {
    const { name, atk, intelligence, health } = req.body;

    assertValid(validateCharacterPatch({ name, atk, intelligence, health }));

    const character = await findCharacterOrFail(req.params.id);
    assertOwnership(character, req.user.id);

    const fields = {};
    if (name !== undefined) fields.name = name.trim();
    if (atk !== undefined) fields.atk = atk;
    if (intelligence !== undefined) fields.intelligence = intelligence;
    if (health !== undefined) fields.health = health;

    const updated = await store.updateCharacter(req.params.id, fields);

    res.status(200).json(updated);
});

router.delete('/:id', authMiddleware, async (req, res) => {
    const character = await findCharacterOrFail(req.params.id);
    assertOwnership(character, req.user.id);

    await store.deleteCharacter(req.params.id);

    res.status(204).send();
});

module.exports = router;
