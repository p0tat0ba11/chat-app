# 🛡️ Secure Chat App

A modern, real-time chat application built with **React** and **Express.js**, featuring **Socket.IO** for instant messaging, **SQLite** for lightweight persistence, and **email-based Two-Factor Authentication (2FA)** for enhanced security. Designed with simplicity, security, and scalability in mind.

---

## 🚀 Features

- 📡 **Real-time Messaging** with Socket.IO
- 🔐 **User Authentication** (Sign Up / Sign In)
- ✉️ **Two-Factor Authentication (2FA)** via email token
- 💬 **Per-user Encrypted Chat History** (coming soon)
- 💻 **Clean, Responsive UI** with custom CSS
- 🗃️ **SQLite Database** via `better-sqlite3` for fast local storage
- 📥 **Email Verification** using Nodemailer (Gmail SMTP)

---

## 🛠️ Tech Stack

| Layer     | Tech Used                          |
|-----------|------------------------------------|
| Frontend  | React, Fetch API, Socket.IO Client |
| Backend   | Express.js, Socket.IO, Nodemailer  |
| Database  | SQLite + better-sqlite3            |
| Styling   | Custom CSS                         |
| Vault     | HashiCorp Vault (for secret management) |

---

## 📂 Project Structure

```
chat-app/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── friend.js
│   │   └── user.js
│   ├── server.js          # Express + Socket.IO server
│   ├── db.js              # SQLite setup
│   └── .env               # Environment variables
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Friend.jsx/.css
│       │   ├── Option.jsx/.css
│       │   └── Sidebar.jsx/.css
│       ├── App.jsx/.css
│       ├── AuthForm.jsx/.css
│       ├── ChatApp.jsx/.css
│       ├── ChatRoom.jsx/.css
│       └── config.js      # Backend server URL
```

---

## ⚙️ Installation Guide

### 🧩 Backend Setup

```bash
cd backend
npm install
node server.js
```

`.env` file example:

```env
PORT=5000
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_app_password
```

---

### 🖥️ Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:5173`  
Backend API expected at `http://localhost:5000`

---

### 🔐 Vault Installation (Optional)

Install HashiCorp Vault for secret management:

```bash
wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install vault
```

Start Vault in development mode:

```bash
vault server -dev
```

Enable CORS for Vault HTTP API:

```bash
curl \
  --header "X-Vault-Token: {root_token}" \
  -X POST \
  -d '{"allowed_origins": "*"}' \
  http://127.0.0.1:8200/v1/sys/config/cors
```

---

## 🔧 Configuration

Update the backend URL in `frontend/src/config.js`:

```js
export const SERVER_URL = 'http://localhost:5000';
```

---

## 🔐 Authentication Flow

1. **Sign Up**: Provide Username, Password, and Email
2. **Login**: Enter credentials → system sends a 6-digit code to email
3. **2FA Verification**: Enter code to complete authentication

---

## 🌱 Future Roadmap

- 🔐 **Client-Side Message Encryption** (AES-GCM + ECDH)
- 📦 **Dockerization**
- 🍓 **Deployment on Raspberry Pi**
- 🌍 **Multi-device Session Sync**
- 🗄️ **Encrypted Message Storage**
- 🛡️ **RSA-AES Hybrid Encryption for Group Chat**

---

## 📬 Feedback

Contributions, issues, and suggestions are welcome!  
Feel free to open an issue or submit a pull request.
