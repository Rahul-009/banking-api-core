import Account from '../models/account.model.js';
import mongoose from 'mongoose';
import AppError from '../utils/appError.utils.js';

// Create a new account
export const createAccount = async (req, res, next) => {
  try {
    const accountData = req.body;
    
    // Check if account number already exists
    const existingAccount = await Account.findByAccountNumber(accountData.accountNumber);
    if (existingAccount) {
      return next(new AppError('Account number already exists', 409));
    }

    // If this account is set as primary, ensure no other primary account exists
    if (accountData.isPrimary) {
      const existingPrimary = await Account.findOne({
        user: accountData.user,
        isPrimary: true,
      });
      
      if (existingPrimary) {
        return next(new AppError('User already has a primary account', 400));
      }
    }

    const account = await Account.create(accountData);

    // Populate references for response
    await account.populate(['user', 'accountType']);

    res.status(201).json({
      success: true,
      data: account,
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return next(new AppError('Account number already exists', 409));
    }
    
    next(new AppError(error.message, 500));
  }
};

// Get all accounts with filters and pagination
export const getAccounts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      accountType,
      user,
      isPrimary,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (accountType) filter.accountType = accountType;
    if (user) filter.user = user;
    if (isPrimary !== undefined) filter.isPrimary = isPrimary;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // Execute query with pagination
    const [accounts, total] = await Promise.all([
      Account.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitValue)
        .populate(['user', 'accountType']),
      Account.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: accounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limitValue),
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Get account by ID
export const getAccountById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id)
      .populate(['user', 'accountType']);

    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Get account by account number
export const getAccountByNumber = async (req, res, next) => {
  try {
    const { accountNumber } = req.params;

    const account = await Account.findByAccountNumber(accountNumber)
      .populate(['user', 'accountType']);

    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Update account
export const updateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Prevent updating immutable fields
    delete updateData.accountNumber;
    delete updateData.openedAt;
    delete updateData.user;

    const account = await Account.findById(id);
    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    // If updating isPrimary to true, ensure no other primary account exists
    if (updateData.isPrimary === true) {
      const existingPrimary = await Account.findOne({
        user: account.user,
        isPrimary: true,
        _id: { $ne: id },
      });
      
      if (existingPrimary) {
        return next(new AppError('User already has a primary account', 400));
      }
    }

    // Update account
    Object.assign(account, updateData);
    await account.save();

    await account.populate(['user', 'accountType']);

    res.status(200).json({
      success: true,
      data: account,
      message: 'Account updated successfully',
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return next(new AppError('Account number already exists', 409));
    }
    
    next(new AppError(error.message, 500));
  }
};

// Freeze account
export const freezeAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id);
    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    if (account.status === 'CLOSED') {
      return next(new AppError('Cannot freeze a closed account', 400));
    }

    await account.freeze();
    await account.populate(['user', 'accountType']);

    res.status(200).json({
      success: true,
      data: account,
      message: 'Account frozen successfully',
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Activate account
export const activateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id);
    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    if (account.status === 'CLOSED') {
      return next(new AppError('Cannot activate a closed account', 400));
    }

    await account.activate();
    await account.populate(['user', 'accountType']);

    res.status(200).json({
      success: true,
      data: account,
      message: 'Account activated successfully',
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Close account
export const closeAccount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id);
    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    if (account.balance > 0) {
      return next(new AppError('Cannot close account with positive balance. Please withdraw all funds first.', 400));
    }

    await account.close();
    await account.populate(['user', 'accountType']);

    res.status(200).json({
      success: true,
      data: account,
      message: 'Account closed successfully',
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};

// Get account balance
export const getAccountBalance = async (req, res, next) => {
  try {
    const { id } = req.params;

    const account = await Account.findById(id)
      .select('balance currency status accountNumber');

    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        accountNumber: account.accountNumber,
        balance: account.balance,
        currency: account.currency,
        status: account.status,
      },
    });
  } catch (error) {
    next(new AppError(error.message, 500));
  }
};




export default {
    createAccount,
    getAccounts,
    getAccountById,
    getAccountByNumber,
    updateAccount,
    freezeAccount,
    activateAccount,
    closeAccount,
    getAccountBalance
}