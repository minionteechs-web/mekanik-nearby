import { useState } from 'react';
import { ChevronDown, ChevronUp, Navigation2, Flag } from 'lucide-react';
import './RouteDirections.css';

export function RouteDirections({ steps = [], collapsedDefault = false }) {
    const [expanded, setExpanded] = useState(!collapsedDefault);

    if (!steps?.length) return null;

    const mainSteps = steps.filter((s) => s.distanceM > 0 || s.instruction.includes('Arrive'));

    return (
        <div className="route-directions">
            <button
                type="button"
                className="route-directions-header"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="route-directions-title">
                    <Navigation2 size={18} />
                    <span>Turn-by-turn directions</span>
                    <span className="route-directions-count">{mainSteps.length} steps</span>
                </div>
                {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expanded && (
                <ol className="route-directions-list">
                    {mainSteps.map((step, index) => (
                        <li key={step.id} className="route-direction-step">
                            <div className="step-marker">
                                {step.instruction.includes('Arrive') ? (
                                    <Flag size={14} />
                                ) : (
                                    <span>{index + 1}</span>
                                )}
                            </div>
                            <div className="step-body">
                                <p className="step-instruction">{step.instruction}</p>
                                <div className="step-meta">
                                    {step.distanceLabel !== '—' && <span>{step.distanceLabel}</span>}
                                    {step.durationMin > 0 && <span>~{step.durationMin} min</span>}
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            )}
        </div>
    );
}
