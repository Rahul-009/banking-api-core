import mongoose from 'mongoose';

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    referenceNo: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'DEPOSIT',
        'WITHDRAW',
        'TRANSFER',

        'FDR_CREATE',
        'FDR_MATURE',
        'FDR_PREMATURE_CLOSE',

        'DPS_CREATE',
        'DPS_INSTALLMENT',
        'DPS_MATURE',

        'LOAN_DISBURSE',
        'LOAN_PAYMENT',

        'INTEREST_CREDIT',
        'SERVICE_CHARGE',

        'REVERSAL',
        'ADJUSTMENT',
      ],
      index: true,
    },
    amount: {
      type: Schema.Types.Decimal128,
      required: [true, 'Amount is required for creating a transaction'],
      min: [0, 'Transaction amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'BDT',
      immutable: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED'],
      default: 'PENDING',
      index: true,
    },
    channel: {
      type: String,
      enum: ['WEB', 'MOBILE', 'ATM', 'COUNTER', 'SYSTEM'],
      default: 'SYSTEM',
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    idempotencyKey: {
      type: String,
      required: [true, 'Idempotency Key is required for creating a transaction'],
      index: true,
      unique: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

/* ----------------------------------------------------
                        INDEXES
----------------------------------------------------- */

transactionSchema.index({
  type: 1,
  status: 1,
});

transactionSchema.index({
  createdAt: -1,
});

transactionSchema.index({
  createdBy: 1,
});

/* ----------------------------------------------------
                        PRE SAVE
----------------------------------------------------- */

transactionSchema.pre('validate', function () {
  this.currency = this.currency.toUpperCase();
});

/* ----------------------------------------------------
                    INSTANCE METHODS
----------------------------------------------------- */

transactionSchema.methods.markProcessing = function () {
  this.status = 'PROCESSING';
  return this.save();
};

transactionSchema.methods.markCompleted = function () {
  this.status = 'COMPLETED';
  return this.save();
};

transactionSchema.methods.markFailed = function () {
  this.status = 'FAILED';
  return this.save();
};

transactionSchema.methods.markReversed = function () {
  this.status = 'REVERSED';
  return this.save();
};

/* ----------------------------------------------------
                    STATIC METHODS
----------------------------------------------------- */

transactionSchema.statics.findByReference = function (referenceNo) {
  return this.findOne({ referenceNo });
};

transactionSchema.statics.findPending = function () {
  return this.find({
    status: 'PENDING',
  });
};

transactionSchema.statics.findCompleted = function () {
  return this.find({
    status: 'COMPLETED',
  });
};

transactionSchema.statics.findByType = function (type) {
  return this.find({
    type,
  });
};

/* ----------------------------------------------------
                    QUERY HELPERS
----------------------------------------------------- */

transactionSchema.query.completed = function () {
  return this.where({
    status: 'COMPLETED',
  });
};

transactionSchema.query.pending = function () {
  return this.where({
    status: 'PENDING',
  });
};

transactionSchema.query.byType = function (type) {
  return this.where({
    type,
  });
};

const transactionModel = mongoose.model('Transaction', transactionSchema);

export default transactionModel;
