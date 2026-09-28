const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } = require('../config');
const store = require('../utils/store');
const AppError = require('../utils/appError');
const { validateCredentials } = require('../utils/validators');

const router = express.Router();

const toSession = (user) => ({
    id: user.id,
    username: user.username,
    token: jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    }),
});

router.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    const credCheck = validateCredentials(username, password);
    if (!credCheck.valid) throw AppError.badRequest(credCheck.message);

    const existingUser = await store.findUserByUsername(username);
    if (existingUser) throw AppError.conflict('User already exists');

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await store.createUser({
        id: crypto.randomUUID(),
        username,
        password: hashedPassword,
    });

    res.status(201).json(toSession(user));
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const credCheck = validateCredentials(username, password);
    if (!credCheck.valid) throw AppError.badRequest(credCheck.message);

    const user = await store.findUserByUsername(username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw AppError.unauthorized('Invalid credentials');
    }

    res.status(200).json(toSession(user));
});

module.exports = router;
