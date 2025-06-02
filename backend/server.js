require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const db = require('./db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const friendRoutes = require('./routes/friend');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/friends', friendRoutes);
app.use(express.static('public'));
app.use('/icon', express.static(path.join(__dirname, 'public/icons')));


// Public chat messages (broadcast)
app.get('/chat', (req, res) => {
    const messages = db.prepare(`
        SELECT messages.id, users.username, messages.text, messages.timestamp
        FROM messages
        JOIN users ON messages.user_id = users.id
        ORDER BY messages.id ASC
    `).all();
    res.json(messages);
});


app.post('/chat', (req, res) => {
    const { user, text } = req.body;
    if (!user || !text) {
        return res.status(400).json({ error: 'Missing user or text' });
    }

    const userRecord = db.prepare(`SELECT id FROM users WHERE username = ?`).get(user);
    if (!userRecord) {
        return res.status(404).json({ error: 'User not found' });
    }

    const timestamp = new Date().toISOString();
    const insert = db.prepare(`INSERT INTO messages (user_id, text, timestamp) VALUES (?, ?, ?)`);
    const result = insert.run(userRecord.id, text, timestamp);

    const newMessage = { id: result.lastInsertRowid, username: user, text, timestamp };
    io.emit('newMessage', newMessage);
    res.status(201).json(newMessage);
});

// Clear history for front-end only (not deleting messages)
app.post('/chat/clear-history', (req, res) => {
    res.json({ message: 'History cleared (client only)' });
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
