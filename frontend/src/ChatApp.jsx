import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import Cookies from 'js-cookie';
import './ChatApp.css';
import { SERVER_URL } from './config';
import Sidebar from './components/Sidebar';

const socket = io(SERVER_URL);

const ChatApp = ({ onLogout }) => {
    const [userId, setUserId] = useState(Cookies.get('chatUser'));
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [userInfo, setUserInfo] = useState(null);
    const chatBoxRef = useRef(null);

    const token = Cookies.get('token');

    const fetchUserInfo = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/user`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch user info');
            const data = await res.json();
            setUserInfo(data);
        } catch (err) {
            console.error('Failed to fetch user info:', err);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/chat`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                credentials: 'include'
            });
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
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ text: input })
            });
            if (!res.ok) throw new Error('Failed to send message');
            setInput('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    useEffect(() => {
        if (!userId) return;

        fetchUserInfo();
        fetchMessages();

        const handleNewMessage = (message) => {
            setMessages((prev) => [...prev, message]);
        };

        socket.on('newMessage', handleNewMessage);
        return () => socket.off('newMessage', handleNewMessage);
    }, [userId]);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="chatapp-layout">
            <Sidebar userInfo={userInfo} setUserInfo={setUserInfo} />
            <div className="chat-container">
                <div className="chat-box" ref={chatBoxRef}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`chat-message ${msg.username === userInfo?.username ? 'my-message' : ''}`}
                        >
                            <div className="chat-meta">
                                <strong>{msg.userId === userId ? 'You' : msg.username}</strong>
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
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="chat-input"
                    />
                    <button onClick={sendMessage} className="chat-send-btn">Send</button>
                    <button onClick={() => setMessages([])} className="chat-clear-btn">Clear</button>
                    <button onClick={onLogout} className="chat-logout-btn">Logout</button>
                </div>
            </div>
        </div>
    );
};

export default ChatApp;