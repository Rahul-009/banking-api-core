import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { connectTestDb, closeTestDb, clearTestDb } from './helpers/db.js';
import { createCompleteUser, accessTokenFor } from './helpers/factories.js';
import User from '../src/models/user.model.js';

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

describe('Profile mass-assignment protections', () => {
  test('updating the profile cannot set password or role', async () => {
    const user = await createCompleteUser();
    const originalHash = (await User.findById(user._id).select('+password')).password;

    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .send({ password: 'pwned123', role: 'admin', firstName: 'Changed' });

    expect(res.status).toBe(200);
    const fresh = await User.findById(user._id).select('+password');
    expect(fresh.password).toBe(originalHash);
    expect(fresh.role).toBe('user');
    expect(fresh.firstName).toBe('Changed');
  });

  test('change-password endpoint requires the current password', async () => {
    const user = await createCompleteUser({ password: 'OriginalPass1' });

    const badRes = await request(app)
      .patch('/api/profile/password')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .send({ currentPassword: 'wrong', newPassword: 'NewPassword1' });
    expect(badRes.status).toBe(401);

    const goodRes = await request(app)
      .patch('/api/profile/password')
      .set('Authorization', `Bearer ${accessTokenFor(user)}`)
      .send({ currentPassword: 'OriginalPass1', newPassword: 'NewPassword1' });
    expect(goodRes.status).toBe(200);

    const fresh = await User.findById(user._id).select('+password');
    expect(await fresh.comparePassword('NewPassword1')).toBe(true);
  });
});
