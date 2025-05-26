import React, { useState, useEffect } from 'react';
import { SERVER_URL } from '../config';
import './Option.css';

const Option = ({ userInfo, setUserInfo, setError }) => {
    const [mode, setMode] = useState(null);
    const [newName, setNewName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [defaultIcons, setDefaultIcons] = useState([]);

    useEffect(() => {
        if (mode === 'photo') {
            fetch(`${SERVER_URL}/user/default-icon`)
                .then((res) => res.json())
                .then(setDefaultIcons)
                .catch(() => setError('無法載入預設頭像'));
            console.log(defaultIcons);
        }
    }, [mode]);

    const handleNameChange = async () => {
        if (!newName || newName === userInfo.username) return;
        try {
            const res = await fetch(`${SERVER_URL}/user/${userInfo.username}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newUsername: newName })
            });
            const data = await res.json();
            if (res.ok && data.success !== false) {
                setUserInfo((prev) => ({ ...prev, username: newName }));
                localStorage.setItem('chatUser', newName);
                setError('');
            } else {
                setError(data.message || '更新失敗');
            }
        } catch {
            setError('更新名稱時發生錯誤');
        }
    };

    const handlePasswordChange = async () => {
        if (password !== confirmPassword) {
            setError('密碼不一致');
            return;
        }
        try {
            const res = await fetch(`${SERVER_URL}/user/${userInfo.username}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (res.ok && data.success !== false) {
                setPassword('');
                setConfirmPassword('');
                setError('');
            } else {
                setError(data.message || '密碼更新失敗');
            }
        } catch {
            setError('伺服器錯誤');
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            const res = await fetch(`${SERVER_URL}/user/${userInfo.username}`, {
                method: 'PATCH',
                body: formData
            });
            const data = await res.json();
            if (res.ok && data.success !== false) {
                const photoUrl = `${SERVER_URL}/icons/${data.updates.avatar}`;
                setUserInfo((prev) => ({ ...prev, avatar: data.updates.avatar }));
                setError('');
            } else {
                setError(data.message || '頭像更新失敗');
            }
        } catch {
            setError('上傳錯誤');
        }
    };

    const handleSelectDefault = async (filename) => {
        try {
            const res = await fetch(`${SERVER_URL}/user/${userInfo.username}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selectedPhoto: filename })
            });
            const data = await res.json();
            if (res.ok && data.success !== false) {
                setUserInfo((prev) => ({ ...prev, avatar: data.updates.avatar }));
                setError('');
            } else {
                setError(data.message || '選擇預設頭像失敗');
            }
        } catch {
            setError('預設頭像設置錯誤');
        }
    };

    return (
        <div className="option-container">
            <h3>使用者設定</h3>

            <div className="user-summary">
                <img
                    src={`${SERVER_URL}/icons/${userInfo.avatar}`}
                    alt="avatar"
                    width="60"
                    height="60"
                    style={{ borderRadius: '8px' }}
                />
                <p><strong>{userInfo.username}</strong></p>
            </div>

            <div className="settings-options">
                <button onClick={() => setMode('name')}>變更名稱</button>
                <button onClick={() => setMode('password')}>變更密碼</button>
                <button onClick={() => setMode('photo')}>變更頭像</button>
            </div>

            {mode === 'name' && (
                <div className="option-form">
                    <label>新名稱：</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    <button className="confirm-button" onClick={handleNameChange}>確認變更</button>
                </div>
            )}

            {mode === 'password' && (
                <div className="option-form">
                    <label>新密碼：</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <label>確認密碼：</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <button className="confirm-button" onClick={handlePasswordChange}>確認變更</button>
                </div>
            )}

            {mode === 'photo' && (
                <div className="option-form">
                    <label>上傳新頭像：</label>
                    <input type="file" onChange={handleAvatarUpload} />

                    {defaultIcons.length > 0 && (
                        <>
                            <label>選擇預設頭像：</label>
                            {mode === 'photo' && (
                                <>
                                    <label>或選擇預設頭像：</label>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {defaultIcons.map((icon) => (
                                            <img
                                                key={icon}
                                                src={`${SERVER_URL}/icons/default/${icon}`}
                                                alt={icon}
                                                width="40"
                                                height="40"
                                                style={{ cursor: 'pointer', borderRadius: '50%' }}
                                                onClick={() => handleSelectDefault(icon)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Option;
