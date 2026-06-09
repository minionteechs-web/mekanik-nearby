import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { auth } from '../utils/api';
import './Auth.css';

export function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match');
            return;
        }
        if (!token) {
            setError('Invalid reset link');
            return;
        }

        setError('');
        setLoading(true);
        try {
            await auth.resetPassword({ token, password });
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed. Link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="auth-container">
                <Card className="auth-card" style={{ textAlign: 'center' }}>
                    <h2>Password Updated</h2>
                    <p style={{ color: 'var(--color-text-muted)', margin: '1rem 0' }}>
                        You can now log in with your new password.
                    </p>
                    <Button onClick={() => navigate('/login')}>Go to Login</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-header">
                <h1 className="auth-title">Reset Password</h1>
                <p className="auth-subtitle">Enter your new password below</p>
            </div>
            <Card className="auth-card">
                <form onSubmit={handleSubmit}>
                    {error && <div className="auth-error" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                    <Input
                        label="New Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                    <Button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                </form>
            </Card>
            <div className="auth-footer">
                <p><Link to="/login">Back to Login</Link></p>
            </div>
        </div>
    );
}
