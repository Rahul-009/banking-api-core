import mongoose from 'mongoose';
import AppError from '../utils/appError.utils.js';

import User from '../models/user.model.js'
import Account from '../models/account.model.js'
import AccountType from '../models/accountType.model.js'


// GET /api/account-types
const getAllAccountTypes = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive, 
      category,
      search 
    } = req.query;

    // Build filter
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [accountTypes, total] = await Promise.all([
      AccountType.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AccountType.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: accountTypes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error)
  }
};

// GET /api/account-types/:id
const getAccountTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const accountType = await AccountType.findById(id);
    
    if (!accountType) {
      return next(new AppError('Account type not found', 404));
    }

    res.status(200).json({
      success: true,
      data: accountType
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/account-types/code/:code
const getAccountTypeByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const accountType = await AccountType.findByCode(code);
    
    if (!accountType) {
      return next(new AppError('Account type not found', 404));
    }

    res.status(200).json({
      success: true,
      data: accountType
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/account-types/:id
const deleteAccountType = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find account type
    const accountType = await AccountType.findById(id);
    if (!accountType) {
      return next(new AppError('Account type not found', 404));
    }

    // Check if any accounts are using this type
    const accountCount = await Account.countDocuments({ accountTypeId: id });
    if (accountCount > 0) {
      return next(new AppError(
        `Cannot delete. ${accountCount} accounts are using this account type. Archive or deactivate instead.`,
        400
      ));
    }

    // Hard delete (or you could implement soft delete)
    await AccountType.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Account type deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/account-types
const createAccountType = async (req, res, next) => {
  try {

    const {
      code,
      name,
      description,
      interestRate = 0,
      minimumBalance = 0,
      monthlyMaintenanceFee = 0,
      minimumOpeningDeposit = 0,
      dailyWithdrawalLimit = 50000,
      maximumDailyTransactions = 20,
      minimumAge,
      maximumAge,
      allowedGender = 'ANY',
      requiresStudentVerification = false,
      isActive = true,
      features = {}
    } = req.body;

    // Check if code already exists
    const existingCode = await AccountType.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return next(new AppError('Account type code already exists', 400));
    }

    // Check if name already exists
    const existingName = await AccountType.findOne({ name });
    if (existingName) {
      return next(new AppError('Account type name already exists', 400));
    }

    // Validate enum values
    const validCodes = ['SAVINGS', 'CURRENT', 'STUDENT', 'WOMEN'];
    if (!validCodes.includes(code.toUpperCase())) {
      return next(new AppError('Invalid account type code. Must be SAVINGS, CURRENT, STUDENT, or WOMEN', 400));
    }

    // Create new account type with default features
    const accountTypeData = {
      code: code.toUpperCase(),
      name,
      description,
      interestRate,
      minimumBalance,
      monthlyMaintenanceFee,
      minimumOpeningDeposit,
      dailyWithdrawalLimit,
      maximumDailyTransactions,
      minimumAge,
      maximumAge,
      allowedGender,
      requiresStudentVerification,
      isActive,
      features: {
        atmCard: features.atmCard !== undefined ? features.atmCard : true,
        chequeBook: features.chequeBook !== undefined ? features.chequeBook : false,
        internetBanking: features.internetBanking !== undefined ? features.internetBanking : true,
        mobileBanking: features.mobileBanking !== undefined ? features.mobileBanking : true,
        smsAlert: features.smsAlert !== undefined ? features.smsAlert : true
      }
    };

    const accountType = await AccountType.create(accountTypeData);

    res.status(201).json({
      success: true,
      message: 'Account type created successfully',
      data: accountType
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/account-types/:id
const updateAccountType = async (req, res, next) => {
  try {
    
    // find the accountType
    const { id } = req.params;
    const accountType = await AccountType.findById(id);

    if (!accountType) {
      return res.status(404).json({
        success: false,
        message: "Account type not found.",
      });
    }

    // ✅ CHECK: Is the body empty?
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body cannot be empty. Please provide at least one field to update.",
        allowedFields: ['interestRate', 'minimumBalance', 'monthlyMaintenanceFee', 'features', 'isActive']
      });
    }

    // Check if trying to update disallowed fields
    const allowedUpdates = [
      'interestRate',
      'minimumBalance',
      'monthlyMaintenanceFee',
      'features',
      'isActive'
    ];
    
    const requestedUpdates = Object.keys(req.body);
    const invalidUpdates = requestedUpdates.filter(field => !allowedUpdates.includes(field));
    
    if (invalidUpdates.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Only these fields can be updated: ${allowedUpdates.join(', ')}. Invalid fields: ${invalidUpdates.join(', ')}`
      });
    }


    if(req.body.features){
        const allowedFeatureKeys = ['atmCard', 'chequeBook', 'internetBanking', 'mobileBanking', 'smsAlert'];
        const requestedFeatureKeys = Object.keys(req.body.features);
        const invalidFeatureKeys = requestedFeatureKeys.filter(key => !allowedFeatureKeys.includes(key));

        if (invalidFeatureKeys.length > 0) {
            return res.status(400).json({
            success: false,
            message: `Invalid feature keys: ${invalidFeatureKeys.join(', ')}. Allowed: ${allowedFeatureKeys.join(', ')}`
            });
        }
    }
    
    Object.assign(accountType, req.body);
    console.log(accountType)
    delete accountType.updatedAt


    await accountType.save();

    return res.status(200).json({
      success: true,
      message: "Account type updated successfully.",
      data: accountType,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/account-types/:id/usage
const getAccountTypeUsage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError('Invalid account type ID', 400));
    }

    const accountType = await AccountType.findById(id);
    if (!accountType) {
      return next(new AppError('Account type not found', 404));
    }

    const totalAccounts = await Account.countDocuments({ accountTypeId: id });
    const activeAccounts = await Account.countDocuments({ 
      accountTypeId: id,
      status: 'ACTIVE'
    });
    const frozenAccounts = await Account.countDocuments({ 
      accountTypeId: id,
      status: 'FROZEN'
    });
    const closedAccounts = await Account.countDocuments({ 
      accountTypeId: id,
      status: 'CLOSED'
    });

    const totalBalance = await Account.aggregate([
      { $match: { accountTypeId: id, status: 'ACTIVE' } },
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        accountType: {
          id: accountType._id,
          code: accountType.code,
          name: accountType.name,
          isActive: accountType.isActive
        },
        usage: {
          totalAccounts,
          activeAccounts,
          frozenAccounts,
          closedAccounts,
          totalBalance: totalBalance.length > 0 ? totalBalance[0].total : 0,
          usagePercentage: totalAccounts > 0 ? 
            ((activeAccounts / totalAccounts) * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/account-types/active
const getActiveAccountTypes = async (req, res, next) => {
  try {
    const accountTypes = await AccountType.activeProducts();

    res.status(200).json({
      success: true,
      data: accountTypes,
      count: accountTypes.length
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/account-types/eligible/:userId
const checkEligibility = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Get user from database
    const user = await User.findById(userId);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const accountTypes = await AccountType.find({ isActive: true });
    
    const eligibleTypes = [];
    const ineligibleTypes = [];

    for (const type of accountTypes) {
      const eligible = type.isEligible(user);
      const result = {
        id: type._id,
        code: type.code,
        name: type.name,
        description: type.description,
        features: type.features,
        requirements: {
          minimumAge: type.minimumAge,
          maximumAge: type.maximumAge,
          allowedGender: type.allowedGender,
          requiresStudentVerification: type.requiresStudentVerification
        }
      };

      if (eligible) {
        eligibleTypes.push({
          ...result,
          minimumBalance: type.minimumBalance,
          monthlyMaintenanceFee: type.monthlyMaintenanceFee,
          interestRate: type.interestRate
        });
      } else {
        ineligibleTypes.push(result);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          age: Math.floor((Date.now() - user.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
          gender: user.gender,
          occupation: user.occupation
        },
        eligible: eligibleTypes,
        ineligible: ineligibleTypes
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/account-types/:id/calculate-interest
const calculateInterest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { balance } = req.body;

    if (!balance || balance < 0) {
      return next(new AppError('Please provide a valid positive balance', 400));
    }

    const accountType = await AccountType.findById(id);
    if (!accountType) {
      return next(new AppError('Account type not found', 404));
    }

    const interest = accountType.calculateInterest(balance);

    res.status(200).json({
      success: true,
      data: {
        accountType: accountType.name,
        balance: balance,
        interestRate: accountType.interestRate,
        interestAmount: interest,
        totalBalance: balance + interest
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
    getAllAccountTypes,
    getAccountTypeById,
    getAccountTypeByCode,
    deleteAccountType,
    createAccountType,
    updateAccountType,
    getAccountTypeUsage,
    getActiveAccountTypes,
    checkEligibility,
    calculateInterest,
}
