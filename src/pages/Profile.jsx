import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Database, LogOut, Mail, Shield } from 'lucide-react';
import { Card } from '../components/Card';
import { formatBytes } from '../utils/format';
import { clearOfflineData } from '../utils/offline';
import './MechanicList.css';

export function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [offlineMeta, setOfflineMeta] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('mekanik_user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            navigate('/login');
        }

        const meta = localStorage.getItem('mekanik_offline_meta');
        if (meta) setOfflineMeta(JSON.parse(meta));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('mekanik_user');
        navigate('/');
    };

    const handleClearOffline = async () => {
        await clearOfflineData();
        localStorage.removeItem('mekanik_offline_meta');
        setOfflineMeta(null);
    };

    if (!user) return null;

    return (
        <div className="list-container">
            <header className="list-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h2>My Profile</h2>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem', backgroundColor: 'rgba(255, 107, 53, 0.05)', borderRadius: '0 0 24px 24px', marginBottom: '1.5rem' }}>
                <div style={{ width: 90, height: 90, borderRadius: '50%', backgroundColor: 'var(--color-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 8px 16px rgba(255, 107, 53, 0.2)' }}>
                    <User size={45} color="white" />
                </div>
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{user.username || user.identifier}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    <Mail size={14} /> {user.email || 'No email provided'}
                </div>
                <div style={{ marginTop: '0.75rem', padding: '4px 12px', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.1)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={12} color="var(--color-brand)" /> {user.role || 'Driver'}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0 1.5rem 2rem 1.5rem' }}>
                <Card className="profile-menu-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Database size={24} color="var(--color-brand)" />
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', margin: 0 }}>Offline Data</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                            {offlineMeta
                                ? `${offlineMeta.routeLabel} — ${offlineMeta.count} mechanics (${formatBytes(offlineMeta.sizeBytes)})`
                                : 'No offline routes saved'}
                        </p>
                        {offlineMeta && (
                            <button
                                onClick={handleClearOffline}
                                style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                            >
                                Clear offline data
                            </button>
                        )}
                    </div>
                </Card>

                <Card
                    className="profile-menu-item"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        border: '1px solid rgba(255, 68, 68, 0.3)',
                        marginTop: '1rem',
                    }}
                    onClick={handleLogout}
                >
                    <LogOut size={24} color="var(--color-danger)" />
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--color-danger)', fontWeight: '700' }}>Sign Out</h3>
                    </div>
                </Card>
            </div>
        </div>
    );
}
