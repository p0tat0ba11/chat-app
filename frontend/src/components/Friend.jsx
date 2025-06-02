import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVER_URL } from '../config';
import './Friend.css';

const Friend = ({ userId }) => {
    const [friends, setFriends] = useState([]);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // 取得目前好友列表
    const fetchFriends = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/friends/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch friends');
            const data = await res.json();
            setFriends(data);
        } catch (err) {
            setError('無法載入好友列表');
        }
    };

    useEffect(() => {
        if (userId) fetchFriends();
    }, [userId]);

    // 搜尋用戶
    const handleSearch = async () => {
        setSearchResult(null);
        setMessage('');
        if (!search.trim()) return;

        try {
            const res = await fetch(`${SERVER_URL}/friends/search/user?query=${encodeURIComponent(search)}`);
            const data = await res.json();

            if (!res.ok || data.length === 0) {
                setMessage('找不到該使用者');
                return;
            }

            const filtered = data.find(
                (user) => user.id !== userId && !friends.some((f) => f.id === user.id)
            );

            if (filtered) {
                setSearchResult(filtered);
            } else {
                setMessage('使用者已在好友列表中或是您自己');
            }
        } catch {
            setMessage('搜尋錯誤');
        }
    };

    // 新增好友
    const handleAddFriend = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/friends/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, friendId: searchResult.id }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setMessage('已成功加入好友');
                setFriends(prev => [...prev, searchResult]);
                setSearch('');
                setSearchResult(null);
            } else {
                setMessage(data.error || '無法加入好友');
            }
        } catch {
            setMessage('伺服器錯誤');
        }
    };

    const handleChat = (friend) => {
        navigate(`/chat/${friend.id}`, {
            state: { friendName: friend.username }
        });
    };

    return (
        <div className="friend-list">
            <h4>好友列表</h4>

            {error && <div className="error">{error}</div>}
            {!friends.length && !error && <p>您還沒有任何好友</p>}
            
            <div className="friend-search">
                <input
                    type="text"
                    placeholder="搜尋使用者名稱"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button onClick={handleSearch}>搜尋</button>
                <button className="refresh-icon" onClick={fetchFriends} title="重新整理">🔄</button>
            </div>

            {searchResult && (
                <div className="search-result">
                    <div className="friend-item">
                        <img
                            src={`${SERVER_URL}/icons/${searchResult.avatar}`}
                            alt="avatar"
                            width="40"
                            height="40"
                            style={{ marginRight: '8px' }}
                        />
                        <span>{searchResult.username}</span>
                    </div>
                    <button onClick={handleAddFriend}>加為好友</button>
                </div>
            )}

            <ul>
                {friends.map((friend) => (
                    <li key={friend.id} className="friend-item">
                        <img
                            src={`${SERVER_URL}/icons/${friend.avatar}`}
                            alt="avatar"
                            width="40"
                            height="40"
                            style={{ marginRight: '8px' }}
                        />
                        <span style={{ marginRight: '8px' }}>{friend.username}</span>
                        <button className="chat-button" onClick={() => handleChat(friend)}>聊天</button>
                    </li>
                ))}
            </ul>


            {message && <p className="status-message">{message}</p>}
        </div>
    );
};

export default Friend;
