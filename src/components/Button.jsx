export function Button({ children, variant = 'primary', className = '', ...props }) {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    return (
        <button className={`${baseClass} ${variantClass} ${className}`} {...props}>
            {children}
        </button>
    );
}
