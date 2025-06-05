require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const db = require('./db');
const { authenticate } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const friendRoutes = require('./routes/friend');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    console.log(`[${timestamp}] ${method} ${url}`);
    next();
});

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/friends', friendRoutes);
app.use(express.static('public'));
app.use('/icon', express.static(path.join(__dirname, 'public/icons')));


// 取得公開聊天訊息（需要驗證）
app.get('/chat', authenticate, (req, res) => {
    const messages = db.prepare(`
        SELECT messages.id, users.username, messages.text, messages.timestamp
        FROM messages
        JOIN users ON messages.user_id = users.id
        ORDER BY messages.id ASC
    `).all();
    res.json(messages);
});

// 發送公開訊息（需要驗證）
app.post('/chat', authenticate, (req, res) => {
    console.log('Sending chat message', req.body);
    const { text } = req.body;
    const userId = req.user.id;

    if (!text) {
        return res.status(400).json({ error: 'Missing text' });
    }

    const userRecord = db.prepare(`SELECT username FROM users WHERE id = ?`).get(userId);
    if (!userRecord) {
        return res.status(404).json({ error: 'User not found' });
    }

    const timestamp = new Date().toISOString();
    const result = db.prepare(`INSERT INTO messages (user_id, text, timestamp) VALUES (?, ?, ?)`)
        .run(userId, text, timestamp);

    const newMessage = {
        id: result.lastInsertRowid,
        username: userRecord.username,
        text,
        timestamp
    };

    io.emit('newMessage', newMessage);
    res.status(201).json(newMessage);
});

const userSocketMap = {}; // userId: socket.id

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    socket.on('privateMessage', (message) => {
        const receiverSocketId = userSocketMap[message.receiver_id];
        if (receiverSocketId) {
            socket.to(receiverSocketId).emit('privateMessage', message);
        }
    });

    socket.on('disconnect', () => {
        // 清除離線 socket
        if (userId && userSocketMap[userId] === socket.id) {
            delete userSocketMap[userId];
            console.log(`User ${userId} disconnected`);
        }
    });
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
