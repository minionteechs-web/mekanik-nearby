import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';
import { Card } from '../components/Card';
import { auth } from '../utils/api';
import { updateStoredUser } from '../utils/profilePrefs';
import { useToast } from '../components/Toast';
import { Button } from '../components/Button';
import './Profile.css';
import './MechanicList.css';

export function TwoFactorSetup() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [qrCode, setQrCode] = useState('');
    const [code, setCode] = useState('');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        auth.setup2FA()
            .then((res) => {
                setQrCode(res.data.qrCodeUrl);
            })
            .catch(() => {
                showToast('Could not load 2FA setup', 'error');
                navigate('/profile');
            })
            .finally(() => setLoading(false));
    }, [navigate, showToast]);

    const handleEnable = async (e) => {
        e.preventDefault();
        if (code.length !== 6) {
            showToast('Enter the 6-digit code from your app', 'error');
            return;
        }
        setVerifying(true);
        try {
            await auth.toggle2FA({ enable: true, code });
            updateStoredUser({ is_2fa_enabled: true });
            showToast('2FA enabled', 'success');
            navigate('/profile');
        } catch (err) {
            showToast(err.response?.data?.message || 'Invalid code', 'error');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="list-container">
            <header className="list-header">
                <button className="icon-btn-back" onClick={() => navigate('/profile')}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Two-Factor Auth</h2>
            </header>

            <div className="profile-content" style={{ paddingTop: '1.5rem' }}>
                <Card className="profile-settings-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Shield size={24} color="var(--color-brand)" />
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
                            Scan with Google Authenticator or Authy, then enter the code.
                        </p>
                    </div>

                    {loading ? (
                        <p>Loading QR code...</p>
                    ) : (
                        <>
                            {qrCode && (
                                <img src={qrCode} alt="2FA QR code" className="profile-2fa-qr" />
                            )}
                            <form onSubmit={handleEnable}>
                                <label className="profile-field">
                                    <span>6-digit code</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                    />
                                </label>
                                <Button type="submit" disabled={verifying}>
                                    {verifying ? 'Enabling...' : 'Enable 2FA'}
                                </Button>
                            </form>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
