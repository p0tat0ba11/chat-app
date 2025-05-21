const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');

const router = express.Router();

// Signup
router.post('/signup', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

    const password_hash = bcrypt.hashSync(password, 10);

    try {
        db.prepare(`INSERT INTO users (username, password_hash) VALUES (?, ?)`).run(username, password_hash);
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Username already taken' });
        }
        res.status(500).json({ error: 'Signup failed' });
    }
});

// Signin
router.post('/signin', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
        message: 'Login successful',
        username: user.username,
        join_line: user.join_line
    });
});

module.exports = router;
