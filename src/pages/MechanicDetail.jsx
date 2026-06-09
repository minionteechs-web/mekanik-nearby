import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Star, Phone, MessageSquare, Map, Loader2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { MapComponent } from '../components/MapComponent';
import { mechanics as mechanicsApi, reviews as reviewsApi, requests as requestsApi } from '../utils/api';
import './MechanicList.css';

export function MechanicDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mech, setMech] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Rating State
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
        if (rating > 0 && mech?.user_id) {
            try {
                await reviewsApi.create({
                    mechanic_id: mech.user_id,
                    rating,
                    comment: reviewText,
                });
                setSubmitted(true);
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to submit review');
            }
        }
    };

    if (loading) {
        return (
            <div className="list-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Loader2 className="animate-spin" size={48} color="var(--color-brand)" />
            </div>
        );
    }

    if (error || !mech) {
        return (
            <div className="list-container">
                <header className="list-header">
                    <button className="icon-btn-back" onClick={() => navigate('/mechanics')}>
                        <ChevronLeft size={24} />
                    </button>
                    <h2>Profile Not Found</h2>
                </header>
                <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                    <p style={{ color: 'red' }}>{error || 'The mechanic you are looking for does not exist.'}</p>
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
                <div className="mech-avatar large">
                    {(mech.name || '?').charAt(0)}
                </div>
                <h2>{mech.name}</h2>
                <p className="mech-specialty">{mech.specialty}</p>

                <div className="mech-rating-badge">
                    <Star size={18} fill="var(--color-brand)" color="var(--color-brand)" />
                    <span>{mech.rating || 0}</span>
                    <span className="review-count">({mech.reviews_count || 0} reviews)</span>
                </div>
            </div>

            <div className="quick-actions-grid" style={{ flexDirection: 'row', marginTop: '1rem' }}>
                <Button className="flex-1" onClick={() => window.open(`tel:${mech.phone || ''}`)}>
                    <Phone size={18} style={{ marginRight: '8px' }} /> Call
                </Button>
                <Button className="flex-1" variant="secondary" style={{ backgroundColor: '#2A2A2A' }} onClick={handleMessage}>
                    <MessageSquare size={18} style={{ marginRight: '8px' }} /> Message
                </Button>
            </div>

            <Card style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Location</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Map size={18} color="var(--color-brand)" /> {mech.address}, {mech.city}
                </p>
                {mech.lat && mech.lng && (
                    <div style={{ height: '180px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <MapComponent
                            center={[mech.lat, mech.lng]}
                            zoom={15}
                            markers={[mech]}
                        />
                    </div>
                )}
            </Card>

            <Card style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Leave a Review</h3>
                {submitted ? (
                    <p style={{ color: 'var(--color-success)' }}>Thank you for your feedback! It helps our community stay safe and informed.</p>
                ) : (
                    <form onSubmit={handleSubmitReview}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={24}
                                    fill={star <= rating ? "var(--color-brand)" : "transparent"}
                                    color={star <= rating ? "var(--color-brand)" : "var(--color-text-muted)"}
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
        </div>
    );
}
