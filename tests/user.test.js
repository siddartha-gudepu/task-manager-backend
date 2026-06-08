const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../app');
const connectDB = require('../config/db');

jest.setTimeout(10000);

describe('User API', () => {
  let adminToken;
  let memberToken;
  let memberId;

  beforeAll(async () => {
    await connectDB();

    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: `admin_${Date.now()}`,
        email: `admin_${Date.now()}@example.com`,
        password: 'Password123',
        adminInviteToken: process.env.ADMIN_INVITE_TOKEN
      });

    adminToken = adminRes.body.token;

    const memberRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: `member_${Date.now()}`,
        email: `member_${Date.now()}@example.com`,
        password: 'Password123'
      });

    memberToken = memberRes.body.token;
    memberId = memberRes.body._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('admin can get all users', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('member cannot get all users', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${memberToken}`);

    expect([401, 403]).toContain(response.statusCode);
  });

  test('get user by id', async () => {
    const response = await request(app)
      .get(`/api/users/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(memberId);
  });

  test('get non-existing user', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await request(app)
      .get(`/api/users/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(404);
  });

  test('member cannot delete user', async () => {
    const response = await request(app)
      .delete(`/api/users/${memberId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect([401, 403]).toContain(response.statusCode);
  });

  test('admin can delete user', async () => {
    const response = await request(app)
      .delete(`/api/users/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('User deleted successfully');
  });

  test('delete already deleted user', async () => {
    const response = await request(app)
      .delete(`/api/users/${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(404);
  });
});