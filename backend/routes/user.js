const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const db = require('../db');
const { isStrongPassword } = require('./auth');
const router = express.Router();

const ICON_PATH = path.join(__dirname, '../public/icons');
const DEFAULT_ICON_PATH = path.join(ICON_PATH, 'default');
const CUSTOM_ICON_PATH = path.join(ICON_PATH, 'custom');

// 檔案上傳設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, CUSTOM_ICON_PATH),
    filename: (req, file, cb) => {
        const userId = req.user.id;
        const ext = path.extname(file.originalname);
        cb(null, `${userId}-${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });

// ✅ 取得預設頭像清單
router.get('/default-icon', (req, res) => {
    fs.readdir(DEFAULT_ICON_PATH, (err, files) => {
        if (err) return res.status(500).json({ error: '讀取失敗' });
        if (!files?.length) return res.status(404).json({ error: '沒有圖示' });
        res.json(files);
    });
});

// ✅ 取得使用者資訊（需登入）
router.get('/', authenticate, (req, res) => {
    const user = db.prepare(`SELECT id, username, avatar FROM users WHERE id = ?`).get(req.user.id);
    if (!user) return res.status(404).json({ error: '找不到使用者' });

    res.json({
        id: user.id,
        username: user.username,
        avatar: user.avatar || 'default/smile.png',
    });
});


// ✅ 更新個人資料（名稱、密碼、頭像）
router.patch('/', authenticate, upload.single('avatar'), (req, res) => {
    const { newUsername, oldPassword, newPassword, selectedPhoto } = req.body;
    const userId = req.user.id;
    const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
    if (!user) return res.status(404).json({ error: '找不到使用者' });

    const updates = {};
    const fields = [];

    // 🟢 變更名稱
    if (newUsername && newUsername !== user.username) {
        const exists = db.prepare(`SELECT id FROM users WHERE username = ?`).get(newUsername);
        if (exists) return res.status(400).json({ error: '名稱已存在' });
        updates.username = newUsername;
        fields.push('username = @username');
    }

    // 🟢 驗證舊密碼並更新新密碼
    if (newPassword) {
        if (!oldPassword) {
            return res.status(400).json({ error: '請提供舊密碼' });
        }

        const match = bcrypt.compareSync(oldPassword, user.password_hash);
        if (!match) {
            return res.status(403).json({ error: '舊密碼錯誤' });
        }

        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({ error: '密碼強度不足' });
        }

        updates.password_hash = bcrypt.hashSync(newPassword, 10);
        fields.push('password_hash = @password_hash');
    }

    // 🟢 更新頭像
    let avatarPath = null;
    if (req.file) {
        avatarPath = `custom/${req.file.filename}`;
    } else if (selectedPhoto) {
        const filePath = path.join(DEFAULT_ICON_PATH, selectedPhoto);
        if (!fs.existsSync(filePath)) return res.status(400).json({ error: '預設圖示不存在' });
        avatarPath = `default/${selectedPhoto}`;
    }

    if (avatarPath) {
        // 移除舊的 custom 頭像
        if (user.avatar?.startsWith('custom/')) {
            const oldPath = path.join(CUSTOM_ICON_PATH, path.basename(user.avatar));
            fs.unlink(oldPath, () => {});
        }
        updates.avatar = avatarPath;
        fields.push('avatar = @avatar');
    }

    if (!fields.length) {
        return res.status(400).json({ error: '沒有變更內容' });
    }

    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = @userId`)
        .run({ ...updates, userId });

    res.json({
        message: '更新成功',
        updates: {
            username: updates.username || user.username,
            avatar: updates.avatar || user.avatar
        }
    });
});

module.exports = router;
