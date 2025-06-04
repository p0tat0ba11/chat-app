import { useState } from 'react';
import axios from 'axios';

import { SERVER_URL } from './config';
import './AuthForm.css';

const AuthForm = ({ onAuth }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [is2FA, setIs2FA] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault(); // prevent default form submission

        if (is2FA) {
            try { // verify token
                const res = await axios.post(`${SERVER_URL}/auth/verify-token`, {
                    username,
                    token
                });
                onAuth(res.data.id, res.data.token);
            } catch (err) {
                setError(err.response?.data?.error || 'Token verification failed');
            }
            return;
        }

        const endpoint = isSignup ? 'signup' : 'signin';
        try {
            const payload = {
                username,
                password,
                ...(isSignup ? { email } : {})
            };

            const res = await axios.post(`${SERVER_URL}/auth/${endpoint}`, payload);

            if (isSignup) {
                setIsSignup(false);
                setUsername('');
                setPassword('');
                setEmail('');
                setError('Signup successful! Please log in.');
                return;
            }
            
            if (res.data.step === '2fa') {
                setIs2FA(true);
                setError('');
            }
            
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        }
    };

    return (
        <div className="chat-container auth-form-container">
            <h2 className="chat-title">
                {isSignup ? 'Sign Up' : is2FA ? 'Two-Factor Verification' : 'Sign In'}
            </h2>
            <form className="auth-form" onSubmit={handleSubmit}>
                {error && <p className="auth-error">{error}</p>}

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="chat-input"
                    required
                    disabled={is2FA}
                />

                {!is2FA && isSignup && (
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="chat-input"
                        required
                    />
                )}

                {!is2FA && (
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="chat-input"
                        required
                    />
                )}

                {is2FA && (
                    <input
                        type="text"
                        placeholder="Enter 6-digit token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="chat-input"
                        required
                    />
                )}

                <button type="submit" className="chat-send-btn">
                    {is2FA ? 'Verify Token' : isSignup ? 'Create Account' : 'Login'}
                </button>

                {!is2FA && (
                    <p className="auth-toggle" onClick={() => setIsSignup(!isSignup)}>
                        {isSignup ? 'Already have an account? Sign in' : 'No account? Sign up'}
                    </p>
                )}
            </form>
        </div>
    );
};

export default AuthForm;
