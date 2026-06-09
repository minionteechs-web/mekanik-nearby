import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { auth, initSocket } from '../utils/api';
import { refreshUserLocation } from '../utils/location';
import './Auth.css';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [show2FA, setShow2FA] = useState(false);
    const [twoFACode, setTwoFACode] = useState('');
    const [preAuthToken, setPreAuthToken] = useState(null);
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState('');
    const navigate = useNavigate();

    const navigatePostLogin = (user) => {
        if (user.role === 'mechanic') {
            navigate('/mechanic-dashboard');
        } else {
            navigate('/home');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await auth.login({ email, password });

            if (response.data.two_factor_required) {
                setPreAuthToken(response.data.pre_auth_token);
                setShow2FA(true);
                return;
            }

            const { token, user } = response.data;
            localStorage.setItem('mekanik_user', JSON.stringify({ ...user, token }));
            initSocket();
            refreshUserLocation().catch(() => {});
            navigatePostLogin(user);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async (e) => {
        e.preventDefault();
        if (twoFACode.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const response = await auth.verify2FA({ token: preAuthToken, code: twoFACode });
            const { token, user } = response.data;
            localStorage.setItem('mekanik_user', JSON.stringify({ ...user, token }));
            initSocket();
            refreshUserLocation().catch(() => {});
            navigatePostLogin(user);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid or expired code');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await auth.forgotPassword(forgotEmail);
            setForgotMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Request failed');
        } finally {
            setLoading(false);
        }
    };

    if (showForgot) {
        return (
            <div className="auth-container">
                <div className="auth-header">
                    <h1 className="auth-title">Reset Password</h1>
                    <p className="auth-subtitle">Enter your email and we&apos;ll send a reset link</p>
                </div>
                <Card className="auth-card">
                    <form onSubmit={handleForgotPassword}>
                        {error && <div className="auth-error" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                        {forgotMessage && <div style={{ color: 'var(--color-success)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{forgotMessage}</div>}
                        <Input
                            label="Email Address"
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                        />
                        <Button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                        <Button type="button" variant="secondary" style={{ marginTop: '1rem' }} onClick={() => { setShowForgot(false); setForgotMessage(''); }}>
                            Back to Login
                        </Button>
                    </form>
                </Card>
            </div>
        );
    }

    if (show2FA) {
        return (
            <div className="auth-container">
                <div className="auth-header">
                    <h1 className="auth-title">Two-Factor Auth</h1>
                    <p className="auth-subtitle">Enter the 6-digit code from your authenticator app</p>
                </div>
                <Card className="auth-card">
                    <form onSubmit={handleVerify2FA}>
                        {error && <div className="auth-error" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                        <Input
                            label="Authentication Code"
                            placeholder="000000"
                            value={twoFACode}
                            onChange={(e) => setTwoFACode(e.target.value)}
                            maxLength={6}
                            required
                        />
                        <Button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify & Login'}
                        </Button>
                        <Button type="button" variant="secondary" style={{ marginTop: '1rem' }} onClick={() => setShow2FA(false)}>
                            Back to Login
                        </Button>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-header">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Login to find a mechanic nearby</p>
            </div>

            <Card className="auth-card">
                <form onSubmit={handleLogin}>
                    {error && <div className="auth-error" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                    <Input
                        label="Email Address"
                        placeholder="Enter your email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <div style={{ textAlign: 'right', marginBottom: '0.5rem' }}>
                        <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', color: 'var(--color-brand)', cursor: 'pointer', fontSize: '0.85rem' }}>
                            Forgot password?
                        </button>
                    </div>
                    <Button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Logging In...' : 'Log In'}
                    </Button>
                </form>
            </Card>

            <div className="auth-footer">
                <p>Don&apos;t have an account? <Link to="/register">Sign Up</Link></p>
            </div>
        </div>
    );
}
