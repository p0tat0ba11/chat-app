require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

const messages = [];

app.get('/chat', (req, res) => {
    res.json(messages);
});

app.post('/chat', (req, res) => {
    const { user, text } = req.body;
    if (!user || !text) return res.status(400).json({ error: 'Missing user or text' });

    const message = {
        id: Date.now(),
        user,
        text,
        timestamp: new Date().toISOString()
    };

    messages.push(message);

    io.emit('newMessage', message);
    res.status(201).json(message);
});

// Logging
app.use((req, _res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
