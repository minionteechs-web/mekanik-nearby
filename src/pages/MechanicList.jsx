import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Wrench, Filter } from 'lucide-react';
import { MechanicCard } from '../components/MechanicCard';
import { EmptyState } from '../components/EmptyState';
import { MechanicCardSkeleton } from '../components/Skeleton';
import { mechanics as mechanicsApi } from '../utils/api';
import { refreshUserLocation, getLocationErrorMessage } from '../utils/location';
import { getOfflineMechanicsNear, isProbablyOffline } from '../utils/offlineMechanics';
import './MechanicList.css';

export function MechanicList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [mechanics, setMechanics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [onlineOnly, setOnlineOnly] = useState(false);
    const [fromCache, setFromCache] = useState(false);

    const loadMechanics = async () => {
        setLoading(true);
        setFromCache(false);
        setError('');
        try {
            const location = await refreshUserLocation();

            if (isProbablyOffline()) {
                const offline = await getOfflineMechanicsNear(location.lat, location.lng);
                if (offline.length) {
                    setMechanics(offline);
                    setFromCache(true);
                    setError('Offline — showing mechanics from your saved route, sorted by your GPS.');
                    return;
                }
            }

            try {
                const response = await mechanicsApi.getNearby(location.lat, location.lng, 50);
                setMechanics(response.data);
            } catch (apiErr) {
                const offline = await getOfflineMechanicsNear(location.lat, location.lng);
                if (offline.length) {
                    setMechanics(offline);
                    setFromCache(true);
                    setError('No signal — showing cached route mechanics near your current location.');
                } else {
                    throw apiErr;
                }
            }
        } catch (err) {
            console.error('Error fetching mechanics:', err);
            setError(getLocationErrorMessage(err));
            setMechanics([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMechanics();
    }, []);

    const filteredMechanics = mechanics
        .filter((mech) => !onlineOnly || mech.is_available)
        .filter((mech) =>
            mech.specialty?.toLowerCase().includes(search.toLowerCase()) ||
            mech.name?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => (a.distance_meters ?? Infinity) - (b.distance_meters ?? Infinity));

    return (
        <div className="list-container list-container-nav">
            <header className="list-header list-header-static">
                <div>
                    <h2>Find a Mechanic</h2>
                    <p className="list-subtitle">
                        {loading ? 'Searching...' : error && !fromCache
                            ? error
                            : `${filteredMechanics.length} available nearby`}
                        {fromCache && !loading && ' (offline cache)'}
                    </p>
                    {error && !loading && (
                        <button type="button" className="location-retry-inline" style={{ marginTop: '0.5rem' }} onClick={loadMechanics}>
                            Retry location
                        </button>
                    )}
                </div>
            </header>

            <div className="list-controls">
                <div className="search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name or specialty..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    className={`filter-toggle ${onlineOnly ? 'active' : ''}`}
                    onClick={() => setOnlineOnly(!onlineOnly)}
                    type="button"
                >
                    <Filter size={16} /> {onlineOnly ? 'Online only' : 'All'}
                </button>
            </div>

            <div className="mechanics-scroll-area">
                {loading ? (
                    <>
                        <MechanicCardSkeleton />
                        <MechanicCardSkeleton />
                        <MechanicCardSkeleton />
                    </>
                ) : error && mechanics.length === 0 ? (
                    <EmptyState icon={Wrench} title="Couldn't load mechanics" description={error} />
                ) : filteredMechanics.length > 0 ? (
                    filteredMechanics.map((mech) => (
                        <MechanicCard
                            key={mech.id}
                            mechanic={mech}
                            onClick={() => navigate(`/mechanic/${mech.id}`)}
                        />
                    ))
                ) : (
                    <EmptyState
                        icon={Wrench}
                        title="No mechanics found"
                        description={search ? 'Try a different search term or expand your area.' : 'No mechanics are online in your area right now. Check back soon.'}
                    />
                )}
            </div>
        </div>
    );
}

