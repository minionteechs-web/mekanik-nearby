const validator = require('validator');

/** Strip HTML tags and trim user-generated text. */
const sanitizeText = (input, maxLen = 2000) => {
    if (input == null) return '';
    const str = String(input)
        .replace(/<[^>]*>/g, '')
        .trim();
    return str.length > maxLen ? str.slice(0, maxLen) : str;
};

const sanitizeEmail = (email) => {
    const trimmed = String(email || '').trim().toLowerCase();
    return validator.isEmail(trimmed) ? trimmed : null;
};

module.exports = { sanitizeText, sanitizeEmail };
