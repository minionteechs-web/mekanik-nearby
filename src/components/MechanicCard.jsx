import { Star, MapPin, ShieldCheck } from 'lucide-react';
import { Card } from './Card';
import { formatDistance } from '../utils/format';
import './MechanicCard.css';

export function MechanicCard({ mechanic, onClick }) {
    return (
        <Card className="mechanic-card-v2" onClick={onClick}>
            <div className="mech-card-header">
                <div className="mech-avatar">
                    {(mechanic.name || '?').charAt(0)}
                </div>
                <div className="mech-info">
                    <div className="mech-name-row">
                        <h3>{mechanic.name}</h3>
                        {mechanic.is_available && (
                            <span className="verified-badge online-badge">
                                Online
                            </span>
                        )}
                        {mechanic.is_verified && (
                            <span className="verified-badge">
                                <ShieldCheck size={12} /> Verified
                            </span>
                        )}
                    </div>
                    <p className="mech-specialty">{mechanic.specialty}</p>
                </div>
                <div className={`mech-status ${mechanic.is_available ? 'online' : 'offline'}`} />
            </div>

            <div className="mech-card-footer">
                <div className="mech-stat">
                    <Star size={14} fill="var(--color-brand)" color="var(--color-brand)" />
                    <span>{mechanic.rating || 'New'} {mechanic.reviews_count ? `(${mechanic.reviews_count})` : ''}</span>
                </div>
                <div className="mech-stat">
                    <MapPin size={14} />
                    <span>{formatDistance(mechanic.distance_meters)}</span>
                </div>
            </div>
        </Card>
    );
}
