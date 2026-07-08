import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { connectTestDb, closeTestDb, clearTestDb } from './helpers/db.js';
import { createCompleteUser, createAccountFor, getOrCreateAccountType, accessTokenFor } from './helpers/factories.js';
import Account from '../src/models/account.model.js';

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

describe('Account IDOR / mass-assignment protections', () => {
  test('creating an account ignores client-supplied user and balance', async () => {
    const userA = await createCompleteUser();
    const userB = await createCompleteUser();
    const accountType = await getOrCreateAccountType();

    const res = await request(app)
      .post('/api/account')
      .set('Authorization', `Bearer ${accessTokenFor(userA)}`)
      .send({
        user: userB._id.toString(),
        balance: 999999,
        accountType: accountType._id.toString(),
        accountNumber: `T-${Date.now()}`,
      });

    expect(res.status).toBe(201);
    const createdUserId = res.body.data.user._id ?? res.body.data.user;
    expect(createdUserId).toBe(userA._id.toString());
    expect(res.body.data.balance).toBe(0);
  });

  test("a user cannot update another user's account balance/status", async () => {
    const userA = await createCompleteUser();
    const userB = await createCompleteUser();
    const accountB = await createAccountFor(userB, { balance: 500 });

    const res = await request(app)
      .patch(`/api/account/${accountB._id}`)
      .set('Authorization', `Bearer ${accessTokenFor(userA)}`)
      .send({ balance: 999999, status: 'ACTIVE' });

    expect(res.status).toBe(403);
    const fresh = await Account.findById(accountB._id);
    expect(fresh.balance).toBe(500);
  });

  test("a user cannot read another user's account", async () => {
    const userA = await createCompleteUser();
    const userB = await createCompleteUser();
    const accountB = await createAccountFor(userB);

    const res = await request(app)
      .get(`/api/account/${accountB._id}`)
      .set('Authorization', `Bearer ${accessTokenFor(userA)}`);

    expect(res.status).toBe(403);
  });

  test('a user cannot close another account (admin/manager only)', async () => {
    const userA = await createCompleteUser();
    const userB = await createCompleteUser();
    const accountB = await createAccountFor(userB, { balance: 0 });

    const res = await request(app)
      .patch(`/api/account/${accountB._id}/close`)
      .set('Authorization', `Bearer ${accessTokenFor(userA)}`);

    expect(res.status).toBe(403);
  });

  test('the owner can freeze their own account', async () => {
    const userA = await createCompleteUser();
    const accountA = await createAccountFor(userA);

    const res = await request(app)
      .patch(`/api/account/${accountA._id}/freeze`)
      .set('Authorization', `Bearer ${accessTokenFor(userA)}`);

    expect(res.status).toBe(200);
    const fresh = await Account.findById(accountA._id);
    expect(fresh.status).toBe('FROZEN');
  });
});
