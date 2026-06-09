import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { mechanics as mechanicsApi } from '../utils/api';
import './Auth.css';

export function MechanicOnboard() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        address: '',
        city: '',
        state: '',
        lat: null,
        lng: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const getLocation = () =>
            new Promise((resolve, reject) => {
                if (!('geolocation' in navigator)) {
                    reject(new Error('Geolocation not supported'));
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                    reject
                );
            });

        try {
            let { lat, lng } = formData;
            if (lat == null || lng == null) {
                const coords = await getLocation();
                lat = coords.lat;
                lng = coords.lng;
            }

            await mechanicsApi.onboard({ ...formData, lat, lng });
            navigate('/mechanic-dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-header">
                <h1 className="auth-title">Set Up Your Profile</h1>
                <p className="auth-subtitle">Tell drivers who you are and where you work</p>
            </div>

            <Card className="auth-card">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="auth-error" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}
                    <Input id="name" label="Business Name" placeholder="e.g. Ade Auto Works" value={formData.name} onChange={handleChange} required />
                    <Input id="specialty" label="Specialty" placeholder="e.g. Engine & Transmission" value={formData.specialty} onChange={handleChange} required />
                    <Input id="address" label="Address" placeholder="Street address" value={formData.address} onChange={handleChange} required />
                    <Input id="city" label="City" placeholder="Lagos" value={formData.city} onChange={handleChange} required />
                    <Input id="state" label="State" placeholder="Lagos" value={formData.state} onChange={handleChange} />
                    <Button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Saving...' : 'Complete Setup'}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
