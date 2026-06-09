import './BrandLogo.css';

export function BrandLogo({ size = 72, showWordmark = true, className = '' }) {
    return (
        <div className={`brand-logo ${className}`.trim()} style={{ '--logo-size': `${size}px` }}>
            <img src="/logo.png" alt="Mekanik Nearby" className="brand-logo-mark" draggable={false} />
            {showWordmark && (
                <div className="brand-logo-text">
                    <span className="brand-logo-title">Mekanik</span>
                    <span className="brand-logo-sub">Nearby</span>
                </div>
            )}
        </div>
    );
}
