/** @jest-environment node */
jest.mock('otplib', () => ({
    generateSecret: jest.fn(() => 'MOCK_SECRET'),
    generateURI: jest.fn(() => 'otpauth://mock'),
    verifySync: jest.fn(() => ({ valid: true })),
}));

const request = require('supertest');
const app = require('../src/app');

describe('Health check', () => {
    it('GET /api/health returns OK', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
    });
});

describe('Auth validation', () => {
    it('POST /api/auth/register rejects driver without phone', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'driver',
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/phone/i);
    });

    it('POST /api/auth/login rejects missing credentials', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'nobody@example.com',
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/password/i);
    });
});

describe('Protected routes', () => {
    it('GET /api/auth/me requires token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });
});
