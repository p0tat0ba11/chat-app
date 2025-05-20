// src/AuthForm.jsx
import { useState } from 'react';
import axios from 'axios';
import { SERVER_URL } from './config';
import './AuthForm.css';

const AuthForm = ({ onAuth }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isSignup ? 'signup' : 'signin';

        try {
            const res = await axios.post(`${SERVER_URL}/auth/${endpoint}`, { username, password });
            localStorage.setItem('chatUser', username);
            onAuth(username);
        } catch (err) {
            setError(err.response?.data?.error || 'Auth failed');
        }
    };

    return (
        <div className="chat-container auth-form-container">
            <h2 className="chat-title">{isSignup ? 'Sign Up' : 'Sign In'}</h2>
            <form className="auth-form" onSubmit={handleSubmit}>
                {error && <p className="auth-error">{error}</p>}
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="chat-input"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="chat-input"
                    required
                />
                <button type="submit" className="chat-send-btn">
                    {isSignup ? 'Create Account' : 'Login'}
                </button>
                <p className="auth-toggle" onClick={() => setIsSignup(!isSignup)}>
                    {isSignup ? 'Already have an account? Sign in' : 'No account? Sign up'}
                </p>
            </form>
        </div>
    );
};

export default AuthForm;
