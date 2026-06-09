import { Mountain, Coffee, MapPin, ExternalLink } from 'lucide-react';
import { openRestStopInGoogleMaps } from '../utils/maps';
import './RouteInsights.css';

const ElevationChart = ({ points, minM, maxM }) => {
    if (!points?.length) {
        return <p className="insights-empty">Elevation data unavailable for this route.</p>;
    }

    const range = Math.max(maxM - minM, 1);

    return (
        <div className="elevation-chart">
            <div className="elevation-bars">
                {points.map((p, i) => {
                    const height = ((p.elevationM - minM) / range) * 100;
                    return (
                        <div key={i} className="elevation-bar-wrap" title={`${p.elevationM} m`}>
                            <div className="elevation-bar" style={{ height: `${Math.max(height, 8)}%` }} />
                            <span className="elevation-bar-label">{p.elevationM}m</span>
                        </div>
                    );
                })}
            </div>
            <div className="elevation-legend">
                <span>Low {minM} m</span>
                <span>High {maxM} m</span>
            </div>
        </div>
    );
};

export function RouteInsights({ elevation, restStops = [], gainM }) {
    const gain = gainM ?? elevation?.gainM ?? 0;

    return (
        <div className="route-insights">
            <section className="insight-section">
                <h4 className="insight-heading">
                    <Mountain size={18} />
                    Elevation profile
                    {gain > 0 && <span className="insight-badge">+{gain} m climb</span>}
                </h4>
                <ElevationChart
                    points={elevation?.points}
                    minM={elevation?.minM}
                    maxM={elevation?.maxM}
                />
            </section>

            {restStops.length > 0 && (
                <section className="insight-section">
                    <h4 className="insight-heading">
                        <Coffee size={18} />
                        Suggested rest stops
                    </h4>
                    <div className="rest-stop-list">
                        {restStops.map((stop) => (
                            <div key={stop.id} className="rest-stop-card">
                                <div className="rest-stop-main">
                                    <MapPin size={16} className="rest-stop-icon" />
                                    <div>
                                        <p className="rest-stop-label">{stop.label}</p>
                                        <p className="rest-stop-meta">
                                            ~{stop.kmFromStart} km
                                            {stop.driveMinSoFar != null && ` · ~${stop.driveMinSoFar} min drive`}
                                        </p>
                                        <p className="rest-stop-tip">{stop.tip}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="rest-stop-map-btn"
                                    onClick={() => openRestStopInGoogleMaps(stop)}
                                    aria-label={`Open ${stop.label} in Google Maps`}
                                >
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
