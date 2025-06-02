import { useState, useRef, useEffect } from 'react';
import './Sidebar.css';
import { SERVER_URL } from '../config';
import Option from './Option';
import Friend from './Friend';

const Sidebar = ({ userInfo, setUserInfo }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [showFriends, setShowFriends] = useState(false);
    const [error, setError] = useState('');

    const modalRef = useRef();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if ((showSettings || showFriends) && modalRef.current && !modalRef.current.contains(e.target)) {
                setShowSettings(false);
                setShowFriends(false);
            }
        };
        console.log(userInfo);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSettings, showFriends]);

    return (
        <div className="sidebar">
            {/* 使用者頭像與名稱 */}
            {userInfo && (
                <div className="sidebar-user-info">
                    <img
                        src={`${SERVER_URL}/icons/${userInfo.avatar}`}
                        alt="avatar"
                        width="60"
                        height="60"
                        style={{ borderRadius: '8px', marginBottom: '8px' }}
                    />
                    <p><strong>{userInfo.username}</strong></p>
                </div>
            )}

            <button onClick={() => {
                setShowSettings(prev => !prev);
                setShowFriends(false);
            }}>⚙️ 設定</button>

            <button onClick={() => {
                setShowFriends(prev => !prev);
                setShowSettings(false);
            }}>👥 好友</button>

            {/* 設定視窗 */}
            {showSettings && (
                <div ref={modalRef} className="settings-modal">
                    <h3>使用者設定</h3>
                    <Option
                        userInfo={userInfo}
                        setUserInfo={setUserInfo}
                        setError={setError}
                    />
                    <button onClick={() => setShowSettings(false)}>關閉</button>
                    {error && <div className="error">{error}</div>}
                </div>
            )}

            {/* 好友列表視窗 */}
            {showFriends && (
                <div ref={modalRef} className="settings-modal">
                    <h3>我的好友</h3>
                    <Friend userId={userInfo.id} />
                    <button onClick={() => setShowFriends(false)}>關閉</button>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
