import './Skeleton.css';

export function Skeleton({ width, height, className = '' }) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height }}
        />
    );
}

export function MechanicCardSkeleton() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-row">
                <Skeleton width={50} height={50} className="skeleton-circle" />
                <div className="skeleton-col">
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={12} />
                </div>
            </div>
            <Skeleton width="100%" height={1} className="skeleton-divider" />
            <div className="skeleton-row skeleton-between">
                <Skeleton width={80} height={12} />
                <Skeleton width={60} height={12} />
            </div>
        </div>
    );
}
