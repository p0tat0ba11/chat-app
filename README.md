# 🗨️ Simple Chat App

A real-time chat application built with **React** on the frontend and **Express.js + Socket.IO + SQLite** on the backend. This app supports user authentication, per-user chat history, and 2FA token verification via email.

---

## 🚀 Features

- ✅ Real-time messaging using Socket.IO
- ✅ User authentication (Sign Up / Sign In)
- ✅ Two-Factor Authentication (2FA) via email token
- ✅ Per-user chat history (joined message filtering)
- ✅ "Clear History" resets message view starting point
- ✅ Simple, responsive UI without external UI frameworks
- ✅ Data persistence using SQLite with better-sqlite3

---

## 📦 Tech Stack

- **Frontend**: React, Axios, Socket.IO Client
- **Backend**: Express.js, Socket.IO, better-sqlite3
- **Database**: SQLite (with `better-sqlite3`)
- **Styling**: Custom CSS
- **Email**: Nodemailer (via Gmail SMTP)

---

## 📁 Project Structure

chat-app/ 
├── backend/  
│ │ ├── routes/  
│ │ │ └── auth.js  
│ │ ├── server.js # Express backend with Socket.IO  
│ │ ├── db.js  
│ │ └── .env # Environment variables (e.g., PORT)  
├── frontend/  
│ ├── src/  
│ │ ├── App.js  
│ │ ├── App.css  
│ │ ├── AuthForm.jsx  
│ │ ├── AuthForm.css  
│ │ ├── ChatApp.jsx  
│ │ ├── ChatApp.css  
│ │ ├── config.js # SERVER_URL configuration  
│ └── package.json 

---


## 🔧 Installation

### 1️⃣ Backend

```bash
cd backend
npm install
node server.js
```
Requires .env with:
```env
PORT=5000
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_email_app_password
```

### 2️⃣ Frontend
```bash
cd frontend
npm install
npm start
```
React will run on http://localhost:5173 and communicate with the backend at http://localhost:5000

### 3️⃣ Vault
```bash
wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(grep -oP '(?<=UBUNTU_CODENAME=).*' /etc/os-release || lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install vault
```

---

## Vault Server Configuration and Start
Vault Server start with development mode
```bash
vault server -dev
```
Note: 注意unseal key跟root token在CLI中
Vault server CORS policy setup (不然無法使用http api request)
```bash
curl  --header "X-Vault-Token: {root_token}" -X POST -d '{"allowed_origins": "*"}' http://127.0.0.1:8200/v1/sys/config/cors
```


## 🌐 Configuration
Edit `src/config.js` to change the backend server URL:
```js
export const SERVER_URL = 'http://localhost:5000';
```

---

## 📌 Authentication Flow

- Sign Up: Username + Password + Email
- Sign In: Username + Password → 6-digit token sent via email
- Token Verification: User must verify token to complete login
- Clear History: Resets join_line so user sees only new messages

---

## ✨ Future Improvements
- Client Side Encryption
- Dockerization
