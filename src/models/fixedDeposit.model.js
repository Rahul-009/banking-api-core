const mongoose = require('mongoose');

const { Schema } = mongoose;

const fixedDepositSchema = new Schema(
  {
    account: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      index: true,
    },

    product: {
      type: Schema.Types.ObjectId,
      ref: 'DepositProduct',
      required: true,
      index: true,
    },

    principal: {
      type: Schema.Types.Decimal128,
      required: true,
    },

    interestRate: {
      type: Number,
      required: true,
    },

    tenureMonths: {
      type: Number,
      required: true,
    },

    maturityAmount: {
      type: Schema.Types.Decimal128,
      required: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    maturityDate: {
      type: Date,
      required: true,
      index: true,
    },

    autoRenew: {
      type: Boolean,
      default: false,
    },

    nominee: {
      name: String,
      relation: String,
      phone: String,
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'MATURED', 'PREMATURE_CLOSED', 'CLOSED'],
      default: 'ACTIVE',
      index: true,
    },

    closedAt: Date,

    remarks: String,
  },
  {
    timestamps: true,
    versionKey: false,
    optimisticConcurrency: true,
  }
);

/* ----------------------------------
                INDEXES
----------------------------------- */

fixedDepositSchema.index({
  account: 1,
  status: 1,
});

fixedDepositSchema.index({
  maturityDate: 1,
  status: 1,
});

fixedDepositSchema.index({
  product: 1,
});

/* ----------------------------------
                VIRTUALS
----------------------------------- */

fixedDepositSchema.virtual('isActive').get(function () {
  return this.status === 'ACTIVE';
});

fixedDepositSchema.virtual('isMatured').get(function () {
  return this.status === 'MATURED';
});

fixedDepositSchema.virtual('remainingDays').get(function () {
  const diff = this.maturityDate - new Date();

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

/* ----------------------------------
                PRE SAVE
----------------------------------- */

fixedDepositSchema.pre('save', function (next) {
  if (this.status === 'CLOSED' || this.status === 'PREMATURE_CLOSED') {
    this.closedAt = new Date();
  }

  next();
});

/* ----------------------------------
            INSTANCE METHODS
----------------------------------- */

fixedDepositSchema.methods.canClose = function () {
  return this.status === 'ACTIVE';
};

fixedDepositSchema.methods.markMatured = function () {
  this.status = 'MATURED';

  return this.save();
};

fixedDepositSchema.methods.close = function () {
  this.status = 'CLOSED';

  return this.save();
};

fixedDepositSchema.methods.prematureClose = function () {
  this.status = 'PREMATURE_CLOSED';

  return this.save();
};

fixedDepositSchema.methods.hasMatured = function () {
  return new Date() >= this.maturityDate;
};

/* ----------------------------------
            STATIC METHODS
----------------------------------- */

fixedDepositSchema.statics.findActive = function () {
  return this.find({
    status: 'ACTIVE',
  });
};

fixedDepositSchema.statics.findMaturingToday = function () {
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);

  tomorrow.setDate(today.getDate() + 1);

  return this.find({
    maturityDate: {
      $gte: today,
      $lt: tomorrow,
    },

    status: 'ACTIVE',
  });
};

fixedDepositSchema.statics.findByAccount = function (accountId) {
  return this.find({
    account: accountId,
  });
};

/* ----------------------------------
            QUERY HELPERS
----------------------------------- */

fixedDepositSchema.query.active = function () {
  return this.where({
    status: 'ACTIVE',
  });
};

fixedDepositSchema.query.matured = function () {
  return this.where({
    status: 'MATURED',
  });
};

module.exports = mongoose.model('FixedDeposit', fixedDepositSchema);
