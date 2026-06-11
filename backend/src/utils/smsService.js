/**
 * SMS via Termii (Nigeria) or generic HTTP webhook.
 * Set TERMII_API_KEY + TERMII_SENDER_ID, or SMS_WEBHOOK_URL for custom provider.
 */
const sendSms = async (phone, message) => {
    if (!phone || !message) return { sent: false };

    const apiKey = process.env.TERMII_API_KEY;
    const senderId = process.env.TERMII_SENDER_ID || 'Mekanik';

    if (apiKey) {
        try {
            const res = await fetch('https://api.ng.termii.com/api/sms/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: phone.replace(/\D/g, ''),
                    from: senderId,
                    sms: message,
                    type: 'plain',
                    channel: 'generic',
                    api_key: apiKey,
                }),
            });
            if (res.ok) return { sent: true };
            console.error('[SMS] Termii error:', await res.text());
        } catch (err) {
            console.error('[SMS] Termii failed:', err.message);
        }
    }

    const webhook = process.env.SMS_WEBHOOK_URL;
    if (webhook) {
        try {
            await fetch(webhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, message }),
            });
            return { sent: true };
        } catch (err) {
            console.error('[SMS] Webhook failed:', err.message);
        }
    }

    console.log(`[SMS — dev fallback] ${phone}: ${message}`);
    return { sent: false, fallback: true };
};

module.exports = { sendSms };
