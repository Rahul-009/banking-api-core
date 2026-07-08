import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { connectTestDb, closeTestDb, clearTestDb } from './helpers/db.js';
import { createCompleteUser, createAccountFor, accessTokenFor } from './helpers/factories.js';
import Account from '../src/models/account.model.js';
import LedgerEntry from '../src/models/ledgerEntry.model.js';

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

describe('Transaction transfer (double-entry ledger)', () => {
  test('transfers funds atomically and writes two ledger entries', async () => {
    const userA = await createCompleteUser();
    const userB = await createCompleteUser();
    const accountA = await createAccountFor(userA, { balance: 1000 });
    const accountB = await createAccountFor(userB, { balance: 0 });

    const res = await request(app)
      .post('/api/transaction')
      .set('Authorization', `Bearer ${accessTokenFor(userA)}`)
      .send({
        fromAccount: accountA._id.toString(),
        toAccount: accountB._id.toString(),
        amount: 250,
        idempotencyKey: `test-${Date.now()}`,
      });

    expect(res.status).toBe(201);

    const freshA = await Account.findById(accountA._id);
    const freshB = await Account.findById(accountB._id);
    expect(freshA.balance).toBe(750);
    expect(freshB.balance).toBe(250);

    const entries = await LedgerEntry.find({ transaction: res.body.data._id });
    expect(entries).toHaveLength(2);
  });

  test('rejects insufficient balance', async () => {
    const userA = await createCompleteUser();
    const userB = await createCompleteUser();
    const accountA = await createAccountFor(userA, { balance: 10 });
    const accountB = await createAccountFor(userB, { balance: 0 });

    const res = await request(app)
      .post('/api/transaction')
      .set('Authorization', `Bearer ${accessTokenFor(userA)}`)
      .send({
        fromAccount: accountA._id.toString(),
        toAccount: accountB._id.toString(),
        amount: 999,
        idempotencyKey: `test-${Date.now()}`,
      });

    expect(res.status).toBe(400);
    const fresh = await Account.findById(accountA._id);
    expect(fresh.balance).toBe(10);
  });

  test('rejects a transfer from an account the caller does not own', async () => {
    const userA = await createCompleteUser();
    const userB = await createCompleteUser();
    const accountA = await createAccountFor(userA, { balance: 1000 });
    const accountB = await createAccountFor(userB, { balance: 0 });

    const res = await request(app)
      .post('/api/transaction')
      .set('Authorization', `Bearer ${accessTokenFor(userB)}`)
      .send({
        fromAccount: accountA._id.toString(),
        toAccount: accountB._id.toString(),
        amount: 10,
        idempotencyKey: `test-${Date.now()}`,
      });

    expect(res.status).toBe(403);
  });

  test('is idempotent on repeated requests with the same key', async () => {
    const userA = await createCompleteUser();
    const userB = await createCompleteUser();
    const accountA = await createAccountFor(userA, { balance: 1000 });
    const accountB = await createAccountFor(userB, { balance: 0 });
    const idempotencyKey = `test-${Date.now()}`;
    const payload = {
      fromAccount: accountA._id.toString(),
      toAccount: accountB._id.toString(),
      amount: 100,
      idempotencyKey,
    };

    await request(app)
      .post('/api/transaction')
      .set('Authorization', `Bearer ${accessTokenFor(userA)}`)
      .send(payload);
    const second = await request(app)
      .post('/api/transaction')
      .set('Authorization', `Bearer ${accessTokenFor(userA)}`)
      .send(payload);

    expect(second.status).toBe(200);
    const fresh = await Account.findById(accountA._id);
    expect(fresh.balance).toBe(900);
  });
});
