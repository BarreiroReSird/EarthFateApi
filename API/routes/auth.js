const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { users } = require('../utils/store');
const { validateCredentials } = require('../utils/validators');

const router = express.Router();

router.post('/signup', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        const credCheck = validateCredentials(username, password);
        if (!credCheck.valid) {
            return res.status(400).json({ success: false, message: credCheck.message });
        }

        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'The user already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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

router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        const user = users.find(u => u.username === username);

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

module.exports = router;
