const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const router = express.Router();
const db = require('../db'); // better-sqlite3 instance

const ICON_PATH = path.join(__dirname, '../public/icons');
const DEFAULT_ICON_PATH = path.join(ICON_PATH, 'default');
const CUSTOM_ICON_PATH = path.join(ICON_PATH, 'custom');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, CUSTOM_ICON_PATH);
    },
    filename: (req, file, cb) => {
        const username = req.params.username;
        const ext = path.extname(file.originalname);
        cb(null, `${username}-${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });

// GET /user/default-icon
router.get('/default-icon', (req, res) => {
    fs.readdir(DEFAULT_ICON_PATH, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read default icons', detail: err.message });
        }
        if (!files || files.length === 0) {
            return res.status(404).json({ error: 'No default icons found' });
        }
        files = files.map(file => file)
        res.json(files);
    });
});

// GET /user/:username
router.get('/:username', (req, res) => {
    const user = db.prepare(`SELECT username, avatar FROM users WHERE username = ?`).get(req.params.username);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({
        username: user.username,
        avatar: user.avatar || 'default/smile.png',
    });
});

// PATCH /user/:username
router.patch('/:username', upload.single('avatar'), (req, res) => {
    const { username } = req.params;
    const { newUsername, password, selectedPhoto } = req.body;

    const user = db.prepare(`SELECT * FROM users WHERE username = ?`).get(username);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    const updateFields = [];

    // 處理名稱更新
    if (newUsername && newUsername !== username) {
        const nameTaken = db.prepare(`SELECT * FROM users WHERE username = ?`).get(newUsername);
        if (nameTaken) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        updates.username = newUsername;
        updateFields.push(`username = @username`);
    }

    // 處理密碼更新
    if (password) {
        const hashed = bcrypt.hashSync(password, 10);
        updates.password_hash = hashed; // 對應資料庫欄位
        updateFields.push(`password_hash = @password_hash`); // SQL 欄位名稱與參數一致
    }

    // 處理頭像更新
    let newAvatarPath = null;
    if (req.file) {
        newAvatarPath = `custom/${req.file.filename}`;
    } else if (selectedPhoto) {
        const selectedPath = path.join(DEFAULT_ICON_PATH, selectedPhoto);
        if (fs.existsSync(selectedPath)) {
            newAvatarPath = `default/${selectedPhoto}`;
        } else {
            return res.status(400).json({ error: 'Invalid selected photo' });
        }
    }

    if (newAvatarPath) {
        // 刪除原本 custom 圖片
        if (user.avatar && user.avatar.startsWith('custom/')) {
            const oldPath = path.join(CUSTOM_ICON_PATH, path.basename(user.avatar));
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        updates.avatar = newAvatarPath;
        updateFields.push(`avatar = @avatar`);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
    }

    const stmt = db.prepare(`
        UPDATE users SET ${updateFields.join(', ')} WHERE username = @originalUsername
    `);

    stmt.run({ ...updates, originalUsername: username });

    res.json({
        message: 'Profile updated successfully',
        updates: {
            username: updates.username || username,
            avatar: updates.avatar || user.avatar
        }
    });
});

module.exports = router;
