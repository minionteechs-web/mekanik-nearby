import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, MessageSquare, ChevronRight } from 'lucide-react';
import { requests as requestsApi } from '../utils/api';
import { getStatusLabel } from '../utils/format';
import { EmptyState } from '../components/EmptyState';
import { MechanicCardSkeleton } from '../components/Skeleton';
import './Activity.css';

export function Activity() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        requestsApi.getUserRequests()
            .then((res) => setRequests(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const statusClass = (status) => {
        if (['accepted', 'en-route', 'arrived'].includes(status)) return 'active';
        if (status === 'completed') return 'done';
        if (status === 'cancelled') return 'cancelled';
        return 'pending';
    };

    return (
        <div className="activity-page">
            <header className="activity-header">
                <h1>Activity</h1>
                <p>Your help requests and service history</p>
            </header>

            {loading ? (
                <div className="activity-list">
                    <MechanicCardSkeleton />
                    <MechanicCardSkeleton />
                </div>
            ) : requests.length === 0 ? (
                <EmptyState
                    icon={ClipboardList}
                    title="No activity yet"
                    description="When you request roadside help, your jobs will appear here with live status updates."
                />
            ) : (
                <div className="activity-list">
                    {requests.map((req) => (
                        <button
                            key={req.id}
                            className="activity-item"
                            onClick={() => {
                                if (['accepted', 'en-route', 'arrived', 'pending'].includes(req.status)) {
                                    navigate(`/sos?track=${req.id}`);
                                }
                            }}
                        >
                            <div className="activity-item-top">
                                <span className={`activity-status ${statusClass(req.status)}`}>
                                    {getStatusLabel(req.status)}
                                </span>
                                <span className="activity-date">
                                    {new Date(req.requested_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="activity-title">
                                {req.mechanic_name ? `Help from ${req.mechanic_name}` : `Request #${req.id}`}
                            </p>
                            {['accepted', 'en-route', 'arrived'].includes(req.status) && (
                                <span className="activity-action">
                                    <MessageSquare size={14} /> Track live
                                    <ChevronRight size={14} />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
