const request = require('supertest');
const app = require('../app');

describe('Health Check', () => {
    test('GET /healthz', async () => {
        const response = await request(app)
            .get('/healthz');

        expect(response.statusCode).toBe(200);
        expect(response.body.status).toBe('ok');
    });
});