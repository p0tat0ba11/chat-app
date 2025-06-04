const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const authTokens = {}; // 暫存 2FA token: { [username]: { token, expiresAt } }

// 清除超過 10 分鐘的 token
setInterval(() => {
    const now = Date.now();
    for (const username in authTokens) {
        if (now > authTokens[username].expiresAt + 5 * 60 * 1000) {
            delete authTokens[username];
            console.log(`已清除過期 token: ${username}`);
        }
    }
}, 60 * 1000);

// ✅ 產生 6 碼驗證碼
function generateToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ 檢查密碼強度
function isStrongPassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

// ✅ 寄送驗證信
function send2FAToken(email, token) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });

    return transporter.sendMail({
        from: `"Chat App" <${EMAIL_USER}>`,
        to: email,
        subject: 'Your 2FA Code',
        text: `Your 2FA verification code is: ${token}`
    });
}

// ✅ 註冊
router.post('/signup', (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ error: '缺少資料' });
    }

    if (!isStrongPassword(password)) {
        return res.status(400).json({
            error: '密碼強度不足，需含大寫、小寫、數字且至少 8 碼'
        });
    }

    const hash = bcrypt.hashSync(password, 10);
    const userId = crypto.randomUUID();

    try {
        // 檢查 email 和 userId 是否重複
        const checkEmail = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
        if (checkEmail) return res.status(409).json({ error: 'Email 已被使用' });

        const checkId = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
        if (checkId) return res.status(409).json({ error: '請稍後再試（userId 重複）' });

        db.prepare(`
            INSERT INTO users (id, username, password_hash, email)
            VALUES (?, ?, ?, ?)
        `).run(userId, username, hash, email);

        res.status(201).json({ message: '註冊成功' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '註冊失敗' });
    }
});

// ✅ 登入 → 2FA
router.post('/signin', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    const token = generateToken();
    authTokens[username] = {
        token,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 分鐘
    };

    send2FAToken(user.email, token)
        .then(() => res.json({ step: '2fa' }))
        .catch((err) => {
            console.error('寄送 2FA 失敗:', err);
            res.status(500).json({ error: '無法寄送驗證碼' });
        });
});

// ✅ 驗證 2FA 並產生 JWT
router.post('/verify-token', (req, res) => {
    const { username, token } = req.body;
    const record = authTokens[username];

    if (!record || record.token !== token || Date.now() > record.expiresAt) {
        return res.status(401).json({ error: '驗證碼錯誤或已過期' });
    }

    delete authTokens[username];

    const user = db.prepare(`SELECT id, username FROM users WHERE username = ?`).get(username);
    if (!user) return res.status(404).json({ error: '找不到使用者' });

    const jwtToken = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.cookie('token', jwtToken, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
        message: '登入成功',
        id: user.id,
        token: jwtToken,
    });
});

module.exports = router;
module.exports.isStrongPassword = isStrongPassword;
