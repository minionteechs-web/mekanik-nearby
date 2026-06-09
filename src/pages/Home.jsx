import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, MapPin, ChevronUp, Navigation } from 'lucide-react';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { MapComponent } from '../components/MapComponent';
import { MechanicCard } from '../components/MechanicCard';
import { mechanics as mechanicsApi, initSocket } from '../utils/api';
import { useToast } from '../components/Toast';
import { getGreeting } from '../utils/format';
import { refreshUserLocation, getLocationErrorMessage } from '../utils/location';
import './Home.css';

export function Home() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [userLoc, setUserLoc] = useState(null);
    const [userName, setUserName] = useState('Driver');
    const [userAvatar, setUserAvatar] = useState(null);
    const [locationLabel, setLocationLabel] = useState('Locating you...');
    const [locationError, setLocationError] = useState('');
    const [nearbyMechanics, setNearbyMechanics] = useState([]);
    const [sheetExpanded, setSheetExpanded] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadLocationAndMechanics = async () => {
        try {
            setLoading(true);
            setLocationError('');
            const location = await refreshUserLocation();
            setUserLoc([location.lat, location.lng]);
            setLocationLabel(location.label);

            const response = await mechanicsApi.getNearby(location.lat, location.lng, 30);
            setNearbyMechanics(response.data);
        } catch (err) {
            console.error('Location/mechanics error:', err);
            setLocationError(getLocationErrorMessage(err));
            setLocationLabel('Location unavailable');
            setNearbyMechanics([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem('mekanik_user');
        if (!userStr) {
            navigate('/login');
            return;
        }
        const userData = JSON.parse(userStr);
        setUserName(userData.username || 'Driver');
        setUserAvatar(userData.avatar_url || null);
        const socket = initSocket();
        loadLocationAndMechanics();

        if (socket) {
            const onAccepted = () => showToast('Mechanic accepted your SOS — open Activity to track', 'success');
            const onStatus = (data) => {
                if (['en-route', 'arrived', 'completed'].includes(data.status)) {
                    showToast(`Help request: ${data.status.replace('-', ' ')}`, 'info');
                }
            };
            socket.on('request_accepted', onAccepted);
            socket.on('status_updated', onStatus);
            return () => {
                socket.off('request_accepted', onAccepted);
                socket.off('status_updated', onStatus);
            };
        }
    }, [navigate, showToast]);

    const previewMechanics = sheetExpanded ? nearbyMechanics : nearbyMechanics.slice(0, 2);

    return (
        <div className="home-map-layout">
            <div className="home-map-layer">
                <MapComponent
                    center={userLoc || [6.5244, 3.3792]}
                    zoom={16}
                    showUserLocation={!!userLoc}
                    mapStyle="live"
                    markers={nearbyMechanics}
                    fitToMarkers={nearbyMechanics.length > 0}
                    onMarkerClick={(mech) => navigate(`/mechanic/${mech.id}`)}
                />
                <div className="map-overlay-header">
                    <div className="home-header-main">
                        <div className="home-brand-chip">
                            <img src="/logo.png" alt="" className="home-brand-pin" aria-hidden />
                            <span className="home-brand-name">Mekanik Nearby</span>
                        </div>
                        <h2 className="home-greeting-text">{getGreeting(userName)}</h2>
                        <p className="home-location-line">
                            <Navigation size={13} />
                            {loading ? 'Finding your location...' : locationError ? (
                                <span className="home-location-error">{locationError}</span>
                            ) : (
                                <>You&apos;re in <strong>{locationLabel}</strong></>
                            )}
                        </p>
                    </div>
                    <div className="home-header-actions">
                        {!loading && !locationError && (
                            <div className="nearby-chip">
                                <MapPin size={14} />
                                {nearbyMechanics.length} nearby
                            </div>
                        )}
                        {locationError && (
                            <button type="button" className="location-retry-btn" onClick={loadLocationAndMechanics}>
                                Enable location
                            </button>
                        )}
                        <ProfileAvatar
                            name={userName}
                            avatarUrl={userAvatar}
                            size={42}
                            className="header"
                            onClick={() => navigate('/profile')}
                            title="Profile & settings"
                        />
                    </div>
                </div>
            </div>

            <div className={`home-bottom-sheet ${sheetExpanded ? 'expanded' : ''}`}>
                <button
                    className="sheet-handle"
                    onClick={() => setSheetExpanded(!sheetExpanded)}
                    aria-label={sheetExpanded ? 'Collapse' : 'Expand'}
                >
                    <div className="sheet-grabber" />
                    <ChevronUp size={18} className={sheetExpanded ? 'rotated' : ''} />
                </button>

                <div className="sheet-content">
                    <div className="sheet-quick-row">
                        <button className="quick-pill" onClick={() => navigate('/mechanics')}>
                            <Wrench size={16} /> Browse all
                        </button>
                        <button className="quick-pill secondary" onClick={() => navigate('/route-planner')}>
                            Offline routes
                        </button>
                    </div>

                    <h3 className="sheet-title">
                        {loading ? 'Searching...' : `${nearbyMechanics.length} mechanics near you`}
                    </h3>

                    <div className="sheet-mechanics">
                        {loading ? (
                            <p className="sheet-loading">Scanning your area...</p>
                        ) : previewMechanics.length > 0 ? (
                            previewMechanics.map((mech) => (
                                <MechanicCard
                                    key={mech.id}
                                    mechanic={mech}
                                    onClick={() => navigate(`/mechanic/${mech.id}`)}
                                />
                            ))
                        ) : (
                            <p className="sheet-empty">No mechanics online nearby. Try expanding your search.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
