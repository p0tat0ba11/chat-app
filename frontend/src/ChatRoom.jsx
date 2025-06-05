import { useRef, useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { io } from 'socket.io-client';
import { SERVER_URL } from './config';
import Sidebar from './components/Sidebar';
import './ChatRoom.css';

const ChatRoom = () => {
    const socketRef = useRef(null);
    const chatBoxRef = useRef(null);
    const { friendId } = useParams();
    const { state } = useLocation();
    const friendName = state?.friendName || 'Friend';

    const [userInfo, setUserInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const userId = Cookies.get('chatUser');
    const token = Cookies.get('token');

    useEffect(() => {
        if (!socketRef.current) {
            socketRef.current = io(SERVER_URL, {
                query: { userId: userId },
            });

            socketRef.current.on('connect', () => {
                console.log('Connected to socket server:', socketRef.current.id);
            });

            socketRef.current.on('privateMessage', (message) => {
                console.log('Received socket message:', message);
                setMessages(prev => [...prev, message]);
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (userId) fetchUserInfo();
    }, [userId]);

    const fetchUserInfo = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/user`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to fetch user info');
            const data = await res.json();
            setUserInfo(data);
        } catch (err) {
            console.error('User info error:', err);
        }
    };

    const fetchMessages = async () => {
        if (!userId || !friendId || !token) return;
        try {
            const res = await fetch(`${SERVER_URL}/friends/chat?userId=${userId}&friendId=${friendId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error('Fetch messages error:', err);
        }
    };

    useEffect(() => {
        if (userInfo?.id && friendId) {
            fetchMessages();
        }
    }, [userInfo, friendId]);

    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || !token) return;
        try {
            const res = await fetch(`${SERVER_URL}/friends/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    senderId: userId,
                    receiverId: friendId,
                    message: input.trim(),
                }),
            });

            if (!res.ok) throw new Error('Send failed');

            const sentMsg = await res.json();
            setMessages((prev) => [...prev, sentMsg]);
            setInput('');
            if (socketRef.current) {
                console.log('Emitting message via socket:', sentMsg);
                socketRef.current.emit('privateMessage', sentMsg);
            }
        } catch (err) {
            console.error('Send message error:', err);
        }
    };

    return (
        <div className="chatapp-layout">
            <Sidebar userInfo={userInfo} setUserInfo={setUserInfo} />
            <div className="chat-container">
                <h2 className="chat-title">Chat with {friendName}</h2>
                <div className="chat-box" ref={chatBoxRef}>
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.sender_id === userInfo?.id ? 'my-message' : ''}`}>
                            <div className="chat-meta">
                                <strong>{msg.sender_id === userInfo?.id ? 'You' : friendName}</strong>
                                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div className="chat-text">{msg.message}</div>
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
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;