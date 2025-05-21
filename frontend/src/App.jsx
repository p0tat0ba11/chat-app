import { useEffect, useState } from 'react';
import ChatApp from './ChatApp';
import AuthForm from './AuthForm';
import './ChatApp.css';

function App() {
    const [user, setUser] = useState(null);
    const [joinLine, setJoinLine] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('chatUser');
        if (storedUser) setUser(storedUser);
    }, []);

    const handleAuth = (username, line) => {
        localStorage.setItem('chatUser', username);
        setUser(username);
        setJoinLine(line);
    };

    const handleLogout = () => {
        localStorage.removeItem('chatUser');
        setUser(null);
    };

    return (
        <>
            {user ? 
                <ChatApp
                    user={user}
                    joinLine={joinLine}
                    setJoinLine={setJoinLine}
                    onLogout={handleLogout}
                /> : <AuthForm onAuth={handleAuth} />}
        </>
    );
}

export default App;
