const db = require('../config/db');

const sendExpoPush = async (tokens, { title, body, data = {} }) => {
    if (!tokens?.length) return;

    const messages = tokens.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
    }));

    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });
    } catch (err) {
        console.error('[Push] Expo send failed:', err.message);
    }
};

const pushToUser = async (userId, payload) => {
    try {
        const result = await db.query(
            'SELECT token FROM push_tokens WHERE user_id = $1',
            [userId]
        );
        const tokens = result.rows.map((r) => r.token);
        await sendExpoPush(tokens, payload);
    } catch (err) {
        console.error('[Push] pushToUser failed:', err.message);
    }
};

module.exports = { sendExpoPush, pushToUser };
