import { useState, useRef, useEffect } from 'react';
import './Sidebar.css';
import { SERVER_URL } from '../config';
import Option from './Option';

const Sidebar = ({ userInfo, setUserInfo }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [error, setError] = useState('');

    const modalRef = useRef();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showSettings && modalRef.current && !modalRef.current.contains(e.target)) {
                setShowSettings(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSettings]);

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

            <button onClick={() => setShowSettings(prev => !prev)}>⚙️</button>
            

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

        </div>
    );
};

export default Sidebar;
