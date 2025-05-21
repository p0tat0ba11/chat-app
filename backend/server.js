// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);

// Chat message routes
app.get('/chat', (req, res) => {
    const username = req.query.user;

    if (!username) return res.status(400).json({ error: 'Missing user' });

    const user = db.prepare(`SELECT join_line FROM users WHERE username = ?`).get(username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const messages = db.prepare(`
        SELECT * FROM messages WHERE id >= ? ORDER BY id ASC
    `).all(user.join_line || 0);

    res.json(messages);
});

app.post('/chat', (req, res) => {
    const { user, text } = req.body;
    if (!user || !text) {
        return res.status(400).json({ error: 'Missing user or text' });
    }

    const timestamp = new Date().toISOString();
    const insert = db.prepare(`INSERT INTO messages (user, text, timestamp) VALUES (?, ?, ?)`);
    const result = insert.run(user, text, timestamp);

    const newMessage = { id: result.lastInsertRowid, user, text, timestamp };
    io.emit('newMessage', newMessage);
    res.status(201).json(newMessage);
});

app.post('/chat/clear-history', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Missing username' });

    const lastMessage = db.prepare(`SELECT id FROM messages ORDER BY id DESC LIMIT 1`).get();
    const lastId = lastMessage?.id || 0;

    db.prepare(`UPDATE users SET join_line = ? WHERE username = ?`).run(lastId, username);

    res.json({ message: 'History cleared', new_join_line: lastId });
});

// Logger
app.use((req, _res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
