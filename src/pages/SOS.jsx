import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldAlert, X, Navigation, MessageSquare, Share2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { MapComponent } from '../components/MapComponent';
import { StatusTimeline } from '../components/StatusTimeline';
import { MechanicCard } from '../components/MechanicCard';
import { useToast } from '../components/Toast';
import { mechanics as mechanicsApi, requests as requestsApi, initSocket } from '../utils/api';
import { formatDistance } from '../utils/format';
import { openGoogleMaps, openDirections } from '../utils/maps';
import './SOS.css';

export function SOS() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const [status, setStatus] = useState('idle');
    const [nearest, setNearest] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeRequestId, setActiveRequestId] = useState(null);
    const [requestStatus, setRequestStatus] = useState('pending');
    const [userPosition, setUserPosition] = useState(null);
    const [mechanicPosition, setMechanicPosition] = useState(null);

    useEffect(() => {
        const socket = initSocket();
        if (!socket) return;

        const onAccepted = (data) => {
            if (data.id === activeRequestId || searchParams.get('track') === String(data.id)) {
                setRequestStatus('accepted');
                setStatus('tracking');
                showToast('Mechanic accepted your request!', 'success');
            }
        };

        const onStatusUpdate = (data) => {
            if (data.id === activeRequestId) {
                setRequestStatus(data.status);
                if (data.status === 'completed') {
                    showToast('Job completed. Stay safe!', 'success');
                }
            }
        };

        const onMechanicLocation = (data) => {
            if (data.requestId === activeRequestId) {
                setMechanicPosition({ lat: data.lat, lng: data.lng, name: nearest?.name });
            }
        };

        socket.on('request_accepted', onAccepted);
        socket.on('status_updated', onStatusUpdate);
        socket.on('mechanic_location', onMechanicLocation);

        const trackId = searchParams.get('track');
        if (trackId) {
            setActiveRequestId(parseInt(trackId, 10));
            setStatus('tracking');
            requestsApi.getUserRequests().then((res) => {
                const req = res.data.find((r) => r.id === parseInt(trackId, 10));
                if (req) {
                    setRequestStatus(req.status);
                    if (req.driver_lat) {
                        setUserPosition([req.driver_lat, req.driver_lng]);
                    }
                }
            });
        }

        return () => {
            socket.off('request_accepted', onAccepted);
            socket.off('status_updated', onStatusUpdate);
            socket.off('mechanic_location', onMechanicLocation);
        };
    }, [activeRequestId, searchParams, showToast, nearest?.name]);

    useEffect(() => {
        const mechanicId = searchParams.get('mechanicId');
        if (!mechanicId || status !== 'idle') return;

        mechanicsApi.getDetail(mechanicId)
            .then((res) => {
                if (res.data) {
                    setNearest(res.data);
                    setStatus('found');
                }
            })
            .catch(() => {});
    }, [searchParams, status]);

    useEffect(() => {
        if (status !== 'tracking' || !('geolocation' in navigator)) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
            console.error,
            { enableHighAccuracy: true, maximumAge: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [status]);

    const handleSOS = () => {
        setStatus('locating');
        setError('');

        if (!('geolocation' in navigator)) {
            setError('Your browser does not support geolocation.');
            setStatus('idle');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    setUserPosition([latitude, longitude]);
                    const response = await mechanicsApi.getNearby(latitude, longitude, 50);
                    const mechanics = response.data;

                    if (mechanics?.length > 0) {
                        setNearest(mechanics[0]);
                        setStatus('found');
                    } else {
                        setError('No mechanics available within 50 km. Try again shortly.');
                        setStatus('idle');
                    }
                } catch (err) {
                    console.error('SOS Error:', err);
                    setError('Could not reach servers. Check your connection.');
                    setStatus('idle');
                }
            },
            () => {
                setError('Enable location services to use emergency SOS.');
                setStatus('idle');
            }
        );
    };

    const confirmRequest = () => {
        if (!nearest) return;
        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    setUserPosition([latitude, longitude]);
                    const response = await requestsApi.create({
                        mechanic_id: nearest.user_id,
                        lat: latitude,
                        lng: longitude,
                    });
                    setActiveRequestId(response.data.id);
                    setRequestStatus('pending');
                    setStatus('tracking');
                    showToast('Help request sent. Stay where you are.', 'success');
                } catch (err) {
                    setError('Failed to send request. The mechanic may be offline.');
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setError('Could not get your location.');
                setLoading(false);
            }
        );
    };

    const shareLocation = () => {
        if (!userPosition) return;
        const [lat, lng] = userPosition;
        if (navigator.share) {
            navigator.share({
                title: 'I need roadside help',
                text: "I'm stranded and requested help via Mekanik Nearby.",
                url: `https://maps.google.com/?q=${lat},${lng}`,
            }).catch(() => {});
        } else {
            openGoogleMaps(lat, lng, 'My location');
        }
    };

    const isActive = status !== 'idle';
    const mapCenter = userPosition || [6.5244, 3.3792];

    return (
        <div className={`sos-container ${isActive ? 'active' : ''} ${status === 'tracking' ? 'has-map' : ''}`}>
            {status !== 'tracking' && (
                <header className="sos-header">
                    <button className="icon-btn-back" onClick={() => navigate(-1)} aria-label="Close">
                        <X size={24} />
                    </button>
                </header>
            )}

            {error && (
                <div className="sos-error-toast">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError('')}><X size={14} /></button>
                </div>
            )}

            {status === 'idle' && (
                <div className="sos-idle-state">
                    <div className="sos-hero-badge">24/7 Roadside Help</div>
                    <h2>Emergency SOS</h2>
                    <p>Broadcast your location to the nearest available mechanic instantly.</p>
                    <button className="sos-big-btn" onClick={handleSOS}>
                        <span className="sos-pulse-ring" />
                        <ShieldAlert size={72} />
                        <span>GET HELP</span>
                    </button>
                    <p className="sos-disclaimer">Only use for genuine breakdowns or emergencies.</p>
                </div>
            )}

            {status === 'locating' && (
                <div className="sos-locating-state">
                    <div className="radar-animation" />
                    <h2>Finding help...</h2>
                    <p>Scanning for available mechanics near you</p>
                </div>
            )}

            {status === 'found' && nearest && (
                <div className="sos-found-state">
                    <div className="sos-found-map">
                        <MapComponent
                            center={mapCenter}
                            zoom={14}
                            markers={[nearest]}
                            fitToMarkers
                        />
                    </div>
                    <div className="sos-found-panel">
                        <h2>Help found</h2>
                        <p>{formatDistance(nearest.distance_meters)} away — ready to assist</p>
                        <MechanicCard mechanic={nearest} onClick={() => navigate(`/mechanic/${nearest.id}`)} />
                        <div className="sos-actions">
                            <Button className="flex-1" onClick={confirmRequest} disabled={loading}>
                                {loading ? 'Sending...' : 'Request Help'}
                            </Button>
                            <Button className="flex-1" variant="secondary" onClick={() => setStatus('idle')}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {status === 'tracking' && (
                <div className="sos-tracking-layout">
                    <div className="sos-tracking-map">
                        <button className="sos-map-close" onClick={() => navigate(-1)} aria-label="Close">
                            <X size={22} />
                        </button>
                        <MapComponent
                            center={mapCenter}
                            zoom={15}
                            markers={nearest ? [nearest] : []}
                            trackingMechanic={mechanicPosition}
                            fitToMarkers
                            showLocateButton
                        />
                    </div>

                    <div className="sos-tracking-panel">
                        <div className={`tracking-pulse ${requestStatus}`} />
                        <h2>{requestStatus === 'pending' ? 'Waiting for mechanic' : 'Help is on the way'}</h2>
                        <p>Live map · Your exact location is shared</p>

                        <Card className="sos-timeline-card">
                            <StatusTimeline currentStatus={requestStatus} />
                        </Card>

                        {nearest && (
                            <p className="sos-mech-name">Notified: <strong>{nearest.name}</strong></p>
                        )}

                        <div className="sos-actions sos-tracking-actions">
                            {activeRequestId && nearest && (
                                <Button
                                    className="flex-1"
                                    onClick={() => navigate(`/chat/${activeRequestId}?receiverId=${nearest.user_id}&name=${nearest.name}`)}
                                >
                                    <MessageSquare size={18} style={{ marginRight: 8 }} /> Chat
                                </Button>
                            )}
                            {mechanicPosition && userPosition && (
                                <Button
                                    className="flex-1"
                                    variant="secondary"
                                    onClick={() => openDirections(
                                        userPosition[0], userPosition[1],
                                        mechanicPosition.lat, mechanicPosition.lng
                                    )}
                                >
                                    <ExternalLink size={16} style={{ marginRight: 6 }} /> Directions
                                </Button>
                            )}
                            <Button className="flex-1" variant="secondary" onClick={shareLocation}>
                                <Share2 size={18} style={{ marginRight: 8 }} /> Share
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
