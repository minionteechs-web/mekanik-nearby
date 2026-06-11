import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { notifications as notificationsApi, initSocket } from '../utils/api';
import './Notifications.css';

export function Notifications() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await notificationsApi.getAll();
            setItems(res.data);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const socket = initSocket();
        if (!socket) return;
        const onNew = () => load();
        socket.on('notification', onNew);
        return () => socket.off('notification', onNew);
    }, []);

    const markAll = async () => {
        await notificationsApi.markAllRead();
        setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    };

    const markOne = async (id) => {
        await notificationsApi.markRead(id);
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    };

    return (
        <div className="list-container notifications-page">
            <header className="list-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Notifications</h2>
                {items.some((n) => !n.is_read) && (
                    <button className="notif-mark-all" onClick={markAll}>
                        <CheckCheck size={18} /> Mark all read
                    </button>
                )}
            </header>

            {loading ? (
                <div className="notif-loading">
                    <Loader2 className="animate-spin" size={32} />
                </div>
            ) : items.length === 0 ? (
                <Card className="notif-empty">
                    <Bell size={40} color="var(--color-text-muted)" />
                    <p>No notifications yet</p>
                    <span>SOS updates and booking alerts will appear here.</span>
                </Card>
            ) : (
                <ul className="notif-list">
                    {items.map((n) => (
                        <li key={n.id}>
                            <button
                                type="button"
                                className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
                                onClick={() => markOne(n.id)}
                            >
                                <strong>{n.title}</strong>
                                {n.body && <p>{n.body}</p>}
                                <time>{new Date(n.created_at).toLocaleString()}</time>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
