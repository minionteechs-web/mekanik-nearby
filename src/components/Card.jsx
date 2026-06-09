import './Card.css';

export function Card({ children, className = '', onClick }) {
    return (
        <div
            className={`card ${className} ${onClick ? 'card-clickable' : ''}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
