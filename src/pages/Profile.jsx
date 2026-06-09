import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Database, LogOut, Mail, Shield, Map, Trash2, ChevronRight, Clock } from 'lucide-react';
import { Card } from '../components/Card';
import { formatBytes } from '../utils/format';
import { clearOfflineData } from '../utils/offline';
import { listSavedRoutes, deleteSavedRoute, clearAllRoutes } from '../utils/routeStorage';
import './MechanicList.css';
import './Profile.css';

export function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [savedRoutes, setSavedRoutes] = useState([]);
    const [loadingRoutes, setLoadingRoutes] = useState(true);

    const refreshRoutes = async () => {
        setLoadingRoutes(true);
        const routes = await listSavedRoutes();
        setSavedRoutes(routes);
        setLoadingRoutes(false);
    };

    useEffect(() => {
        const userData = localStorage.getItem('mekanik_user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            navigate('/login');
        }
        refreshRoutes();
    }, [navigate]);

    const handleLogout = () => {
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
    };

    const totalMechanics = savedRoutes.reduce((sum, r) => sum + (r.count || 0), 0);
    const totalBytes = savedRoutes.reduce(
        (sum, r) => sum + new Blob([JSON.stringify(r)]).size,
        0
    );

    if (!user) return null;

    return (
        <div className="list-container">
            <header className="list-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h2>My Profile</h2>
            </header>

            <div className="profile-hero">
                <div className="profile-avatar">
                    <User size={45} color="white" />
                </div>
                <h2 className="profile-name">{user.username || user.identifier}</h2>
                <div className="profile-email">
                    <Mail size={14} /> {user.email || 'No email provided'}
                </div>
                <div className="profile-role">
                    <Shield size={12} color="var(--color-brand)" /> {user.role || 'Driver'}
                </div>
            </div>

            <div className="profile-content">
                <Card className="profile-menu-item profile-offline-card">
                    <Database size={24} color="var(--color-brand)" />
                    <div className="profile-offline-body">
                        <h3>Offline Routes</h3>
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
