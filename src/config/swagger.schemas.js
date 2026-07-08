// Reusable OpenAPI component schemas, referenced via $ref from the
// @swagger JSDoc blocks in src/routes/*.routes.js. Kept separate from
// swagger.js so that file stays focused on wiring, not field lists.

export const schemas = {
  User: {
    type: 'object',
    properties: {
      _id: { type: 'string', example: '65f1a2b3c4d5e6f7a8b9c0d1' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      phone: { type: 'string' },
      address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zipCode: { type: 'string' },
          country: { type: 'string' },
        },
      },
      dateOfBirth: { type: 'string', format: 'date' },
      gender: {
        type: 'string',
        enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', 'other'],
      },
      occupation: { type: 'string' },
      employer: { type: 'string' },
      annualIncome: { type: 'integer' },
      profilePicture: { type: 'string', nullable: true },
      emailVerified: { type: 'boolean' },
      phoneVerified: { type: 'boolean' },
      role: { type: 'string', enum: ['user', 'manager', 'admin', 'superadmin'] },
      profileCompletion: { type: 'integer', minimum: 0, maximum: 100 },
      isActive: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  Account: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      user: { type: 'string', description: 'User ObjectId (populated as a User object on read endpoints)' },
      accountType: { type: 'string', description: 'AccountType ObjectId (populated as an AccountType object on read endpoints)' },
      accountNumber: { type: 'string' },
      balance: { type: 'number' },
      currency: { type: 'string', enum: ['BDT'] },
      status: { type: 'string', enum: ['PENDING', 'ACTIVE', 'FROZEN', 'DORMANT', 'CLOSED'] },
      openedAt: { type: 'string', format: 'date-time' },
      closedAt: { type: 'string', format: 'date-time', nullable: true },
      lastTransactionAt: { type: 'string', format: 'date-time', nullable: true },
      isPrimary: { type: 'boolean' },
      remarks: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  AccountTypeFeatures: {
    type: 'object',
    properties: {
      atmCard: { type: 'boolean' },
      chequeBook: { type: 'boolean' },
      internetBanking: { type: 'boolean' },
      mobileBanking: { type: 'boolean' },
      smsAlert: { type: 'boolean' },
    },
  },

  AccountType: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      code: { type: 'string', enum: ['SAVINGS', 'CURRENT', 'STUDENT', 'WOMEN'] },
      name: { type: 'string' },
      description: { type: 'string' },
      interestRate: { type: 'number', minimum: 0, maximum: 100 },
      minimumBalance: { type: 'number', minimum: 0 },
      monthlyMaintenanceFee: { type: 'number', minimum: 0 },
      minimumOpeningDeposit: { type: 'number', minimum: 0 },
      dailyWithdrawalLimit: { type: 'number', minimum: 0 },
      maximumDailyTransactions: { type: 'integer', minimum: 1 },
      minimumAge: { type: 'integer', minimum: 0, maximum: 120 },
      maximumAge: { type: 'integer', minimum: 0, maximum: 120 },
      allowedGender: { type: 'string', enum: ['MALE', 'FEMALE', 'ANY'] },
      requiresStudentVerification: { type: 'boolean' },
      isActive: { type: 'boolean' },
      features: { $ref: '#/components/schemas/AccountTypeFeatures' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  Decimal128: {
    type: 'object',
    description: 'MongoDB Decimal128, serialized as { "$numberDecimal": "<string>" }',
    properties: {
      '$numberDecimal': { type: 'string', example: '250.00' },
    },
  },

  Transaction: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      referenceNo: { type: 'string', example: 'TXN-1783530144054-c70ab95c' },
      type: {
        type: 'string',
        enum: [
          'DEPOSIT', 'WITHDRAW', 'TRANSFER',
          'FDR_CREATE', 'FDR_MATURE', 'FDR_PREMATURE_CLOSE',
          'DPS_CREATE', 'DPS_INSTALLMENT', 'DPS_MATURE',
          'LOAN_DISBURSE', 'LOAN_PAYMENT',
          'INTEREST_CREDIT', 'SERVICE_CHARGE',
          'REVERSAL', 'ADJUSTMENT',
        ],
      },
      amount: { $ref: '#/components/schemas/Decimal128' },
      currency: { type: 'string' },
      status: { type: 'string', enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED'] },
      channel: { type: 'string', enum: ['WEB', 'MOBILE', 'ATM', 'COUNTER', 'SYSTEM'] },
      remarks: { type: 'string' },
      createdBy: { type: 'string', nullable: true },
      idempotencyKey: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  Pagination: {
    type: 'object',
    properties: {
      page: { type: 'integer' },
      limit: { type: 'integer' },
      total: { type: 'integer' },
      totalPages: { type: 'integer' },
    },
  },

  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string' },
      errors: { nullable: true },
    },
  },

  ValidationError: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: 'Validation failed' },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            message: { type: 'string' },
            value: {},
          },
        },
      },
      invalidFields: { type: 'array', items: { type: 'string' } },
    },
  },
};

export default schemas;
