const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } = require('../config');
const { findUserByUsername, createUser } = require('../utils/store');
const { validateCredentials } = require('../utils/validators');

const router = express.Router();

router.post('/signup', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const credCheck = validateCredentials(username, password);
        if (!credCheck.valid) {
            return res.status(400).json({ success: false, message: credCheck.message });
        }

        const existingUser = await findUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        const newUser = await createUser({
            id: crypto.randomUUID(),
            username,
            password: hashedPassword,
        });

        const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            userId: newUser.id,
            username: newUser.username,
        });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const credCheck = validateCredentials(username, password);
        if (!credCheck.valid) {
            return res.status(400).json({ success: false, message: credCheck.message });
        }

        const user = await findUserByUsername(username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            userId: user.id,
            username: user.username,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
