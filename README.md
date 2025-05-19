# 🗨️ Simple Chat App with React and Express

A real-time chat application built with **React** on the frontend and **Express.js + Socket.IO** on the backend. This app supports real-time message delivery to all connected users using WebSockets.

---

## 🚀 Features

- Send and receive messages in real-time
- Lightweight UI with clean styling (no UI frameworks)
- In-memory message storage (no database required)
- Socket.IO for instant updates across clients

---

## 📦 Tech Stack

- **Frontend**: React, Axios, Socket.IO Client
- **Backend**: Express.js, Socket.IO
- **Communication**: WebSocket (via Socket.IO)
- **Styling**: Custom CSS

---

## 📁 Project Structure
simple-chat-app/
├── server.js # Express backend with Socket.IO
├── .env # Environment variables (e.g., PORT)
├── client/
│ ├── src/
│ │ ├── App.js
│ │ ├── ChatApp.jsx
│ │ ├── ChatApp.css
│ │ ├── config.js # SERVER_URL configuration
│ └── package.json

---

## 🔧 Installation

### Backend

```bash
# From the backend folder
npm install
node server.js
```
Default port is 5000 (.env file supported)

### Frontend
```bash
cd client
npm install
npm start
```
React will run on http://localhost:5173 and communicate with the backend at http://localhost:5000

---

## 🌐 Configuration
Edit `src/config.js` to change the backend server URL:
```js
export const SERVER_URL = 'http://localhost:5000';
```

---

✨ Future Improvements
- Add message persistence with MongoDB or SQLite
- User authentication (login / logout)
- Typing indicators
- Chat history pagination