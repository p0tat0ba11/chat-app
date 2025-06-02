import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatApp from './ChatApp';
import AuthForm from './AuthForm';
import ChatRoom from './ChatRoom';
import './ChatApp.css';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('chatUser');
        if (storedUser) setUser(storedUser);
    }, []);

    const handleAuth = (username) => {
        localStorage.setItem('chatUser', username);
        setUser(username);
    };

    const handleLogout = () => {
        localStorage.removeItem('chatUser');
        setUser(null);
    };

    if (!user) return <AuthForm onAuth={handleAuth} />;

    return (
        <Router>
            <Routes>
                <Route path="/" element={<ChatApp user={user} onLogout={handleLogout} />} />
                <Route path="/chat/:friendId" element={<ChatRoom user={user} />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
