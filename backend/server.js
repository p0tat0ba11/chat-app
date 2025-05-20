require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const Database = require('better-sqlite3');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Initialize DB
const db = new Database('./chat.db');

// Create messages table if it doesn't exist
db.prepare(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL
    )
`).run();

// Get all messages
app.get('/chat', (req, res) => {
    try {
        const rows = db.prepare(`SELECT * FROM messages ORDER BY id ASC`).all();
        res.json(rows);
    } catch (err) {
        console.error('DB error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Post a new message
app.post('/chat', (req, res) => {
    const { user, text } = req.body;
    if (!user || !text) {
        return res.status(400).json({ error: 'Missing user or text' });
    }

    const timestamp = new Date().toISOString();
    const insert = db.prepare(`
        INSERT INTO messages (user, text, timestamp) 
        VALUES (?, ?, ?)
    `);

    try {
        const result = insert.run(user, text, timestamp);
        const newMessage = { id: result.lastInsertRowid, user, text, timestamp };

        io.emit('newMessage', newMessage);
        res.status(201).json(newMessage);
    } catch (err) {
        console.error('Insert error:', err);
        res.status(500).json({ error: 'Database insert failed' });
    }
});

// Logger
app.use((req, _res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
