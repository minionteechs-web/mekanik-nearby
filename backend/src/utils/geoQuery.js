const db = require('../config/db');

let geoModeCache = null;

/**
 * Use PostGIS only when extension AND populated location column exist.
 * Neon/bootstrap DBs typically have lat/lng only — Haversine fallback avoids 500s.
 */
const canUsePostGISLocation = async () => {
    if (geoModeCache !== null) return geoModeCache;
    try {
        await db.query('SELECT postgis_version()');
        const col = await db.query(
            `SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'mechanics' AND column_name = 'location'`
        );
        if (col.rows.length === 0) {
            geoModeCache = false;
            return false;
        }
        const populated = await db.query(
            'SELECT 1 FROM mechanics WHERE location IS NOT NULL LIMIT 1'
        );
        geoModeCache = populated.rows.length > 0;
    } catch {
        geoModeCache = false;
    }
    return geoModeCache;
};

const haversineNearbyQuery = `
    SELECT id, user_id, name, specialty, rating, reviews_count, is_available, address, city, lat, lng, distance_meters
    FROM (
        SELECT id, user_id, name, specialty, rating, reviews_count, is_available, address, city, lat, lng,
               (6371000 * acos(
                   LEAST(1, GREATEST(-1,
                       cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) +
                       sin(radians($1)) * sin(radians(lat))
                   ))
               )) AS distance_meters
        FROM mechanics
        WHERE lat IS NOT NULL AND lng IS NOT NULL AND is_available = TRUE
    ) nearby
    WHERE distance_meters < $3
    ORDER BY distance_meters ASC
`;

const postgisNearbyQuery = `
    SELECT id, user_id, name, specialty, rating, reviews_count, is_available, address, city,
           ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat,
           ST_Distance(location, ST_SetSRID(ST_Point($1, $2), 4326)::geography) as distance_meters
    FROM mechanics
    WHERE is_available = TRUE
      AND location IS NOT NULL
      AND ST_DWithin(location, ST_SetSRID(ST_Point($1, $2), 4326)::geography, $3)
    ORDER BY distance_meters ASC
`;

module.exports = {
    canUsePostGISLocation,
    haversineNearbyQuery,
    postgisNearbyQuery,
};
