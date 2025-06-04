import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { io } from 'socket.io-client';
import { SERVER_URL } from './config';
import Sidebar from './components/Sidebar';
import './ChatRoom.css';

const socket = io(SERVER_URL);

const ChatRoom = () => {
    const { friendId } = useParams();
    const { state } = useLocation();
    const friendName = state?.friendName || 'Friend';
    
    const [userInfo, setUserInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const userId = Cookies.get('chatUser');
    const token = Cookies.get('token');
    
    const fetchUserInfo = async () => {
        try {
            console.log("Server URL:", SERVER_URL);
            const res = await fetch(`${SERVER_URL}/user`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Failed to fetch user info');
            const data = await res.json();
            console.log('Fetched user info:', data);
            setUserInfo(data);
        } catch (err) {
            console.error('Failed to fetch user info:', err);
        }
    };

    const fetchMessages = async () => {
        if (!userId || !friendId || !token) return;

        try {
            const res = await fetch(`${SERVER_URL}/friends/chat?userId=${userId}&friendId=${friendId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error('Failed to fetch private messages');
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error('Failed to fetch private messages:', err);
        }
    };

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

            if (!res.ok) throw new Error('Failed to send private message');

            const sentMsg = await res.json();
            setMessages((prev) => [...prev, sentMsg]);
            setInput('');
            socket.emit('privateMessage', sentMsg);
        } catch (err) {
            console.error('Failed to send private message:', err);
        }
    };

    useEffect(() => {
        if (userId) fetchUserInfo();
    }, [userId]);

    useEffect(() => {
        if (userInfo?.id && friendId) fetchMessages();
    }, [userInfo, friendId]);

    useEffect(() => {
        const handleIncoming = (message) => {
            const isForThisRoom =
                (message.sender_id === userInfo?.id && message.receiver_id === parseInt(friendId)) ||
                (message.receiver_id === userInfo?.id && message.sender_id === parseInt(friendId));

            if (isForThisRoom) {
                setMessages((prev) => [...prev, message]);
            }
        };

        socket.on('privateMessage', handleIncoming);
        return () => socket.off('privateMessage', handleIncoming);
    }, [userInfo, friendId]);

    return (
        <div className="chatapp-layout">
            <Sidebar userInfo={userInfo} setUserInfo={setUserInfo} />

            <div className="chat-container">
                <h2 className="chat-title">Chat with {friendName}</h2>

                <div className="chat-box">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`chat-message ${msg.sender_id === userInfo?.id ? 'my-message' : ''}`}
                        >
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
