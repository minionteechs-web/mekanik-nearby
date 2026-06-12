const AVATAR_COLORS = [
    '#FF6B35',
    '#3B82F6',
    '#10B981',
    '#8B5CF6',
    '#F59E0B',
    '#EC4899',
    '#06B6D4',
    '#84CC16',
];

export function getProfileInitials(name) {
    const parts = String(name || 'U')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || 'U').toUpperCase();
}

export function getProfileColor(name) {
    const str = String(name || 'user');
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Extract cache version from avatar-USERID-TIMESTAMP.ext paths */
export function getAvatarCacheKey(path) {
    if (!path) return '';
    const match = String(path).match(/avatar-\d+-(\d+)\./);
    return match ? match[1] : String(path).split('/').pop() || path;
}

export function getAvatarMediaUrl(path, getMediaUrl) {
    if (!path) return '';
    const base = getMediaUrl(path);
    const key = getAvatarCacheKey(path);
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}v=${encodeURIComponent(key)}`;
}

/** Keep the newest avatar when merging local session with a server payload */
export function mergeUserPreservingAvatar(local, remote) {
    if (!remote) return local;
    const merged = { ...local, ...remote };
    const localKey = getAvatarCacheKey(local?.avatar_url);
    const remoteKey = getAvatarCacheKey(remote?.avatar_url);
    if (localKey && (!remoteKey || localKey > remoteKey)) {
        merged.avatar_url = local.avatar_url;
    }
    return merged;
}
