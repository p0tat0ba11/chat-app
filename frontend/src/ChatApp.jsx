import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import './ChatApp.css';
import { SERVER_URL } from './config';

const socket = io(SERVER_URL);

const ChatApp = ({ user, joinLine, onLogout, setJoinLine }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    // Fetch chat messages starting from joinLine
    const fetchMessages = async () => {
        try {
            const res = await axios.get(`${SERVER_URL}/chat`, {
                params: { user }
            });
            setMessages(res.data);
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    // Send a new chat message
    const sendMessage = async () => {
        if (!input.trim()) return;
        try {
            await axios.post(`${SERVER_URL}/chat`, { user, text: input });
            setInput('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    // Clear chat history (sets a new joinLine for the user)
    const clearMessages = async () => {
        try {
            const res = await axios.post(`${SERVER_URL}/chat/clear-history`, {
                username: user
            });

            if (res.data.new_join_line !== undefined) {
                setJoinLine(res.data.new_join_line);
                setMessages([]); // Optionally clear visible messages
            }
        } catch (err) {
            console.error('Failed to clear history:', err);
        }
    };

    // Setup socket and initial fetch
    useEffect(() => {
        fetchMessages();

        const handleNewMessage = (message) => {
            setMessages((prev) => [...prev, message]);
        };

        socket.on('newMessage', handleNewMessage);

        return () => {
            socket.off('newMessage', handleNewMessage);
        };
    }, [joinLine]); // ✅ refetch when joinLine changes

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h2 className="chat-title">💬 Welcome, {user}</h2>
                <div>
                    <button onClick={onLogout} className="chat-logout-btn">Logout</button>
                </div>
            </div>

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
                <button onClick={sendMessage} className="chat-send-btn">Send</button>
                <button onClick={clearMessages} className="chat-clear-btn">Clear</button>
            </div>
        </div>
    );
};

export default ChatApp;
