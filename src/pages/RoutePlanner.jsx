import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Download, Map as MapIcon, Navigation, Clock, Ruler, ExternalLink } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { RouteMap } from '../components/RouteMap';
import { RouteDirections } from '../components/RouteDirections';
import { RouteInsights } from '../components/RouteInsights';
import { useToast } from '../components/Toast';
import { downloadRouteMechanics } from '../utils/routePlanner';
import { planRoute } from '../utils/routeGeometry';
import { refreshUserLocation, getLocationErrorMessage, watchUserLocation } from '../utils/location';
import { rankMechanicsByGps } from '../utils/offlineMechanics';
import { formatDistance } from '../utils/format';
import { getSavedRoute, listSavedRoutes } from '../utils/routeStorage';
import { openRouteInGoogleMaps } from '../utils/maps';
import './MechanicList.css';
import './RoutePlanner.css';

export function RoutePlanner() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { showToast } = useToast();
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [userLocation, setUserLocation] = useState(null);
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [previewing, setPreviewing] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState('');
    const [locationError, setLocationError] = useState('');

    useEffect(() => {
        refreshUserLocation()
            .then((loc) => {
                setUserLocation(loc);
                setStart(loc.label.split(',')[0].trim());
                setLocationError('');
            })
            .catch((err) => {
                setLocationError(getLocationErrorMessage(err));
            });

        const routeId = searchParams.get('routeId');
        const loadSaved = async () => {
            if (routeId) {
                const saved = await getSavedRoute(routeId);
                if (saved) {
                    setResult(saved);
                    setStart(saved.route.start?.name || '');
                    setEnd(saved.route.end?.name || '');
                    return;
                }
            }
            const routes = await listSavedRoutes();
            if (routes[0]) setResult(routes[0]);
        };
        loadSaved();
    }, [searchParams]);

    useEffect(() => {
        if (!result?.route) return undefined;
        return watchUserLocation((loc) => {
            setUserLocation(loc);
            setLocationError('');
        });
    }, [result?.id]);

    const handlePreview = async () => {
        if (!start.trim() || !end.trim()) {
            setError('Enter both start and destination');
            return;
        }
        setPreviewing(true);
        setError('');
        setResult(null);
        try {
            const planned = await planRoute(start.trim(), end.trim());
            setPreview(planned);
        } catch (err) {
            setError(err.message || 'Could not plan route');
            setPreview(null);
        } finally {
            setPreviewing(false);
        }
    };

    const handleDownload = async () => {
        if (!start.trim() || !end.trim()) {
            setError('Enter both start and destination');
            return;
        }

        setDownloading(true);
        setError('');
        try {
            const payload = await downloadRouteMechanics(start.trim(), end.trim());
            setResult(payload);
            setPreview(payload.route);
            showToast(`Saved ${payload.count} mechanics along your route`, 'success');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || 'Download failed.';
            setError(msg);
        } finally {
            setDownloading(false);
        }
    };

    const activeRoute = result?.route || preview;

    const mapMechanics = useMemo(() => {
        if (result?.mechanics?.length && userLocation?.lat != null) {
            return rankMechanicsByGps(result.mechanics, userLocation.lat, userLocation.lng);
        }
        return result?.mechanics || [];
    }, [result, userLocation]);

    const nearestOffline = useMemo(
        () => (mapMechanics.length ? mapMechanics.slice(0, 3) : []),
        [mapMechanics]
    );

    const handleOpenGoogleMaps = () => {
        if (!activeRoute?.start?.lat || !activeRoute?.end?.lat) return;
        openRouteInGoogleMaps(activeRoute.start, activeRoute.end);
    };

    return (
        <div className="list-container route-planner-page">
            <header className="list-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Route Planner</h2>
            </header>

            {(userLocation || locationError) && (
                <div className={`location-banner ${locationError ? 'location-banner-error' : ''}`}>
                    <Navigation size={16} />
                    {userLocation ? (
                        <span>Your location: <strong>{userLocation.label}</strong></span>
                    ) : (
                        <span>{locationError}</span>
                    )}
                    {locationError && (
                        <button
                            type="button"
                            className="location-retry-inline"
                            onClick={() => refreshUserLocation()
                                .then((loc) => {
                                    setUserLocation(loc);
                                    setStart(loc.label.split(',')[0].trim());
                                    setLocationError('');
                                })
                                .catch((err) => setLocationError(getLocationErrorMessage(err)))}
                        >
                            Retry
                        </button>
                    )}
                </div>
            )}

            <Card className="route-form-card">
                <p className="route-form-hint">
                    Plan your highway trip, preview turn-by-turn directions, then download mechanic contacts along the way for offline use.
                </p>
                <Input label="Starting Point" placeholder="e.g. Lagos" value={start} onChange={(e) => setStart(e.target.value)} />
                <Input label="Destination" placeholder="e.g. Enugu" value={end} onChange={(e) => setEnd(e.target.value)} />

                <div className="route-action-row">
                    <Button variant="secondary" onClick={handlePreview} disabled={previewing || !start.trim() || !end.trim()}>
                        <MapIcon size={18} style={{ marginRight: 8 }} />
                        {previewing ? 'Planning...' : 'Preview Route'}
                    </Button>
                    <Button onClick={handleDownload} disabled={downloading || !start.trim() || !end.trim()}>
                        <Download size={18} style={{ marginRight: 8 }} />
                        {downloading ? 'Saving...' : 'Save Offline'}
                    </Button>
                </div>

                {error && <p className="route-error">{error}</p>}
            </Card>

            {activeRoute?.path && (
                <Card className="route-map-card">
                    <div className="route-map-header">
                        <div>
                            <h3 className="route-map-title">
                                {activeRoute.start?.label || activeRoute.start?.name} → {activeRoute.end?.label || activeRoute.end?.name}
                            </h3>
                            {result && (
                                <span className="route-saved-badge">Saved offline</span>
                            )}
                        </div>
                        <div className="route-stats">
                            {activeRoute.distanceKm != null && (
                                <span><Ruler size={14} /> {activeRoute.distanceKm} km</span>
                            )}
                            {activeRoute.durationMin != null && (
                                <span><Clock size={14} /> ~{activeRoute.durationMin} min drive</span>
                            )}
                        </div>
                    </div>

                    {result && userLocation && (
                        <p className="route-breakdown-banner">
                            <Navigation size={14} />
                            You are here on your saved route — blue dot updates via GPS even offline.
                        </p>
                    )}

                    <RouteMap
                        path={activeRoute.path}
                        start={activeRoute.start}
                        end={activeRoute.end}
                        mechanics={mapMechanics}
                        userLocation={result ? userLocation : null}
                        height={300}
                    />

                    <div className="route-map-actions">
                        <button type="button" className="google-maps-btn" onClick={handleOpenGoogleMaps}>
                            <ExternalLink size={16} />
                            Open in Google Maps
                        </button>
                    </div>

                    <RouteDirections steps={activeRoute.steps} collapsedDefault={!!result} />

                    <RouteInsights
                        elevation={activeRoute.elevation}
                        restStops={activeRoute.restStops}
                        gainM={activeRoute.elevation?.gainM}
                    />

                    {result && nearestOffline.length > 0 && userLocation && (
                        <div className="route-nearby-offline">
                            <h4>Nearest cached mechanics to you now</h4>
                            <ul>
                                {nearestOffline.map((m) => (
                                    <li key={m.id}>
                                        <button type="button" onClick={() => navigate(`/mechanic/${m.id}`)}>
                                            <strong>{m.name}</strong> — {formatDistance(m.distance_meters)}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {result ? (
                        <div className="route-result-footer">
                            <p>
                                <strong>{result.count}</strong> mechanics cached along this corridor.
                                Directions, elevation, and rest stops are saved on your device.
                            </p>
                            <Button variant="secondary" onClick={() => navigate('/mechanics')}>
                                Browse all cached mechanics
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/sos')}>
                                Emergency SOS
                            </Button>
                        </div>
                    ) : (
                        <p className="route-preview-hint">
                            Previewing driving route. Tap <strong>Save Offline</strong> to cache mechanics along this path.
                        </p>
                    )}
                </Card>
            )}
        </div>
    );
}
