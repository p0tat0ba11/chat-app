const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const nodemailer = require('nodemailer');

const router = express.Router();

// In-memory store for 2FA tokens
const authTokens = {}; // { [username]: { token, expiresAt } }

function generateToken() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function send2FAToken(email, token) {
    return transporter.sendMail({
        from: `"Chat App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your 2FA Verification Code',
        text: `Your verification code is: ${token}`
    });
}

router.post('/signup', (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Missing username, password, or email' });
    }

    const password_hash = bcrypt.hashSync(password, 10);

    try {
        db.prepare(`
            INSERT INTO users (username, password_hash, email)
            VALUES (?, ?, ?)
        `).run(username, password_hash, email);

        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Username already taken' });
        }
        res.status(500).json({ error: 'Signup failed' });
    }
});

router.post('/signin', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins expiry
    authTokens[username] = { token, expiresAt };

    send2FAToken(user.email, token)
        .then(() => res.json({ step: '2fa' }))
        .catch((err) => {
            console.error('Failed to send 2FA email:', err);
            res.status(500).json({ error: 'Failed to send 2FA token' });
        });
});

router.post('/verify-token', (req, res) => {
    const { username, token } = req.body;
    const record = authTokens[username];

    if (!record || record.token !== token || Date.now() > record.expiresAt) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    delete authTokens[username];

    const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);

    res.json({
        message: 'Login successful',
        username: user.username,
    });
});

module.exports = router;
