const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../app');
const connectDB = require('../config/db');

jest.setTimeout(10000);

describe('Auth API', () => {
  let token;

  const testUser = {
    name: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Password123'
  };

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('register user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(response.statusCode).toBe(201);
    expect(response.body.email).toBe(testUser.email);
    expect(response.body.token).toBeDefined();

    token = response.body.token;
  });

  test('register duplicate user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('User already exists');
  });

  test('login user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe(testUser.email);
    expect(response.body.token).toBeDefined();
  });

  test('login with wrong password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword'
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('Invalid email or password');
  });

  test('get profile', async () => {
    const response = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe(testUser.email);
  });

  test('get profile without token', async () => {
    const response = await request(app)
      .get('/api/auth/profile');

    expect(response.statusCode).toBe(401);
  });

  test('update profile', async () => {
    const response = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated User'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Updated User');
  });

  test('update password', async () => {
    const response = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        password: 'NewPassword123'
      });

    expect(response.statusCode).toBe(200);
  });

  test('login with updated password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'NewPassword123'
      });

    expect(response.statusCode).toBe(200);
  });
});