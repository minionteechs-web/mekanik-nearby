import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Navigation, Loader2, Power, Send, MapPin } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { StatusTimeline } from '../components/StatusTimeline';
import { useToast } from '../components/Toast';
import { openDirections } from '../utils/maps';
import { initSocket, getSocket, requests as requestsApi, mechanics as mechanicsApi } from '../utils/api';
import './MechanicDashboard.css';

export function MechanicDashboard() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ completed: 0 });
    const [activeRequest, setActiveRequest] = useState(null);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [isAvailable, setIsAvailable] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('mekanik_user');
        if (!userData) {
            navigate('/login');
            return;
        }
        const parsed = JSON.parse(userData);
        if (parsed.role !== 'mechanic') {
            navigate('/home');
            return;
        }
        setUser(parsed);
        setupSocket();
        loadData();
        checkProfile();
    }, [navigate]);

    const checkProfile = async () => {
        try {
            const res = await mechanicsApi.getMyProfile();
            setProfile(res.data);
            setIsAvailable(res.data.is_available);
        } catch (err) {
            if (err.response?.status === 404) navigate('/mechanic-onboard');
        }
    };

    const loadData = async () => {
        try {
            const [assignedRes, incomingRes] = await Promise.all([
                requestsApi.getUserRequests(),
                requestsApi.getIncoming(),
            ]);
            const pending = incomingRes.data;
            const active = assignedRes.data.find((r) => ['accepted', 'en-route', 'arrived'].includes(r.status));
            const completed = assignedRes.data.filter((r) => r.status === 'completed').length;
            setIncomingRequests(pending);
            setStats({ completed });
            if (active) setActiveRequest(active);
        } catch (err) {
            console.error('Failed to load requests:', err);
        }
    };

    const setupSocket = async () => {
        const socket = await initSocket();
        if (socket) {
            const onNew = (data) => {
                setIncomingRequests((prev) => {
                    if (prev.some((r) => r.id === data.id)) return prev;
                    return [data, ...prev];
                });
                showToast('New SOS request nearby!', 'info');
            };
            socket.on('new_request', onNew);
            socket.on('new_broadcast_request', onNew);
            socket.on('status_updated', (data) => {
                if (data.status === 'cancelled') {
                    setActiveRequest(null);
                    showToast('Driver cancelled the request.', 'error');
                }
            });
        }
    };

    useEffect(() => {
        let locationInterval;
        if (activeRequest && ['accepted', 'en-route', 'arrived'].includes(activeRequest.status)) {
            locationInterval = setInterval(() => {
                if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        getSocket()?.emit('location_update', {
                            requestId: activeRequest.id,
                            driverId: activeRequest.driver_id,
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                        });
                    });
                }
            }, 5000);
        }
        return () => clearInterval(locationInterval);
    }, [activeRequest]);

    const handleAccept = async (request) => {
        setLoading(true);
        try {
            const response = await requestsApi.accept(request.id);
            setActiveRequest(response.data);
            setIncomingRequests((prev) => prev.filter((r) => r.id !== request.id));
            showToast('Request accepted. Head to the driver.', 'success');
        } catch (err) {
            showToast('Could not accept — may already be taken.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!activeRequest) return;
        setLoading(true);
        try {
            const response = await requestsApi.updateStatus(activeRequest.id, status);
            if (status === 'completed') {
                setActiveRequest(null);
                setStats((s) => ({ completed: s.completed + 1 }));
                showToast('Job completed. Great work!', 'success');
            } else {
                setActiveRequest(response.data);
            }
        } catch (err) {
            showToast('Could not update status.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="mechanic-dashboard">
            <header className="dash-header">
                <div>
                    <h1>Mechanic Portal</h1>
                    <p>Welcome back, {user.username}</p>
                </div>
                <button
                    className={`availability-pill ${isAvailable ? 'on' : 'off'}`}
                    onClick={async () => {
                        const next = !isAvailable;
                        try {
                            await mechanicsApi.updateAvailability(next);
                            setIsAvailable(next);
                            showToast(next ? 'You are now online' : 'You are offline', 'info');
                        } catch (err) {
                            showToast('Could not update availability', 'error');
                        }
                    }}
                >
                    <Power size={14} /> {isAvailable ? 'Online' : 'Offline'}
                </button>
            </header>

            {!activeRequest && (
                <div className="dash-stats">
                    <Card className="stat-card">
                        <span className="stat-value">{stats.completed}</span>
                        <span className="stat-label">Jobs done</span>
                    </Card>
                    <Card className="stat-card">
                        <span className="stat-value">{profile?.rating?.toFixed(1) || '—'}</span>
                        <span className="stat-label">Rating</span>
                    </Card>
                    <Card className="stat-card">
                        <span className="stat-value">{profile?.reviews_count || 0}</span>
                        <span className="stat-label">Reviews</span>
                    </Card>
                </div>
            )}

            {activeRequest && (
                <Card className="active-job-card">
                    <div className="active-job-header">
                        <span className="live-dot" />
                        <span>Active job</span>
                    </div>
                    <h2>Driver #{activeRequest.driver_id}</h2>
                    {activeRequest.driver_lat && (
                        <p className="job-location">
                            <MapPin size={14} />
                            Location shared ({activeRequest.driver_lat.toFixed(4)}, {activeRequest.driver_lng.toFixed(4)})
                        </p>
                    )}

                    <StatusTimeline currentStatus={activeRequest.status} />

                    <div className="job-actions">
                        <Button variant="secondary" className="flex-1" onClick={() => {
                            if (activeRequest.driver_lat && 'geolocation' in navigator) {
                                navigator.geolocation.getCurrentPosition((pos) => {
                                    openDirections(
                                        pos.coords.latitude, pos.coords.longitude,
                                        activeRequest.driver_lat, activeRequest.driver_lng
                                    );
                                });
                            } else if (activeRequest.driver_lat) {
                                window.open(`https://maps.google.com/?q=${activeRequest.driver_lat},${activeRequest.driver_lng}`);
                            }
                        }}>
                            <Navigation size={16} style={{ marginRight: 6 }} /> Navigate
                        </Button>
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => navigate(`/chat/${activeRequest.id}?receiverId=${activeRequest.driver_id}&name=Driver`)}
                        >
                            <Send size={16} style={{ marginRight: 6 }} /> Message
                        </Button>
                    </div>

                    <div className="status-buttons">
                        {activeRequest.status === 'accepted' && (
                            <Button onClick={() => handleUpdateStatus('en-route')} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Start driving'}
                            </Button>
                        )}
                        {activeRequest.status === 'en-route' && (
                            <Button onClick={() => handleUpdateStatus('arrived')} disabled={loading}>I've arrived</Button>
                        )}
                        {activeRequest.status === 'arrived' && (
                            <Button onClick={() => handleUpdateStatus('completed')} disabled={loading}>Complete job</Button>
                        )}
                    </div>
                </Card>
            )}

            <h3 className="section-title">Incoming requests</h3>

            {incomingRequests.length > 0 ? (
                <div className="request-list">
                    {incomingRequests.map((req) => (
                        <Card key={req.id} className="request-card">
                            <div className="request-card-top">
                                <span className="urgent-badge">Urgent</span>
                                {req.driver_lat && (
                                    <span className="request-meta">
                                        <MapPin size={12} /> Location shared
                                    </span>
                                )}
                            </div>
                            <p>Driver needs immediate roadside assistance.</p>
                            <Button onClick={() => handleAccept(req)} disabled={loading || !!activeRequest}>
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Accept request'}
                            </Button>
                        </Card>
                    ))}
                </div>
            ) : (
                !activeRequest && (
                    <EmptyState
                        icon={Bell}
                        title={isAvailable ? 'Standing by' : 'You are offline'}
                        description={isAvailable
                            ? "You'll get instant alerts when a driver nearby needs help."
                            : 'Go online to start receiving SOS requests.'}
                    />
                )
            )}
        </div>
    );
}
