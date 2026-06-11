import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Star, Phone, MessageSquare, Map, Loader2, ShieldCheck, Flag, Calendar } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { MapComponent } from '../components/MapComponent';
import {
    mechanics as mechanicsApi,
    reviews as reviewsApi,
    requests as requestsApi,
    reports as reportsApi,
} from '../utils/api';
import { useToast } from '../components/Toast';
import './MechanicList.css';

export function MechanicDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [mech, setMech] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reviews, setReviews] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [activePhone, setActivePhone] = useState(null);
    const [canReview, setCanReview] = useState(false);
    const [reviewRequestId, setReviewRequestId] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchMechanic = async () => {
            try {
                setLoading(true);
                const response = await mechanicsApi.getDetail(id);
                setMech(response.data);
                setError('');

                const [revRes, catRes] = await Promise.all([
                    reviewsApi.getForMechanic(response.data.user_id),
                    mechanicsApi.getCatalog(response.data.user_id).catch(() => ({ data: [] })),
                ]);
                setReviews(revRes.data);
                setCatalog(catRes.data);

                try {
                    const reqRes = await requestsApi.getUserRequests();
                    const active = reqRes.data.find(
                        (r) => r.mechanic_id === response.data.user_id
                            && !['completed', 'cancelled'].includes(r.status)
                    );
                    if (active?.mechanic_phone) {
                        setActivePhone(active.mechanic_phone);
                    }

                    const elig = await reviewsApi.getEligibility(response.data.user_id);
                    setCanReview(elig.data.canReview);
                    setReviewRequestId(elig.data.request_id);
                } catch { /* not logged in or driver only */ }
            } catch (err) {
                console.error('Error fetching mechanic detail:', err);
                setError('Mechanic not found or server error.');
            } finally {
                setLoading(false);
            }
        };

        fetchMechanic();
    }, [id]);

    const handleMessage = async () => {
        try {
            const res = await requestsApi.getUserRequests();
            const existing = res.data.find(
                (r) => r.mechanic_id === mech.user_id && !['completed', 'cancelled'].includes(r.status)
            );
            if (existing) {
                navigate(`/chat/${existing.id}?receiverId=${mech.user_id}&name=${encodeURIComponent(mech.name)}`);
            } else {
                navigate(`/sos?mechanicId=${mech.id}`);
            }
        } catch {
            navigate(`/sos?mechanicId=${mech.id}`);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (rating > 0 && reviewRequestId) {
            try {
                await reviewsApi.create({
                    request_id: reviewRequestId,
                    rating,
                    comment: reviewText,
                });
                setSubmitted(true);
                setCanReview(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to submit review');
            }
        }
    };

    const handleReport = async () => {
        const reason = window.prompt('Reason for report (e.g. fraud, harassment):');
        if (!reason) return;
        try {
            await reportsApi.create({ reported_user_id: mech.user_id, reason });
            showToast('Report submitted. Our team will review it.', 'success');
        } catch {
            showToast('Could not submit report', 'error');
        }
    };

    if (loading) {
        return (
            <div className="list-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin" size={48} color="var(--color-brand)" />
            </div>
        );
    }

    if (error && !mech) {
        return (
            <div className="list-container">
                <header className="list-header">
                    <button className="icon-btn-back" onClick={() => navigate('/mechanics')}>
                        <ChevronLeft size={24} />
                    </button>
                    <h2>Profile Not Found</h2>
                </header>
                <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <p style={{ color: 'red' }}>{error}</p>
                    <Button style={{ marginTop: '1rem' }} onClick={() => navigate('/mechanics')}>Go Back</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="list-container" style={{ overflowY: 'auto' }}>
            <header className="list-header" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-bg-dark)', zIndex: 10, paddingBottom: '1rem' }}>
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Mechanic Profile</h2>
            </header>

            <div className="mech-profile-header">
                <div className="mech-avatar large">{(mech.name || '?').charAt(0)}</div>
                <h2>{mech.name}</h2>
                <p className="mech-specialty">{mech.specialty}</p>
                {mech.is_verified && (
                    <span className="verified-badge" style={{ marginTop: '0.5rem' }}>
                        <ShieldCheck size={14} /> Verified mechanic
                    </span>
                )}

                <div className="mech-rating-badge">
                    <Star size={18} fill="var(--color-brand)" color="var(--color-brand)" />
                    <span>{mech.rating || 0}</span>
                    <span className="review-count">({mech.reviews_count || 0} reviews)</span>
                </div>
            </div>

            <div className="quick-actions-grid" style={{ flexDirection: 'row', marginTop: '1rem' }}>
                {activePhone ? (
                    <Button className="flex-1" onClick={() => window.open(`tel:${activePhone}`)}>
                        <Phone size={18} style={{ marginRight: '8px' }} /> Call
                    </Button>
                ) : (
                    <Button className="flex-1" variant="secondary" disabled title="Phone shared after SOS accept">
                        <Phone size={18} style={{ marginRight: '8px' }} /> Call after booking
                    </Button>
                )}
                <Button className="flex-1" variant="secondary" onClick={handleMessage}>
                    <MessageSquare size={18} style={{ marginRight: '8px' }} /> Message
                </Button>
                <Button className="flex-1" variant="secondary" onClick={() => navigate(`/bookings?mechanic=${mech.user_id}`)}>
                    <Calendar size={18} style={{ marginRight: '8px' }} /> Book
                </Button>
            </div>

            <Card style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Location</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Map size={18} color="var(--color-brand)" /> {mech.address}, {mech.city}
                </p>
                {mech.lat && mech.lng && (
                    <div style={{ height: '180px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <MapComponent center={[mech.lat, mech.lng]} zoom={17} mapStyle="live" markers={[mech]} />
                    </div>
                )}
            </Card>

            {catalog.length > 0 && (
                <Card style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Services & pricing</h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {catalog.map((s) => (
                            <li key={s.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                                <strong>{s.service_name}</strong>
                                {s.price_ngn != null && <span style={{ float: 'right' }}>₦{s.price_ngn.toLocaleString()}</span>}
                                {s.description && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{s.description}</p>}
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {reviews.length > 0 && (
                <Card style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Reviews</h3>
                    {reviews.map((r) => (
                        <div key={r.id} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '0.25rem' }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={14} fill={s <= r.rating ? 'var(--color-brand)' : 'transparent'} color={s <= r.rating ? 'var(--color-brand)' : 'var(--color-text-muted)'} />
                                ))}
                                <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{r.driver_name}</span>
                            </div>
                            {r.comment && <p style={{ fontSize: '0.9rem' }}>{r.comment}</p>}
                        </div>
                    ))}
                </Card>
            )}

            {canReview && (
                <Card style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Leave a Review</h3>
                    {submitted ? (
                        <p style={{ color: 'var(--color-success)' }}>Thank you for your feedback!</p>
                    ) : (
                        <form onSubmit={handleSubmitReview}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={24}
                                        fill={star <= rating ? 'var(--color-brand)' : 'transparent'}
                                        color={star <= rating ? 'var(--color-brand)' : 'var(--color-text-muted)'}
                                        onClick={() => setRating(star)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </div>
                            <Input
                                placeholder="Tell us about the service you received"
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                style={{ height: '80px', paddingTop: '10px' }}
                            />
                            <Button type="submit" disabled={rating === 0}>Submit Review</Button>
                        </form>
                    )}
                </Card>
            )}

            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <button type="button" onClick={handleReport} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Flag size={14} /> Report this mechanic
                </button>
            </div>
        </div>
    );
}
