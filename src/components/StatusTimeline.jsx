import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import './StatusTimeline.css';

const STEPS = [
    { key: 'pending', label: 'Request sent' },
    { key: 'accepted', label: 'Mechanic accepted' },
    { key: 'en-route', label: 'En route to you' },
    { key: 'arrived', label: 'Mechanic arrived' },
];

const statusOrder = ['pending', 'accepted', 'en-route', 'arrived', 'completed'];

export function StatusTimeline({ currentStatus }) {
    const currentIndex = statusOrder.indexOf(currentStatus);

    return (
        <div className="status-timeline">
            {STEPS.map((step, index) => {
                const isDone = currentIndex > index || currentStatus === 'completed';
                const isActive = currentIndex === index && currentStatus !== 'completed';
                const isWaiting = currentIndex < index;

                return (
                    <div key={step.key} className={`timeline-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isWaiting ? 'waiting' : ''}`}>
                        <div className="timeline-dot">
                            {isDone ? (
                                <CheckCircle size={18} />
                            ) : isActive ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Circle size={18} />
                            )}
                        </div>
                        <span>{step.label}</span>
                    </div>
                );
            })}
        </div>
    );
}
