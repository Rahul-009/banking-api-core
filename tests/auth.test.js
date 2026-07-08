import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { connectTestDb, closeTestDb, clearTestDb } from './helpers/db.js';
import { createCompleteUser } from './helpers/factories.js';

jest.setTimeout(60000);

beforeAll(async () => {
  await connectTestDb();
});
afterEach(async () => {
  await clearTestDb();
});
afterAll(async () => {
  await closeTestDb();
});

describe('Auth: token type + lockout', () => {
  test('rejects a refresh token used as an access token', async () => {
    const user = await createCompleteUser({ password: 'Password1' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password1' });

    const setCookie = loginRes.headers['set-cookie']?.join(';') || '';
    const refreshToken = /refreshToken=([^;]+)/.exec(setCookie)?.[1];

    const res = await request(app)
      .get('/api/account')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(res.status).toBe(401);
  });

  test('locks the account after 5 failed logins', async () => {
    const user = await createCompleteUser({ password: 'Password1' });

    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong' });
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password1' });

    expect(res.status).toBe(403);
  });
});
