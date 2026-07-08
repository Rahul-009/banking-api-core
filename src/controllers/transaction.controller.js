import crypto from 'crypto';
import mongoose from 'mongoose';
import transactionModel from '../models/transaction.model.js';
import ledgerEntryModel from '../models/ledgerEntry.model.js';
import accountModel from '../models/account.model.js';
import counterModel from '../models/counter.model.js';
import emailService from '../services/email.service.js';
import AppError from '../utils/appError.utils.js';

const isPrivilegedRole = (role) => ['admin', 'manager'].includes(role);

function generateReferenceNo() {
  return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

async function nextSequenceNo(session) {
  const counter = await counterModel.findOneAndUpdate(
    { _id: 'ledgerSeq' },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', session }
  );
  return counter.seq;
}

// If a transaction already exists for this idempotency key, respond in
// place of creating a new one. Returns true if it fully handled the
// response (COMPLETED/PENDING/PROCESSING), false if the caller still
// needs to decide (FAILED/REVERSED — those are treated as errors).
function respondForExistingTransaction(res, existing) {
  if (existing.status === 'COMPLETED') {
    res.status(200).json({
      success: true,
      message: 'Transaction already processed',
      data: existing,
    });
    return true;
  }

  if (existing.status === 'PENDING' || existing.status === 'PROCESSING') {
    res.status(202).json({
      success: true,
      message: 'Transaction is still processing',
      data: existing,
    });
    return true;
  }

  return false;
}

// Shared double-entry transfer used by both peer transfers and
// system-initiated initial funding. Everything (transaction row, both
// account balance updates, both ledger entries) commits atomically in a
// single Mongo session/transaction.
async function executeTransfer({
  fromAccountId,
  toAccountId,
  amount,
  idempotencyKey,
  remarks,
  type,
  createdBy,
  requireOwnershipOf,
}) {
  const amountNum = Number(amount);
  const amountDecimal = mongoose.Types.Decimal128.fromString(amountNum.toString());

  const session = await mongoose.startSession();
  let transaction;

  try {
    await session.withTransaction(async () => {
      // Sequential, not Promise.all: a single Mongo session cannot have two
      // operations in flight concurrently within a transaction.
      const fromAcc = await accountModel.findById(fromAccountId).session(session);
      const toAcc = await accountModel.findById(toAccountId).session(session);

      if (!fromAcc || !toAcc) {
        throw new AppError('Invalid fromAccount or toAccount', 400);
      }

      if (requireOwnershipOf && fromAcc.user.toString() !== requireOwnershipOf.toString()) {
        throw new AppError('Not authorized to transfer from this account', 403);
      }

      if (fromAcc.status !== 'ACTIVE' || toAcc.status !== 'ACTIVE') {
        throw new AppError('Both accounts must be ACTIVE to process a transaction', 400);
      }

      // Atomic guard: only debits if there's still enough balance at the
      // moment of the write, so two concurrent transfers can't both
      // succeed against the same insufficient balance.
      const debited = await accountModel.findOneAndUpdate(
        { _id: fromAccountId, balance: { $gte: amountNum } },
        { $inc: { balance: -amountNum }, $set: { lastTransactionAt: new Date() } },
        { session, returnDocument: 'after' }
      );

      if (!debited) {
        throw new AppError('Insufficient balance in source account', 400);
      }

      const credited = await accountModel.findOneAndUpdate(
        { _id: toAccountId },
        { $inc: { balance: amountNum }, $set: { lastTransactionAt: new Date() } },
        { session, returnDocument: 'after' }
      );

      transaction = (
        await transactionModel.create(
          [
            {
              referenceNo: generateReferenceNo(),
              type,
              amount: amountDecimal,
              idempotencyKey,
              remarks,
              status: 'COMPLETED',
              createdBy,
            },
          ],
          { session }
        )
      )[0];

      const debitSeq = await nextSequenceNo(session);
      const creditSeq = await nextSequenceNo(session);

      await ledgerEntryModel.create(
        [
          {
            transaction: transaction._id,
            account: fromAccountId,
            entryType: 'DEBIT',
            amount: amountDecimal,
            runningBalance: mongoose.Types.Decimal128.fromString(debited.balance.toString()),
            description: remarks,
            sequenceNo: debitSeq,
          },
        ],
        { session }
      );

      await ledgerEntryModel.create(
        [
          {
            transaction: transaction._id,
            account: toAccountId,
            entryType: 'CREDIT',
            amount: amountDecimal,
            runningBalance: mongoose.Types.Decimal128.fromString(credited.balance.toString()),
            description: remarks,
            sequenceNo: creditSeq,
          },
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return transaction;
}

export const createTransaction = async (req, res, next) => {
  try {
    const { fromAccount, toAccount, amount, idempotencyKey, remarks } = req.body;

    if (fromAccount === toAccount) {
      return next(new AppError('Cannot transfer to the same account', 400));
    }

    const existing = await transactionModel.findOne({ idempotencyKey });
    if (existing) {
      if (respondForExistingTransaction(res, existing)) return;
      return next(
        new AppError(
          'This idempotency key was already used for a failed/reversed transaction. Please retry with a new key.',
          409
        )
      );
    }

    const privileged = isPrivilegedRole(req.user.role);

    const transaction = await executeTransfer({
      fromAccountId: fromAccount,
      toAccountId: toAccount,
      amount,
      idempotencyKey,
      remarks,
      type: 'TRANSFER',
      createdBy: req.user._id,
      requireOwnershipOf: privileged ? null : req.user._id,
    });

    try {
      await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);
    } catch (emailError) {
      console.error('Transaction email failed to send:', emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Transaction completed successfully',
      data: transaction,
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    if (error.code === 11000) {
      return next(
        new AppError('A transaction with this idempotency key is already being processed', 409)
      );
    }
    next(new AppError(error.message, 500));
  }
};

export const createInitialFundsTransaction = async (req, res, next) => {
  try {
    const { toAccount, amount, idempotencyKey } = req.body;

    const existing = await transactionModel.findOne({ idempotencyKey });
    if (existing) {
      if (respondForExistingTransaction(res, existing)) return;
      return next(
        new AppError(
          'This idempotency key was already used for a failed/reversed transaction. Please retry with a new key.',
          409
        )
      );
    }

    const systemAccount = await accountModel.findOne({ user: req.user._id });
    if (!systemAccount) {
      return next(new AppError('System user account not found', 400));
    }

    const transaction = await executeTransfer({
      fromAccountId: systemAccount._id,
      toAccountId: toAccount,
      amount,
      idempotencyKey,
      remarks: 'Initial funds',
      type: 'DEPOSIT',
      createdBy: req.user._id,
      requireOwnershipOf: null,
    });

    return res.status(201).json({
      success: true,
      message: 'Initial funds transaction completed successfully',
      data: transaction,
    });
  } catch (error) {
    if (error instanceof AppError) return next(error);
    if (error.code === 11000) {
      return next(
        new AppError('A transaction with this idempotency key is already being processed', 409)
      );
    }
    next(new AppError(error.message, 500));
  }
};

export default {
  createTransaction,
  createInitialFundsTransaction,
};
