// routes/friend.js
const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/chat', authenticate, (req, res) => {
    const { friendId } = req.query;
    console.log('Fetching chat for friendId:', friendId);
    const userId = req.user.id;

    if (!friendId) return res.status(400).json({ error: '缺少好友參數' });

    const stmt = db.prepare(`
        SELECT sender_id, receiver_id, message, timestamp
        FROM private_messages
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY id ASC
    `);
    const messages = stmt.all(userId, friendId, friendId, userId);
    res.json(messages);
});

router.post('/chat', authenticate, (req, res) => {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !message) {
        return res.status(400).json({ error: '缺少參數' });
    }

    const timestamp = new Date().toISOString();
    const result = db.prepare(`
        INSERT INTO private_messages (sender_id, receiver_id, message, timestamp)
        VALUES (?, ?, ?, ?)
    `).run(senderId, receiverId, message, timestamp);

    res.status(201).json({
        id: result.lastInsertRowid,
        sender_id: senderId,
        receiver_id: receiverId,
        message,
        timestamp
    });
});

router.get('/', authenticate, (req, res) => {
    const userId = req.user.id;
    const friends = db.prepare(`
        SELECT u.id, u.username, u.avatar
        FROM friends f
        JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ?
    `).all(userId);
    if (!friends.length) {
        return res.status(404).json({ error: '沒有好友' });
    }
    res.json(friends);
});

router.get('/search/user', (req, res) => {
    const query = req.query.query?.trim();
    if (!query) return res.status(400).json({ error: '請輸入搜尋內容' });

    const users = db.prepare(`
        SELECT id, username, avatar FROM users
        WHERE username LIKE ? LIMIT 10
    `).all(`%${query}%`);
    res.json(users);
});

router.post('/add', authenticate, (req, res) => {
    const { friendId } = req.body;
    const userId = req.user.id;

    if (!friendId || userId === friendId) {
        return res.status(400).json({ error: '無效好友 ID' });
    }

    const exists = db.prepare(`SELECT id FROM users WHERE id = ?`).get(friendId);
    if (!exists) return res.status(404).json({ error: '好友不存在' });

    const insert = db.prepare(`INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)`);
    insert.run(userId, friendId);
    insert.run(friendId, userId);

    res.json({ success: true });
});

module.exports = router;
