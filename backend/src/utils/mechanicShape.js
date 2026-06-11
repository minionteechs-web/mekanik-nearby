/** Public mechanic profile — never includes phone (privacy). */
const shapeMechanicPublic = (row) => ({
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    specialty: row.specialty,
    rating: row.rating,
    reviews_count: row.reviews_count,
    is_available: row.is_available,
    address: row.address,
    city: row.city,
    state: row.state,
    lat: row.lat,
    lng: row.lng,
    distance_meters: row.distance_meters,
    verification_status: row.verification_status || 'pending',
    is_verified: row.verification_status === 'verified',
    years_experience: row.years_experience,
    certification: row.certification,
});

module.exports = { shapeMechanicPublic };
