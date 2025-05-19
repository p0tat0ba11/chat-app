import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './ChatApp.css';
import { SERVER_URL } from './config';

const socket = io(SERVER_URL);

const ChatApp = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [user] = useState('User' + Math.floor(Math.random() * 1000));

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`${SERVER_URL}/chat`);
                setMessages(res.data);
            } catch (err) {
                console.error('Failed to fetch messages:', err);
            }
        };

        fetchMessages();

        socket.on('newMessage', (message) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            socket.off('newMessage');
        };
    }, []);

    const sendMessage = async () => {
        if (!input.trim()) return;
        try {
            await axios.post(`${SERVER_URL}/chat`, { user, text: input });
            setInput('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    return (
        <div className="chat-container">
            <h2 className="chat-title">💬 Simple Chat App</h2>
            <div className="chat-box">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`chat-message ${msg.user === user ? 'my-message' : ''}`}
                    >
                        <div className="chat-meta">
                            <strong>{msg.user}</strong>
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
                <button onClick={sendMessage} className="chat-send-btn">
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatApp;
