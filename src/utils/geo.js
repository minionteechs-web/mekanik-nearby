// Haversine formula to calculate distance between two lat/lng coordinates
export function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

export function getNearestMechanic(userLat, userLng, mechanics) {
    if (!mechanics || mechanics.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    mechanics.forEach(mech => {
        if (!mech.is_available) return;
        const distance = haversine(userLat, userLng, mech.lat, mech.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = { ...mech, distance_km: distance.toFixed(1) };
        }
    });

    return nearest;
}

export function getMechanicsWithDistance(userLat, userLng, mechanics) {
    return mechanics.map(mech => {
        const distance = haversine(userLat, userLng, mech.lat, mech.lng);
        return { ...mech, distance_km: distance.toFixed(1) };
    }).sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km));
}
