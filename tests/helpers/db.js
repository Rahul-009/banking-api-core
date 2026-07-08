import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Transactions (used by the ledger/transfer flow) require a replica set,
// so tests run against an in-memory single-node replica set rather than
// a plain standalone mongod.
let replSet;

export async function connectTestDb() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  await mongoose.connect(uri);
}

export async function closeTestDb() {
  await mongoose.disconnect();
  if (replSet) await replSet.stop();
}

export async function clearTestDb() {
  // Raw driver, not the Mongoose model layer — LedgerEntry intentionally
  // blocks deleteMany() at the schema level (immutability), so clearing
  // test data has to bypass that the same way manual verification did.
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}
