import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Car, Wrench, Shield, Award } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { auth } from '../utils/api';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { MECHANIC_SPECIALTIES, ROLE_OPTIONS } from '../constants/registerConfig';
import './Auth.css';

const INITIAL = {
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'driver',
    workshopName: '',
    specialty: MECHANIC_SPECIALTIES[0],
    city: '',
    state: '',
    yearsExperience: '',
    certification: '',
};

export function Register() {
    const [formData, setFormData] = useState(INITIAL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const roleMeta = ROLE_OPTIONS[formData.role];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleRoleChange = (role) => {
        setFormData({ ...INITIAL, role });
        setError('');
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const payload = {
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role: formData.role,
            };

            if (formData.role === 'mechanic') {
                Object.assign(payload, {
                    workshopName: formData.workshopName,
                    specialty: formData.specialty,
                    city: formData.city,
                    state: formData.state,
                    yearsExperience: formData.yearsExperience,
                    certification: formData.certification,
                });
            }

            const response = await auth.register(payload);
            const { token, user } = response.data;
            localStorage.setItem('mekanik_user', JSON.stringify({ ...user, token }));

            if (user.role === 'mechanic') {
                navigate('/mechanic-onboard');
            } else {
                navigate('/home');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container auth-register">
            <div className="page-theme-corner">
                <ThemeToggle compact />
            </div>
            <div className="auth-intro">
                <BrandLogo size={72} />
            </div>
            <div className="auth-header">
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">{roleMeta.tagline}</p>
            </div>

            <div className="role-cards">
                <button
                    type="button"
                    className={`role-card ${formData.role === 'driver' ? 'active' : ''}`}
                    onClick={() => handleRoleChange('driver')}
                >
                    <Car size={22} />
                    <span className="role-card-title">Driver</span>
                    <span className="role-card-desc">Need help on the road</span>
                </button>
                <button
                    type="button"
                    className={`role-card ${formData.role === 'mechanic' ? 'active' : ''}`}
                    onClick={() => handleRoleChange('mechanic')}
                >
                    <Wrench size={22} />
                    <span className="role-card-title">Mechanic</span>
                    <span className="role-card-desc">Offer roadside service</span>
                </button>
            </div>

            <p className="role-panel-desc">{roleMeta.description}</p>
            <div className="role-chips">
                {roleMeta.chips.map((chip) => (
                    <span key={chip} className="role-chip">{chip}</span>
                ))}
            </div>

            <Card className="auth-card">
                <form onSubmit={handleRegister}>
                    {error && <div className="auth-error">{error}</div>}

                    <Input
                        label={formData.role === 'mechanic' ? 'Your full name' : 'Full name'}
                        id="username"
                        placeholder="e.g. Chidi Okafor"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Email address"
                        id="email"
                        type="email"
                        placeholder="you@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label={formData.role === 'mechanic' ? 'Business phone (drivers will call)' : 'Mobile number (for SOS callbacks)'}
                        id="phone"
                        type="tel"
                        placeholder="+234 800 000 0000"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Password"
                        id="password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    {formData.role === 'driver' && (
                        <div className="role-info-box">
                            <Shield size={18} />
                            <p>Your phone is shared with mechanics only when you send an SOS — so they can call you at the breakdown spot.</p>
                        </div>
                    )}

                    {formData.role === 'mechanic' && (
                        <div className="mechanic-fields">
                            <Input
                                label="Workshop / business name"
                                id="workshopName"
                                placeholder="e.g. Ade Auto Works"
                                value={formData.workshopName}
                                onChange={handleChange}
                                required
                            />
                            <label className="auth-select-label">
                                Primary specialty
                                <select
                                    id="specialty"
                                    className="auth-select"
                                    value={formData.specialty}
                                    onChange={handleChange}
                                    required
                                >
                                    {MECHANIC_SPECIALTIES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="auth-field-row">
                                <Input id="city" label="City" placeholder="Lagos" value={formData.city} onChange={handleChange} required />
                                <Input id="state" label="State" placeholder="Lagos" value={formData.state} onChange={handleChange} />
                            </div>
                            <Input
                                label="Years of experience (optional)"
                                id="yearsExperience"
                                type="number"
                                min="0"
                                placeholder="e.g. 8"
                                value={formData.yearsExperience}
                                onChange={handleChange}
                            />
                            <Input
                                label="Certification or trade ID (optional)"
                                id="certification"
                                placeholder="NADDC, trade test, workshop license..."
                                value={formData.certification}
                                onChange={handleChange}
                            />
                            <div className="role-info-box mechanic">
                                <Award size={18} />
                                <p>Next step: pin your workshop on the map so drivers can find you when you go online.</p>
                            </div>
                        </div>
                    )}

                    <Button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Creating account...' : roleMeta.cta}
                    </Button>
                </form>
            </Card>

            <div className="auth-footer">
                <p>Already have an account? <Link to="/login">Log In</Link></p>
            </div>
        </div>
    );
}
