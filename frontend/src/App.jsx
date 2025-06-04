import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import ChatApp from './ChatApp';
import AuthForm from './AuthForm';
import ChatRoom from './ChatRoom';
import './ChatApp.css';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => { // auto-login
        const storedUser = Cookies.get('chatUser');
        if (storedUser) setUser(storedUser);
    }, []);


    const handleAuth = (userId, token) => {
        Cookies.set('chatUser', userId, { expires: 7 });
        Cookies.set('token', token, { expires: 7 });
        setUser(userId);
    };

    const handleLogout = () => {
        Cookies.remove('chatUser');
        Cookies.remove('token');
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
