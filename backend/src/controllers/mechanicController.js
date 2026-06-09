const db = require('../config/db');
const {
    canUsePostGISLocation,
    haversineNearbyQuery,
    postgisNearbyQuery,
} = require('../utils/geoQuery');

// @desc    Get mechanics near a location
// @route   GET /api/mechanics/nearby
// @access  Public
exports.getNearbyMechanics = async (req, res) => {
    const { lat, lng, radius = 50000 } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ message: 'Please provide valid latitude and longitude' });
    }

    try {
        const usePostGIS = await canUsePostGISLocation();
        const query = usePostGIS ? postgisNearbyQuery : haversineNearbyQuery;
        const params = usePostGIS ? [lng, lat, radius] : [lat, lng, radius];

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('getNearbyMechanics error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Register mechanic details (Self-onboarding)
// @route   POST /api/mechanics/onboard
// @access  Private (Mechanic only)
exports.onboardMechanic = async (req, res) => {
    const { name, specialty, address, city, state, lat, lng } = req.body;
    const userId = req.user.id;
    const usePostGIS = await canUsePostGISLocation();

    if (!name || lat == null || lng == null) {
        return res.status(400).json({ message: 'Name, latitude, and longitude are required' });
    }

    try {
        let query;
        let params;

        if (usePostGIS) {
            query = `
                INSERT INTO mechanics (user_id, name, specialty, address, city, state, lat, lng, location)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_Point($9, $10), 4326)::geography)
                ON CONFLICT (user_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    specialty = EXCLUDED.specialty,
                    address = EXCLUDED.address,
                    city = EXCLUDED.city,
                    state = EXCLUDED.state,
                    lat = EXCLUDED.lat,
                    lng = EXCLUDED.lng,
                    location = EXCLUDED.location,
                    last_updated = CURRENT_TIMESTAMP
                RETURNING *
            `;
            params = [userId, name, specialty, address, city, state, lat, lng, lng, lat];
        } else {
            query = `
                INSERT INTO mechanics (user_id, name, specialty, address, city, state, lat, lng)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (user_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    specialty = EXCLUDED.specialty,
                    address = EXCLUDED.address,
                    city = EXCLUDED.city,
                    state = EXCLUDED.state,
                    lat = EXCLUDED.lat,
                    lng = EXCLUDED.lng,
                    last_updated = CURRENT_TIMESTAMP
                RETURNING *
            `;
            params = [userId, name, specialty, address, city, state, lat, lng];
        }

        const result = await db.query(query, params);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get mechanic by ID
// @route   GET /api/mechanics/:id
// @access  Public
exports.getMechanicById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('SELECT * FROM mechanics WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Mechanic not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get logged-in mechanic's profile
// @route   GET /api/mechanics/me/profile
// @access  Private (Mechanic)
exports.getMyProfile = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM mechanics WHERE user_id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Mechanic profile not found. Please complete onboarding.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Toggle mechanic availability
// @route   PUT /api/mechanics/me/availability
// @access  Private (Mechanic)
exports.updateAvailability = async (req, res) => {
    const { is_available } = req.body;

    if (typeof is_available !== 'boolean') {
        return res.status(400).json({ message: 'is_available must be a boolean' });
    }

    try {
        const result = await db.query(
            'UPDATE mechanics SET is_available = $1, last_updated = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            [is_available, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Mechanic profile not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
