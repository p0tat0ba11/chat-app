import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SERVER_URL } from './config';
import Sidebar from './components/Sidebar';
import './ChatRoom.css';

const socket = io(SERVER_URL);

const ChatRoom = ({ user }) => {
    const { friendId } = useParams();
    const { state } = useLocation();
    const friendName = state?.friendName || 'Friend';

    const [userInfo, setUserInfo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    // 取得登入者資訊
    const fetchUserInfo = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/user/${user}`);
            if (!res.ok) throw new Error('Failed to fetch user info');
            const data = await res.json();
            setUserInfo(data);
        } catch (err) {
            console.error('Failed to fetch user info:', err);
        }
    };

    // 取得與好友的私訊
    const fetchMessages = async () => {
        if (!userInfo?.id || !friendId) return;

        try {
            const res = await fetch(`${SERVER_URL}/friends/chat?userId=${userInfo.id}&friendId=${friendId}`);
            if (!res.ok) throw new Error('Failed to fetch private messages');
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error('Failed to fetch private messages:', err);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        try {
            const res = await fetch(`${SERVER_URL}/friends/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: userInfo.id,
                    receiverId: friendId,
                    message: input.trim(),
                }),
            });

            if (!res.ok) throw new Error('Failed to send private message');

            const sentMsg = await res.json();
            setMessages((prev) => [...prev, sentMsg]);
            setInput('');
            socket.emit('privateMessage', sentMsg); // 可選擇送出給對方（取決於伺服器設定）
        } catch (err) {
            console.error('Failed to send private message:', err);
        }
    };

    // 初次載入：抓 userInfo
    useEffect(() => {
        if (user) fetchUserInfo();
    }, [user]);

    // userInfo 準備好 → 抓對話紀錄
    useEffect(() => {
        if (userInfo?.id && friendId) fetchMessages();
    }, [userInfo, friendId]);

    // WebSocket 即時更新
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

        return () => {
            socket.off('privateMessage', handleIncoming);
        };
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
