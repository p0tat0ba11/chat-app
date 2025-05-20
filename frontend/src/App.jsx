import { useEffect, useState } from 'react';
import ChatApp from './ChatApp';
import AuthForm from './AuthForm';
import './ChatApp.css';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('chatUser');
        if (storedUser) setUser(storedUser);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('chatUser');
        setUser(null);
    };

    return (
        <>
            {user ? <ChatApp user={user} onLogout={handleLogout} /> : <AuthForm onAuth={setUser} />}
        </>
    );
}

export default App;
