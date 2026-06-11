import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, Loader2, Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { bookings as bookingsApi, mechanics as mechanicsApi } from '../utils/api';
import { useToast } from '../components/Toast';
import './Bookings.css';

const STATUS_LABELS = {
    pending: 'Awaiting confirmation',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    completed: 'Completed',
};

export function Bookings() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const user = JSON.parse(localStorage.getItem('mekanik_user') || '{}');
    const isMechanic = user.role === 'mechanic';
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [mechanics, setMechanics] = useState([]);
    const [form, setForm] = useState({
        mechanic_id: '',
        scheduled_at: '',
        service_type: 'General inspection',
        notes: '',
        address: '',
    });

    const load = async () => {
        try {
            const res = await bookingsApi.getAll();
            setBookings(res.data);
        } catch {
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        if (!isMechanic && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const res = await mechanicsApi.getNearby(pos.coords.latitude, pos.coords.longitude, 50);
                    setMechanics(res.data.slice(0, 20));
                } catch { /* ignore */ }
            });
        }
    }, [isMechanic]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await bookingsApi.create({
                ...form,
                mechanic_id: parseInt(form.mechanic_id, 10),
            });
            showToast('Booking request sent', 'success');
            setShowForm(false);
            load();
        } catch (err) {
            showToast(err.response?.data?.message || 'Could not create booking', 'error');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await bookingsApi.updateStatus(id, status);
            showToast(`Booking ${status}`, 'success');
            load();
        } catch (err) {
            showToast(err.response?.data?.message || 'Update failed', 'error');
        }
    };

    return (
        <div className="list-container bookings-page">
            <header className="list-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Bookings</h2>
                {!isMechanic && (
                    <button className="bookings-add-btn" onClick={() => setShowForm(!showForm)}>
                        <Plus size={20} />
                    </button>
                )}
            </header>

            {!isMechanic && showForm && (
                <Card className="booking-form-card">
                    <h3>Schedule a visit</h3>
                    <form onSubmit={handleCreate}>
                        <label className="booking-field">
                            <span>Mechanic</span>
                            <select
                                value={form.mechanic_id}
                                onChange={(e) => setForm({ ...form, mechanic_id: e.target.value })}
                                required
                            >
                                <option value="">Select mechanic</option>
                                {mechanics.map((m) => (
                                    <option key={m.user_id} value={m.user_id}>{m.name}</option>
                                ))}
                            </select>
                        </label>
                        <Input
                            label="Date & time"
                            type="datetime-local"
                            value={form.scheduled_at}
                            onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                            required
                        />
                        <Input
                            label="Service type"
                            value={form.service_type}
                            onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                            required
                        />
                        <Input
                            label="Address / location"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                        />
                        <Input
                            label="Notes"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                        <Button type="submit">Request booking</Button>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="bookings-loading"><Loader2 className="animate-spin" size={32} /></div>
            ) : bookings.length === 0 ? (
                <Card className="bookings-empty">
                    <Calendar size={40} color="var(--color-text-muted)" />
                    <p>No bookings yet</p>
                    <span>Schedule a non-emergency workshop visit with a mechanic.</span>
                </Card>
            ) : (
                <ul className="bookings-list">
                    {bookings.map((b) => (
                        <li key={b.id}>
                            <Card className="booking-card">
                                <div className="booking-card-header">
                                    <strong>{b.service_type}</strong>
                                    <span className={`booking-status status-${b.status}`}>
                                        {STATUS_LABELS[b.status] || b.status}
                                    </span>
                                </div>
                                <p>{new Date(b.scheduled_at).toLocaleString()}</p>
                                {b.mechanic_name && <p>Mechanic: {b.mechanic_name}</p>}
                                {b.driver_name && <p>Driver: {b.driver_name}</p>}
                                {b.address && <p className="booking-address">{b.address}</p>}
                                {b.notes && <p className="booking-notes">{b.notes}</p>}
                                <div className="booking-actions">
                                    {isMechanic && b.status === 'pending' && (
                                        <>
                                            <Button size="sm" onClick={() => updateStatus(b.id, 'confirmed')}>Confirm</Button>
                                            <Button size="sm" variant="secondary" onClick={() => updateStatus(b.id, 'cancelled')}>Decline</Button>
                                        </>
                                    )}
                                    {isMechanic && b.status === 'confirmed' && (
                                        <Button size="sm" onClick={() => updateStatus(b.id, 'completed')}>Mark complete</Button>
                                    )}
                                    {!isMechanic && ['pending', 'confirmed'].includes(b.status) && (
                                        <Button size="sm" variant="secondary" onClick={() => updateStatus(b.id, 'cancelled')}>Cancel</Button>
                                    )}
                                </div>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
