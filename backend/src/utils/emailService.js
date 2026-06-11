const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
    });

    return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@mekaniknearby.com';
    const transport = getTransporter();

    if (!transport) {
        console.log(`[Email — dev fallback] To: ${to}\nSubject: ${subject}\n${text}`);
        return { sent: false, fallback: true };
    }

    await transport.sendMail({ from, to, subject, text, html: html || text });
    return { sent: true };
};

module.exports = { sendEmail };
