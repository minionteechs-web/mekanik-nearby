/** @jest-environment node */
const request = require('supertest');
const express = require('express');

const { sanitizeText, sanitizeEmail } = require('../src/utils/sanitize');

describe('Sanitize utilities', () => {
    it('strips HTML tags from text', () => {
        expect(sanitizeText('<b>hello</b> world')).toBe('hello world');
    });

    it('validates email', () => {
        expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
        expect(sanitizeEmail('not-an-email')).toBeNull();
    });
});

describe('Health endpoint (isolated)', () => {
    const app = express();
    app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'OK', timestamp: new Date() });
    });

    it('GET /api/health returns OK', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
    });
});
