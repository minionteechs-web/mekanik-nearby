import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, Map as MapIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { useToast } from '../components/Toast';
import { downloadRouteMechanics } from '../utils/routePlanner';
import './MechanicList.css';

export function RoutePlanner() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [start, setStart] = useState('Lagos');
    const [end, setEnd] = useState('');
    const [downloading, setDownloading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

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
            showToast(`Saved ${payload.count} mechanics for offline use`, 'success');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Download failed. Check your connection and try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="list-container">
            <header className="list-header">
                <button className="icon-btn-back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h2>Route Planner</h2>
            </header>

            <Card style={{ marginBottom: '1.5rem' }}>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Enter your route to download mechanic contacts along the way. Works offline after download — use major city names (Lagos, Ibadan, Abuja).
                </p>
                <Input
                    label="Starting Point"
                    placeholder="e.g. Lagos"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                />
                <Input
                    label="Destination"
                    placeholder="e.g. Ibadan"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                />

                {error && (
                    <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{error}</p>
                )}

                <Button
                    className="w-100"
                    style={{ width: '100%', marginTop: '1rem' }}
                    onClick={handleDownload}
                    disabled={downloading || !end.trim()}
                >
                    {downloading ? 'Downloading mechanics...' : (
                        <><Download size={18} style={{ marginRight: '8px' }} /> Download Route Data</>
                    )}
                </Button>
            </Card>

            {result && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                    <MapIcon size={48} color="var(--color-success)" style={{ marginBottom: '1rem', opacity: 0.8 }} />
                    <h3>Route Saved</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        {result.count} mechanics cached for {result.route.start.label || start} → {result.route.end.label || end}.
                        View them in Find Mechanics even without signal.
                    </p>
                    <Button style={{ marginTop: '1rem' }} variant="secondary" onClick={() => navigate('/mechanics')}>
                        Browse cached mechanics
                    </Button>
                </div>
            )}
        </div>
    );
}
