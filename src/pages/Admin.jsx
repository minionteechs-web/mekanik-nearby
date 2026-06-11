import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Users, Wrench, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { admin as adminApi } from '../utils/api';
import { useToast } from '../components/Toast';
import './Admin.css';

export function Admin() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const user = JSON.parse(localStorage.getItem('mekanik_user') || '{}');
    const [stats, setStats] = useState(null);
    const [pending, setPending] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user.role !== 'admin') {
            navigate('/home');
            return;
        }
        Promise.all([
            adminApi.getStats(),
            adminApi.getPendingMechanics(),
            adminApi.getReports(),
        ]).then(([s, p, r]) => {
            setStats(s.data);
            setPending(p.data);
            setReports(r.data.filter((x) => x.status === 'open'));
        }).catch(() => showToast('Admin access required', 'error'))
            .finally(() => setLoading(false));
    }, [user.role, navigate, showToast]);

    const verify = async (id, status) => {
        try {
            await adminApi.verifyMechanic(id, { status });
            setPending((prev) => prev.filter((m) => m.id !== id));
            showToast(`Mechanic ${status}`, 'success');
        } catch {
            showToast('Action failed', 'error');
        }
    };

    const resolveReport = async (id, status) => {
        try {
            await adminApi.resolveReport(id, status);
            setReports((prev) => prev.filter((r) => r.id !== id));
        } catch {
            showToast('Could not resolve report', 'error');
        }
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <Loader2 className="animate-spin" size={40} />
            </div>
        );
    }

    return (
        <div className="list-container admin-page">
            <header className="list-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Admin</h2>
            </header>

            {stats && (
                <div className="admin-stats-grid">
                    <Card><Users size={20} /><strong>{stats.users}</strong><span>Users</span></Card>
                    <Card><Wrench size={20} /><strong>{stats.mechanics}</strong><span>Mechanics</span></Card>
                    <Card><Shield size={20} /><strong>{stats.active_requests}</strong><span>Active SOS</span></Card>
                    <Card><AlertTriangle size={20} /><strong>{stats.open_reports}</strong><span>Reports</span></Card>
                </div>
            )}

            <h3 className="admin-section-title">Pending verification ({pending.length})</h3>
            {pending.length === 0 ? (
                <Card className="admin-empty">No mechanics awaiting verification.</Card>
            ) : (
                pending.map((m) => (
                    <Card key={m.id} className="admin-verify-card">
                        <strong>{m.name}</strong>
                        <p>{m.email} · {m.specialty}</p>
                        {m.certification && <p>Cert: {m.certification}</p>}
                        <div className="admin-actions">
                            <Button size="sm" onClick={() => verify(m.id, 'verified')}>Verify</Button>
                            <Button size="sm" variant="secondary" onClick={() => verify(m.id, 'rejected')}>Reject</Button>
                        </div>
                    </Card>
                ))
            )}

            <h3 className="admin-section-title">Open reports ({reports.length})</h3>
            {reports.length === 0 ? (
                <Card className="admin-empty">No open reports.</Card>
            ) : (
                reports.map((r) => (
                    <Card key={r.id} className="admin-report-card">
                        <strong>{r.reason}</strong>
                        <p>{r.reporter_name} reported {r.reported_name}</p>
                        {r.details && <p className="admin-muted">{r.details}</p>}
                        <div className="admin-actions">
                            <Button size="sm" onClick={() => resolveReport(r.id, 'resolved')}>Resolve</Button>
                            <Button size="sm" variant="secondary" onClick={() => resolveReport(r.id, 'dismissed')}>Dismiss</Button>
                        </div>
                    </Card>
                ))
            )}
        </div>
    );
}
