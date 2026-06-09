const toPublicUrl = (req, path) => {
    if (!path || path.startsWith('http')) return path;
    const base = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const mapMessageUrls = (req, message) => {
    if (!message || message.message_type === 'text') return message;
    return { ...message, content: toPublicUrl(req, message.content) };
};

module.exports = { toPublicUrl, mapMessageUrls };
