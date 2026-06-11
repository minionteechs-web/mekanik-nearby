const db = require('../config/db');
const { shapeMechanicPublic } = require('../utils/mechanicShape');
const { sanitizeText } = require('../utils/sanitize');
const {
    canUsePostGISLocation,
    haversineNearbyQuery,
    postgisNearbyQuery,
} = require('../utils/geoQuery');

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
        res.json(result.rows.map(shapeMechanicPublic));
    } catch (err) {
        console.error('getNearbyMechanics error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.onboardMechanic = async (req, res) => {
    const { name, specialty, address, city, state, lat, lng, years_experience, certification } = req.body;
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
                INSERT INTO mechanics (user_id, name, specialty, address, city, state, lat, lng, location, years_experience, certification)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_Point($9, $10), 4326)::geography, $11, $12)
                ON CONFLICT (user_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    specialty = EXCLUDED.specialty,
                    address = EXCLUDED.address,
                    city = EXCLUDED.city,
                    state = EXCLUDED.state,
                    lat = EXCLUDED.lat,
                    lng = EXCLUDED.lng,
                    location = EXCLUDED.location,
                    years_experience = EXCLUDED.years_experience,
                    certification = EXCLUDED.certification,
                    last_updated = CURRENT_TIMESTAMP
                RETURNING *
            `;
            params = [
                userId, name, specialty, address, city, state, lat, lng, lng, lat,
                years_experience ?? null,
                sanitizeText(certification, 300) || null,
            ];
        } else {
            query = `
                INSERT INTO mechanics (user_id, name, specialty, address, city, state, lat, lng, years_experience, certification)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (user_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    specialty = EXCLUDED.specialty,
                    address = EXCLUDED.address,
                    city = EXCLUDED.city,
                    state = EXCLUDED.state,
                    lat = EXCLUDED.lat,
                    lng = EXCLUDED.lng,
                    years_experience = EXCLUDED.years_experience,
                    certification = EXCLUDED.certification,
                    last_updated = CURRENT_TIMESTAMP
                RETURNING *
            `;
            params = [
                userId, name, specialty, address, city, state, lat, lng,
                years_experience ?? null,
                sanitizeText(certification, 300) || null,
            ];
        }

        const result = await db.query(query, params);
        res.status(201).json(shapeMechanicPublic(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getMechanicById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('SELECT * FROM mechanics WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Mechanic not found' });
        }
        res.json(shapeMechanicPublic(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

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

        res.json(shapeMechanicPublic(result.rows[0]));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Submit KYC documents for verification
// @route   POST /api/mechanics/me/verification
exports.submitVerification = async (req, res) => {
    const { id_document_url, workshop_photo_url, certification, years_experience } = req.body;

    try {
        const result = await db.query(
            `UPDATE mechanics SET
                id_document_url = COALESCE($1, id_document_url),
                workshop_photo_url = COALESCE($2, workshop_photo_url),
                certification = COALESCE($3, certification),
                years_experience = COALESCE($4, years_experience),
                verification_status = 'pending',
                last_updated = CURRENT_TIMESTAMP
             WHERE user_id = $5 RETURNING *`,
            [
                id_document_url || null,
                workshop_photo_url || null,
                sanitizeText(certification, 300) || null,
                years_experience ?? null,
                req.user.id,
            ]
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

// @desc    Service catalog for mechanic
exports.getServiceCatalog = async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM service_catalog WHERE mechanic_user_id = $1 AND is_active = TRUE ORDER BY service_name',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateServiceCatalog = async (req, res) => {
    const { services } = req.body;
    if (!Array.isArray(services)) {
        return res.status(400).json({ message: 'services array is required' });
    }

    try {
        await db.query('DELETE FROM service_catalog WHERE mechanic_user_id = $1', [req.user.id]);

        for (const svc of services.slice(0, 20)) {
            if (!svc.service_name) continue;
            await db.query(
                `INSERT INTO service_catalog (mechanic_user_id, service_name, description, price_ngn, is_active)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    req.user.id,
                    sanitizeText(svc.service_name, 100),
                    sanitizeText(svc.description, 300) || null,
                    svc.price_ngn ?? null,
                    svc.is_active !== false,
                ]
            );
        }

        const result = await db.query(
            'SELECT * FROM service_catalog WHERE mechanic_user_id = $1 ORDER BY service_name',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
