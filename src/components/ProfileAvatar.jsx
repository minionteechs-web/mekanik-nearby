import { getProfileInitials, getProfileColor } from '../utils/profileAvatar';
import './ProfileAvatar.css';

export function ProfileAvatar({
    name,
    size = 40,
    onClick,
    active = false,
    className = '',
    title,
}) {
    const initials = getProfileInitials(name);
    const color = getProfileColor(name);
    const Tag = onClick ? 'button' : 'div';

    return (
        <Tag
            type={onClick ? 'button' : undefined}
            className={`profile-avatar-circle ${active ? 'active' : ''} ${className}`.trim()}
            style={{
                width: size,
                height: size,
                backgroundColor: color,
                fontSize: Math.max(10, Math.round(size * 0.36)),
            }}
            onClick={onClick}
            title={title || name}
            aria-label={title || `Profile: ${name}`}
        >
            {initials}
        </Tag>
    );
}
