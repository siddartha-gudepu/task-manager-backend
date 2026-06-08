const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../app');
const connectDB = require('../config/db');

jest.setTimeout(10000);

describe('Reports API', () => {
  let adminToken;

  const adminUser = {
    name: `admin_${Date.now()}`,
    email: `admin_${Date.now()}@example.com`,
    password: 'Password123',
    adminInviteToken: process.env.ADMIN_INVITE_TOKEN
  };

  beforeAll(async () => {
    await connectDB();

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(adminUser);

    adminToken = registerResponse.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('export tasks report', async () => {
    const response = await request(app)
      .get('/api/reports/export/tasks')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);

    expect(
      response.headers['content-type']
    ).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    expect(
      response.headers['content-disposition']
    ).toContain('tasks_report.xlsx');
  });

  test('export users report', async () => {
    const response = await request(app)
      .get('/api/reports/export/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);

    expect(
      response.headers['content-type']
    ).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    expect(
      response.headers['content-disposition']
    ).toContain('users_report.xlsx');
  });

  test('export tasks report without token', async () => {
    const response = await request(app)
      .get('/api/reports/export/tasks');

    expect(response.statusCode).toBe(401);
  });

  test('export users report without token', async () => {
    const response = await request(app)
      .get('/api/reports/export/users');

    expect(response.statusCode).toBe(401);
  });
});