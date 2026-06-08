const request = require('supertest');
const mongoose = require('mongoose');

const app = require('../app');
const connectDB = require('../config/db');

jest.setTimeout(15000);

describe('Task API', () => {
  let adminToken;
  let memberToken;
  let memberId;
  let taskId;

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

  test('create task', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'High',
        dueDate: new Date(),
        assignedTo: [memberId],
        todoChecklist: [
          {
            text: 'Todo 1',
            completed: false
          }
        ]
      });

    expect(response.statusCode).toBe(201);

    taskId = response.body.task._id;
  });

  test('get tasks', async () => {
    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.tasks)).toBe(true);
  });

  test('get task by id', async () => {
    const response = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(taskId);
  });

  test('update task', async () => {
    const response = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Updated Task'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.updatedTask.title).toBe('Updated Task');
  });

  test('update task status', async () => {
    const response = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        status: 'Completed'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.task.status).toBe('Completed');
  });

  test('update task checklist', async () => {
    const response = await request(app)
      .put(`/api/tasks/${taskId}/todo`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        todoChecklist: [
          {
            text: 'Todo 1',
            completed: true
          }
        ]
      });

    expect(response.statusCode).toBe(200);
  });

  test('admin dashboard data', async () => {
    const response = await request(app)
      .get('/api/tasks/dashboard-data')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.statistics).toBeDefined();
  });

  test('user dashboard data', async () => {
    const response = await request(app)
      .get('/api/tasks/user-dashboard-data')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.statistics).toBeDefined();
  });

  test('delete task', async () => {
    const response = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.statusCode).toBe(200);
  });
});