import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Database,
    LogOut,
    Mail,
    Shield,
    Map,
    Trash2,
    ChevronRight,
    Clock,
    Phone,
    Car,
    Bell,
    Lock,
    User,
    HelpCircle,
    Save,
} from 'lucide-react';
import { Card } from '../components/Card';
import { ProfilePhotoPicker } from '../components/ProfilePhotoPicker';
import { formatBytes } from '../utils/format';
import { clearOfflineData } from '../utils/offline';
import { auth, disconnectSocket } from '../utils/api';
import { listSavedRoutes, deleteSavedRoute, clearAllRoutes } from '../utils/routeStorage';
import { getProfilePrefs, saveProfilePrefs, updateStoredUser } from '../utils/profilePrefs';
import { mergeUserPreservingAvatar } from '../utils/profileAvatar';
import { useToast } from '../components/Toast';
import { ThemeToggle } from '../components/ThemeToggle';
import { BrandLogo } from '../components/BrandLogo';
import './MechanicList.css';
import './Profile.css';

export function Profile() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [savedRoutes, setSavedRoutes] = useState([]);
    const [loadingRoutes, setLoadingRoutes] = useState(true);
    const [prefs, setPrefs] = useState(getProfilePrefs());
    const [username, setUsername] = useState('');
    const [phone, setPhone] = useState('');
    const [savingAccount, setSavingAccount] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const refreshRoutes = async () => {
        setLoadingRoutes(true);
        const routes = await listSavedRoutes();
        setSavedRoutes(routes);
        setLoadingRoutes(false);
    };

    useEffect(() => {
        const userData = localStorage.getItem('mekanik_user');
        if (!userData) {
            navigate('/login');
            return;
        }
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setUsername(parsed.username || '');
        setPhone(parsed.phone || '');
        setPrefs(getProfilePrefs());
        refreshRoutes();

        let cancelled = false;
        auth.getMe()
            .then((res) => {
                if (cancelled) return;
                const fresh = mergeUserPreservingAvatar(parsed, res.data.user);
                setUser(fresh);
                setUsername(fresh.username || '');
                setPhone(fresh.phone || '');
                updateStoredUser(fresh);
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    const handleLogout = () => {
        disconnectSocket();
        localStorage.removeItem('mekanik_user');
        navigate('/');
    };

    const handleDeleteRoute = async (id) => {
        const updated = await deleteSavedRoute(id);
        setSavedRoutes(updated);
    };

    const handleClearAll = async () => {
        await clearAllRoutes();
        await clearOfflineData();
        setSavedRoutes([]);
        showToast('Offline data cleared', 'info');
    };

    const handleSaveAccount = async () => {
        setSavingAccount(true);
        try {
            const res = await auth.updateMe({ username: username.trim(), phone: phone.trim() });
            const next = updateStoredUser(mergeUserPreservingAvatar(user, res.data.user));
            setUser(next);
            showToast('Account updated', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not update account', 'error');
        } finally {
            setSavingAccount(false);
        }
    };

    const handleSavePrefs = (updates) => {
        const next = saveProfilePrefs({ ...prefs, ...updates });
        setPrefs(next);
        showToast('Preferences saved', 'success');
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setChangingPassword(true);
        try {
            await auth.changePassword({ currentPassword, newPassword });
            setCurrentPassword('');
            setNewPassword('');
            setShowPasswordForm(false);
            showToast('Password updated', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not change password', 'error');
        } finally {
            setChangingPassword(false);
        }
    };

    const totalMechanics = savedRoutes.reduce((sum, r) => sum + (r.count || 0), 0);
    const totalBytes = savedRoutes.reduce(
        (sum, r) => sum + new Blob([JSON.stringify(r)]).size,
        0
    );

    if (!user) return null;

    const displayName = user.username || user.identifier || 'User';

    return (
        <div className="list-container profile-page">
            <header className="list-header profile-page-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Profile & Settings</h2>
                <div className="page-theme-corner page-theme-corner--inline">
                    <ThemeToggle compact />
                </div>
            </header>

            <div className="profile-hero">
                <ProfilePhotoPicker
                    name={displayName}
                    avatarUrl={user.avatar_url}
                    onUpdated={(next) => setUser(next)}
                    size={96}
                />
                <h2 className="profile-name">{displayName}</h2>
                <div className="profile-email">
                    <Mail size={14} /> {user.email || 'No email provided'}
                </div>
                {user.phone && (
                    <div className="profile-email">
                        <Phone size={14} /> {user.phone}
                    </div>
                )}
                <div className="profile-role">
                    <Shield size={12} color="var(--color-brand)" /> {user.role || 'driver'}
                </div>
            </div>

            <div className="profile-content">
                <h3 className="profile-section-label">Account</h3>
                <Card className="profile-settings-card">
                    <label className="profile-field">
                        <span>Display name</span>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Your name"
                        />
                    </label>
                    <label className="profile-field">
                        <span>Phone (shown to mechanics on SOS)</span>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+234 800 000 0000"
                        />
                    </label>
                    <label className="profile-field disabled">
                        <span>Email</span>
                        <input type="email" value={user.email || ''} readOnly />
                    </label>
                    <button
                        type="button"
                        className="profile-save-btn"
                        onClick={handleSaveAccount}
                        disabled={savingAccount}
                    >
                        <Save size={16} /> {savingAccount ? 'Saving...' : 'Save account'}
                    </button>
                </Card>

                <h3 className="profile-section-label">Emergency & vehicle</h3>
                <Card className="profile-settings-card">
                    <label className="profile-field">
                        <span>Emergency contact name</span>
                        <input
                            type="text"
                            value={prefs.emergencyName}
                            onChange={(e) => setPrefs({ ...prefs, emergencyName: e.target.value })}
                            placeholder="Spouse, friend, family"
                        />
                    </label>
                    <label className="profile-field">
                        <span>Emergency phone</span>
                        <input
                            type="tel"
                            value={prefs.emergencyContact}
                            onChange={(e) => setPrefs({ ...prefs, emergencyContact: e.target.value })}
                            placeholder="+234 ..."
                        />
                    </label>
                    <label className="profile-field">
                        <span>Vehicle make & model</span>
                        <input
                            type="text"
                            value={`${prefs.vehicleMake}${prefs.vehicleModel ? ` ${prefs.vehicleModel}` : ''}`}
                            onChange={(e) => {
                                const [make, ...rest] = e.target.value.split(' ');
                                setPrefs({
                                    ...prefs,
                                    vehicleMake: make || '',
                                    vehicleModel: rest.join(' '),
                                });
                            }}
                            placeholder="Toyota Corolla"
                        />
                    </label>
                    <div className="profile-field-row">
                        <label className="profile-field">
                            <span>Plate number</span>
                            <input
                                type="text"
                                value={prefs.vehiclePlate}
                                onChange={(e) => setPrefs({ ...prefs, vehiclePlate: e.target.value })}
                                placeholder="ABC-123XY"
                            />
                        </label>
                        <label className="profile-field">
                            <span>Color</span>
                            <input
                                type="text"
                                value={prefs.vehicleColor}
                                onChange={(e) => setPrefs({ ...prefs, vehicleColor: e.target.value })}
                                placeholder="Silver"
                            />
                        </label>
                    </div>
                    <button
                        type="button"
                        className="profile-save-btn secondary"
                        onClick={() => handleSavePrefs(prefs)}
                    >
                        <Car size={16} /> Save breakdown details
                    </button>
                </Card>

                <h3 className="profile-section-label">Notifications</h3>
                <Card className="profile-settings-card profile-toggles">
                    <label className="profile-toggle">
                        <div>
                            <Bell size={18} />
                            <span>SOS & help request alerts</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={prefs.sosAlerts}
                            onChange={(e) => handleSavePrefs({ sosAlerts: e.target.checked })}
                        />
                    </label>
                    <label className="profile-toggle">
                        <div>
                            <User size={18} />
                            <span>Mechanic status updates</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={prefs.mechanicUpdates}
                            onChange={(e) => handleSavePrefs({ mechanicUpdates: e.target.checked })}
                        />
                    </label>
                </Card>

                <h3 className="profile-section-label">Security</h3>
                <Card className="profile-menu-item profile-setting-row">
                    <Lock size={22} color="var(--color-brand)" />
                    <div className="profile-setting-row-body">
                        <h4>Change password</h4>
                        {!showPasswordForm ? (
                            <button
                                type="button"
                                className="profile-link-btn"
                                onClick={() => setShowPasswordForm(true)}
                            >
                                Update password
                            </button>
                        ) : (
                            <form className="profile-password-form" onSubmit={handleChangePassword}>
                                <input
                                    type="password"
                                    placeholder="Current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="New password (min 6 chars)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                    required
                                />
                                <div className="profile-password-actions">
                                    <button type="submit" disabled={changingPassword}>
                                        {changingPassword ? 'Updating...' : 'Confirm'}
                                    </button>
                                    <button type="button" onClick={() => setShowPasswordForm(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </Card>

                <Card
                    className="profile-menu-item profile-setting-row clickable"
                    onClick={() => navigate('/two-factor-setup')}
                >
                    <Shield size={22} color="var(--color-brand)" />
                    <div className="profile-setting-row-body">
                        <h4>Two-factor authentication</h4>
                        <p>{user.is_2fa_enabled ? 'Enabled' : 'Off — tap to set up'}</p>
                    </div>
                    <ChevronRight size={20} />
                </Card>

                <h3 className="profile-section-label">Offline data</h3>
                <Card className="profile-menu-item profile-offline-card">
                    <Database size={24} color="var(--color-brand)" />
                    <div className="profile-offline-body">
                        <h3>Saved routes</h3>
                        <p className="profile-offline-summary">
                            {loadingRoutes
                                ? 'Loading saved routes...'
                                : savedRoutes.length
                                    ? `${savedRoutes.length} route${savedRoutes.length > 1 ? 's' : ''} · ${totalMechanics} mechanics · ${formatBytes(totalBytes)}`
                                    : 'No offline routes saved'}
                        </p>

                        {!loadingRoutes && savedRoutes.length > 0 && (
                            <ul className="saved-routes-list">
                                {savedRoutes.map((route) => (
                                    <li key={route.id} className="saved-route-item">
                                        <button
                                            type="button"
                                            className="saved-route-main"
                                            onClick={() => navigate(`/route-planner?routeId=${route.id}`)}
                                        >
                                            <Map size={18} className="saved-route-icon" />
                                            <div className="saved-route-info">
                                                <span className="saved-route-label">{route.label}</span>
                                                <span className="saved-route-meta">
                                                    {route.count} mechanics
                                                    {route.route?.distanceKm != null && ` · ${route.route.distanceKm} km`}
                                                    {route.savedAt && (
                                                        <>
                                                            {' · '}
                                                            <Clock size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />
                                                            {' '}
                                                            {new Date(route.savedAt).toLocaleDateString()}
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                            <ChevronRight size={18} className="saved-route-chevron" />
                                        </button>
                                        <button
                                            type="button"
                                            className="saved-route-delete"
                                            onClick={() => handleDeleteRoute(route.id)}
                                            aria-label={`Delete ${route.label}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {savedRoutes.length > 0 && (
                            <button type="button" className="profile-clear-btn" onClick={handleClearAll}>
                                Clear all offline data
                            </button>
                        )}
                    </div>
                </Card>

                <h3 className="profile-section-label">Support</h3>
                <Card className="profile-menu-item profile-setting-row">
                    <HelpCircle size={22} color="var(--color-brand)" />
                    <div className="profile-setting-row-body">
                        <h4>Breakdown safety tips</h4>
                        <p>Pull over safely, turn on hazards, share your live location, and call a cached mechanic if offline.</p>
                    </div>
                </Card>

                <div className="profile-brand-footer">
                    <BrandLogo size={48} showWordmark={false} />
                    <p className="profile-version">Mekanik Nearby v1.0 · Built for Nigerian highways</p>
                </div>

                <Card className="profile-menu-item profile-signout" onClick={handleLogout}>
                    <LogOut size={24} color="var(--color-danger)" />
                    <div>
                        <h3>Sign Out</h3>
                    </div>
                </Card>
            </div>
        </div>
    );
}
