const express = require('express');
const db = require('../db'); // better-sqlite3 instance
const router = express.Router();

// 取得好友清單 (GET /friends/:userId)
router.get('/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    console.log('取得好友清單:', userId);
    const stmt = db.prepare(`
        SELECT u.id, u.username, u.avatar
        FROM friends f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ?
    `);
    const friends = stmt.all(userId);
    res.json(friends);
});

// 搜尋使用者 (GET /friends/search?query=xxx)
router.get('/search/user', (req, res) => {
    const query = req.query.query?.trim();
    console.log('搜尋使用者:', query);
    if (!query) return res.status(400).json({ error: '請輸入搜尋內容' });

    const stmt = db.prepare(`
        SELECT id, username, avatar FROM users
        WHERE username LIKE ? LIMIT 10
    `);
    const users = stmt.all(`%${query}%`);
    console.log('搜尋結果:', users);
    res.json(users);
});

// 新增好友 (POST /friends/add)
router.post('/add', (req, res) => {
    const { userId, friendId } = req.body;
    console.log('新增好友:', userId, friendId);
    if (!userId || !friendId || userId === friendId) {
        return res.status(400).json({ error: '無效的好友資訊' });
    }

    const userExists = db.prepare(`SELECT id FROM users WHERE id = ?`).get(friendId);
    if (!userExists) {
        return res.status(404).json({ error: '好友不存在' });
    }

    const insert = db.prepare(`INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)`);
    insert.run(userId, friendId);
    insert.run(friendId, userId); // 雙向加入好友

    res.json({ success: true });
});

module.exports = router;
