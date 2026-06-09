import { getProfileInitials, getProfileColor } from '../utils/profileAvatar';
import { getMediaUrl } from '../utils/api';
import './ProfileAvatar.css';

export function ProfileAvatar({
    name,
    avatarUrl,
    size = 40,
    onClick,
    active = false,
    className = '',
    title,
}) {
    const initials = getProfileInitials(name);
    const color = getProfileColor(name);
    const imageSrc = avatarUrl ? getMediaUrl(avatarUrl) : null;
    const Tag = onClick ? 'button' : 'div';

    return (
        <Tag
            type={onClick ? 'button' : undefined}
            className={`profile-avatar-circle ${active ? 'active' : ''} ${imageSrc ? 'has-photo' : ''} ${className}`.trim()}
            style={{
                width: size,
                height: size,
                backgroundColor: imageSrc ? 'transparent' : color,
                fontSize: Math.max(10, Math.round(size * 0.36)),
            }}
            onClick={onClick}
            title={title || name}
            aria-label={title || `Profile: ${name}`}
        >
            {imageSrc ? (
                <img src={imageSrc} alt="" className="profile-avatar-img" draggable={false} />
            ) : (
                initials
            )}
        </Tag>
    );
}
