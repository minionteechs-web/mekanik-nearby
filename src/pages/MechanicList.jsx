import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Wrench, Filter } from 'lucide-react';
import { MechanicCard } from '../components/MechanicCard';
import { EmptyState } from '../components/EmptyState';
import { MechanicCardSkeleton } from '../components/Skeleton';
import { mechanics as mechanicsApi } from '../utils/api';
import { getAllCachedMechanics } from '../utils/routeStorage';
import './MechanicList.css';

export function MechanicList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [mechanics, setMechanics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [onlineOnly, setOnlineOnly] = useState(false);
    const [fromCache, setFromCache] = useState(false);

    useEffect(() => {
        const fetchNearbyMechanics = async (lat, lng) => {
            try {
                setLoading(true);
                setFromCache(false);
                const response = await mechanicsApi.getNearby(lat, lng, 50);
                setMechanics(response.data);
                setError('');
            } catch (err) {
                console.error('Error fetching mechanics:', err);
                const cached = await getAllCachedMechanics();
                if (cached.length) {
                    setMechanics(cached);
                    setFromCache(true);
                    setError('');
                } else {
                    setError('Failed to load nearby mechanics.');
                }
            } finally {
                setLoading(false);
            }
        };

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchNearbyMechanics(pos.coords.latitude, pos.coords.longitude),
                () => fetchNearbyMechanics(6.5244, 3.3792)
            );
        } else {
            fetchNearbyMechanics(6.5244, 3.3792);
        }
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
                        {loading ? 'Searching...' : `${filteredMechanics.length} available nearby`}
                        {fromCache && !loading && ' (offline cache)'}
                    </p>
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
                ) : error ? (
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

