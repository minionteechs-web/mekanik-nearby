import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { auth } from '../utils/api';
import './Auth.css';

export function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'driver'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRoleChange = (role) => {
        setFormData({ ...formData, role });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await auth.register(formData);
            const { token, user } = response.data;
            
            // Store user and token
            localStorage.setItem('mekanik_user', JSON.stringify({ ...user, token }));
            
            // Redirect based on role
            if (user.role === 'mechanic') {
                navigate('/mechanic-onboard');
            } else {
                navigate('/home');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-header">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">Join Mekanik Nearby today</p>
            </div>

            <Card className="auth-card">
                <form onSubmit={handleRegister}>
                    {error && <div className="auth-error" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                    <Input
                        label="Username"
                        id="username"
                        placeholder="Choose a username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Email Address"
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Phone Number"
                        id="phone"
                        type="tel"
                        placeholder="e.g. 08012345678"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Password"
                        id="password"
                        type="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <div className="role-selector">
                        <label className="role-label">I am a:</label>
                        <div className="role-buttons">
                            <button
                                type="button"
                                className={`role-btn ${formData.role === 'driver' ? 'active' : ''}`}
                                onClick={() => handleRoleChange('driver')}
                            >
                                Driver
                            </button>
                            <button
                                type="button"
                                className={`role-btn ${formData.role === 'mechanic' ? 'active' : ''}`}
                                onClick={() => handleRoleChange('mechanic')}
                            >
                                Mechanic
                            </button>
                        </div>
                    </div>

                    <Button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </Button>
                </form>
            </Card>

            <div className="auth-footer">
                <p>Already have an account? <Link to="/login">Log In</Link></p>
            </div>
        </div>
    );
}
