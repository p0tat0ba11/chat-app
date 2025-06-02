import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import './ChatApp.css';
import { SERVER_URL } from './config';
import Sidebar from './components/Sidebar';

const socket = io(SERVER_URL);

const ChatApp = ({ onLogout }) => {
    const [user, setUser] = useState(localStorage.getItem('chatUser'));
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [userInfo, setUserInfo] = useState(null);

    const fetchUserInfo = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/user/${user}`);
            if (!res.ok) throw new Error('Failed to fetch user info');
            const data = await res.json();
            console.log('User info fetched:', data);
            setUserInfo(data);
        } catch (err) {
            console.error('Failed to fetch user info:', err);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/chat?user=${encodeURIComponent(user)}`);
            if (!res.ok) throw new Error('Failed to fetch messages');
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        try {
            const res = await fetch(`${SERVER_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, text: input })
            });
            if (!res.ok) throw new Error('Failed to send message');
            setInput('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const clearMessages = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/chat/clear-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user })
            });
            if (!res.ok) throw new Error('Failed to clear history');
            setMessages([]);
        } catch (err) {
            console.error('Failed to clear history:', err);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchUserInfo();
        fetchMessages();

        const handleNewMessage = (message) => {
            setMessages((prev) => [...prev, message]);
        };

        socket.on('newMessage', handleNewMessage);

        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }, [user]);

    useEffect(() => {
        if (!userInfo) return;

        if (userInfo.username !== user) {
            setUser(userInfo.username);
            localStorage.setItem('chatUser', userInfo.username);
        }

        fetchMessages();
    }, [userInfo]);

    return (
        <div className="chatapp-layout">
            <Sidebar userInfo={userInfo} setUserInfo={setUserInfo} />

            <div className="chat-container">
                <div className="chat-box">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`chat-message ${msg.username === user ? 'my-message' : ''}`}
                        >
                            <div className="chat-meta">
                                <strong>{msg.username === user? 'You': msg.username}</strong>
                                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="chat-text">{msg.text}</div>
                        </div>
                    ))}
                </div>

                <div className="chat-input-area">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="chat-input"
                    />
                    <button onClick={sendMessage} className="chat-send-btn">Send</button>
                    <button onClick={clearMessages} className="chat-clear-btn">Clear</button>
                    <button onClick={onLogout} className="chat-logout-btn">Logout</button>
                </div>
            </div>
        </div>
    );
};

export default ChatApp;
