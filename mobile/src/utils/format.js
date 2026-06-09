export const formatDistance = (meters) => {
    if (meters == null) return 'Nearby';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
};

export const getGreeting = (name = 'Driver') => {
    const hour = new Date().getHours();
    let period = 'Good evening';
    if (hour < 12) period = 'Good morning';
    else if (hour < 17) period = 'Good afternoon';
    return `${period}, ${name}`;
};

export const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const getStatusLabel = (status) => {
    const labels = {
        pending: 'Waiting for mechanic',
        accepted: 'Mechanic accepted',
        'en-route': 'Mechanic en route',
        arrived: 'Mechanic arrived',
        completed: 'Job completed',
        cancelled: 'Cancelled',
    };
    return labels[status] || status;
};
