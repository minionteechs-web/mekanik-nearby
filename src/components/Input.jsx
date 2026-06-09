import './Input.css';

export function Input({ label, type = 'text', id, className = '', ...props }) {
    return (
        <div className={`input-group ${className}`}>
            {label && <label htmlFor={id} className="input-label">{label}</label>}
            <input
                type={type}
                id={id}
                className="input-field"
                {...props}
            />
        </div>
    );
}
