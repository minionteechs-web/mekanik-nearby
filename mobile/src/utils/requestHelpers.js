import { mechanics } from './api';

export async function mechanicFromRequest(req) {
    if (!req) return null;

    if (req.mechanic_profile_id) {
        try {
            const res = await mechanics.getDetail(req.mechanic_profile_id);
            return res.data;
        } catch {
            /* fall through */
        }
    }

    if (req.mechanic_id) {
        return {
            user_id: req.mechanic_id,
            name: req.mechanic_name || 'Your mechanic',
        };
    }

    return null;
}

export const ACTIVE_REQUEST_STATUSES = ['pending', 'accepted', 'en-route', 'arrived'];
