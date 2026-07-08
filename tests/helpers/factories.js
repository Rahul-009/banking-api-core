import jwt from 'jsonwebtoken';
import User from '../../src/models/user.model.js';
import Account from '../../src/models/account.model.js';
import AccountType from '../../src/models/accountType.model.js';

let counter = 0;

// A profile with every field calculateProfileCompletion() checks, so
// requireCompleteProfile lets these test users hit account/transaction
// routes without a separate "complete the profile" step in every test.
export async function createCompleteUser(overrides = {}) {
  counter += 1;
  return User.create({
    email: `user-${Date.now()}-${counter}@test.local`,
    password: 'Password1',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    phone: '+11234567890',
    address: { street: '123 Main St', city: 'Testville', zipCode: '1234' },
    dateOfBirth: new Date('1995-01-01'),
    profilePicture: 'uploads/profiles/placeholder.png',
    occupation: 'Engineer',
    emailVerified: true,
    ...overrides,
  });
}

export async function getOrCreateAccountType() {
  let accountType = await AccountType.findOne({});
  if (!accountType) {
    accountType = await AccountType.create({ code: 'SAVINGS', name: 'Savings' });
  }
  return accountType;
}

export async function createAccountFor(user, overrides = {}) {
  const accountType = await getOrCreateAccountType();
  counter += 1;
  return Account.create({
    user: user._id,
    accountType: accountType._id,
    accountNumber: `ACC-${Date.now()}-${counter}`,
    status: 'ACTIVE',
    balance: 0,
    ...overrides,
  });
}

export function accessTokenFor(user) {
  return jwt.sign({ userId: user._id, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
}
