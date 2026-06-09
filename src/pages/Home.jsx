import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, MapPin, ChevronUp } from 'lucide-react';
import { MapComponent } from '../components/MapComponent';
import { MechanicCard } from '../components/MechanicCard';
import { mechanics as mechanicsApi } from '../utils/api';
import { getGreeting } from '../utils/format';
import './Home.css';

export function Home() {
    const navigate = useNavigate();
    const [userLoc, setUserLoc] = useState([6.5244, 3.3792]);
    const [userName, setUserName] = useState('Driver');
    const [nearbyMechanics, setNearbyMechanics] = useState([]);
    const [sheetExpanded, setSheetExpanded] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('mekanik_user');
        if (!userStr) {
            navigate('/login');
            return;
        }
        const userData = JSON.parse(userStr);
        setUserName(userData.username || 'Driver');

        const fetchNearby = async (lat, lng) => {
            try {
                setLoading(true);
                const response = await mechanicsApi.getNearby(lat, lng, 30);
                setNearbyMechanics(response.data);
            } catch (err) {
                console.error('Error fetching dashboard mechanics:', err);
            } finally {
                setLoading(false);
            }
        };

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setUserLoc([lat, lng]);
                    fetchNearby(lat, lng);
                },
                () => fetchNearby(6.5244, 3.3792),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            fetchNearby(6.5244, 3.3792);
        }
    }, [navigate]);

    const previewMechanics = sheetExpanded ? nearbyMechanics : nearbyMechanics.slice(0, 2);

    return (
        <div className="home-map-layout">
            <div className="home-map-layer">
                <MapComponent
                    center={userLoc}
                    zoom={14}
                    markers={nearbyMechanics}
                    fitToMarkers={nearbyMechanics.length > 0}
                    onMarkerClick={(mech) => navigate(`/mechanic/${mech.id}`)}
                />
                <div className="map-overlay-header">
                    <div>
                        <h2 className="home-greeting-text">{getGreeting(userName)}</h2>
                        <p className="home-subtext">Roadside help, one tap away</p>
                    </div>
                    {!loading && (
                        <div className="nearby-chip">
                            <MapPin size={14} />
                            {nearbyMechanics.length} nearby
                        </div>
                    )}
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
