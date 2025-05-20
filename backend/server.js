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
    try {
        const rows = db.prepare(`SELECT * FROM messages ORDER BY id ASC`).all();
        res.json(rows);
    } catch (err) {
        console.error('DB error:', err);
        res.status(500).json({ error: 'Database error' });
    }
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

// Logger
app.use((req, _res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
