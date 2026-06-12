/** @jest-environment node */
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
    it('POST /api/auth/register rejects missing terms', async () => {
        const res = await request(app).post('/api/auth/register').send({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            phone: '08012345678',
            role: 'driver',
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/terms/i);
    });

    it('POST /api/auth/login rejects bad credentials', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'nobody@example.com',
            password: 'wrongpassword',
        });
        expect(res.status).toBe(400);
    });
});

describe('Protected routes', () => {
    it('GET /api/auth/me requires token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });
});
