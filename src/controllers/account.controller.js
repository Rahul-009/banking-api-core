import Account from '../models/account.model.js';
import AppError from '../utils/appError.utils.js';

const isPrivilegedRole = (role) => ['admin', 'manager'].includes(role);

// Create a new account
export const createAccount = async (req, res, next) => {
  try {
    // Self-service only: account always belongs to the requester, always
    // starts unfunded and PENDING regardless of what the client sends.
    const { accountType, accountNumber, currency, isPrimary, remarks } = req.body;
    const accountData = {
      accountType,
      accountNumber,
      currency,
      isPrimary,
      remarks,
      user: req.user._id,
      balance: 0,
    };

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
    if (isPrimary !== undefined) filter.isPrimary = isPrimary;

    // Non-privileged users can only ever list their own accounts —
    // the `user` query param is ignored (not trusted) for them.
    if (isPrivilegedRole(req.user.role)) {
      if (user) filter.user = user;
    } else {
      filter.user = req.user._id;
    }

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

    const account = await Account.findById(id).populate(['user', 'accountType']);

    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    if (
      !isPrivilegedRole(req.user.role) &&
      account.user._id.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to access this account', 403));
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

    const account = await Account.findByAccountNumber(accountNumber).populate([
      'user',
      'accountType',
    ]);

    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    if (
      !isPrivilegedRole(req.user.role) &&
      account.user._id.toString() !== req.user._id.toString()
    ) {
      return next(new AppError('Not authorized to access this account', 403));
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

    const account = await Account.findById(id);
    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    const privileged = isPrivilegedRole(req.user.role);

    if (!privileged && account.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to modify this account', 403));
    }

    // Field allowlist: self-service can only touch cosmetic fields.
    // balance/status/accountType are ledger- or admin-controlled and are
    // silently ignored here rather than trusted from the request body.
    const allowedFields = privileged
      ? ['accountType', 'balance', 'status', 'isPrimary', 'remarks']
      : ['isPrimary', 'remarks'];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
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

    if (!isPrivilegedRole(req.user.role) && account.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to modify this account', 403));
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
      return next(
        new AppError(
          'Cannot close account with positive balance. Please withdraw all funds first.',
          400
        )
      );
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

    const account = await Account.findById(id).select('balance currency status accountNumber user');

    if (!account) {
      return next(new AppError('Account not found', 404));
    }

    if (!isPrivilegedRole(req.user.role) && account.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to access this account', 403));
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
  getAccountBalance,
};
