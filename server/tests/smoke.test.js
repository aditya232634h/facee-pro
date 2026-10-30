// Runs WITHOUT a database: covers routing, auth gates, validation and error format.
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';

describe('API without database', () => {
  it('health reports degraded (503) when DB is not connected', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.data.database).toBe('disconnected');
  });
  it('unknown route returns 404 in standard error format', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
  });
  it.each([['get', '/api/slots'], ['get', '/api/bookings'], ['get', '/api/auth/me'], ['get', '/api/admin/stats'], ['post', '/api/slots'], ['post', '/api/bookings']])(
    '%s %s requires authentication', async (m, url) => {
      const res = await request(app)[m](url);
      expect(res.status).toBe(401);
    });
  it('rejects a malformed token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });
  it('rejects a token signed with the wrong secret', async () => {
    const token = jwt.sign({ sub: '507f1f77bcf86cd799439011' }, 'some-other-secret-value');
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
  });
  it('register validates input before touching the DB', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'bad', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['email', 'name', 'password']);
  });
  it('login validates input', async () => {
    expect((await request(app).post('/api/auth/login').send({})).status).toBe(400);
  });
});
