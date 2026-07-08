const mongoose = require('mongoose');

const { Schema } = mongoose;

const depositProductSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      immutable: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: ['FDR', 'DPS'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    tenureMonths: {
      type: Number,
      required: true,
      min: 1,
    },

    interestRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    minimumAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    maximumAmount: {
      type: Number,
      default: Number.MAX_SAFE_INTEGER,
    },

    prematureClosureAllowed: {
      type: Boolean,
      default: true,
    },

    prematurePenaltyRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    autoRenewAvailable: {
      type: Boolean,
      default: true,
    },

    isIslamic: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ----------------------------------
            INDEXES
----------------------------------- */

depositProductSchema.index({
  category: 1,
  tenureMonths: 1,
});

depositProductSchema.index({
  code: 1,
});

depositProductSchema.index({
  isActive: 1,
});

/* ----------------------------------
            VIRTUALS
----------------------------------- */

depositProductSchema.virtual('isFDR').get(function () {
  return this.category === 'FDR';
});

depositProductSchema.virtual('isDPS').get(function () {
  return this.category === 'DPS';
});

/* ----------------------------------
            PRE SAVE
----------------------------------- */

depositProductSchema.pre('save', function () {
  this.code = this.code.toUpperCase();
});

/* ----------------------------------
        INSTANCE METHODS
----------------------------------- */

depositProductSchema.methods.calculateInterest = function (principal) {
  return (principal * this.interestRate * this.tenureMonths) / (100 * 12);
};

depositProductSchema.methods.calculateMaturityAmount = function (principal) {
  return principal + this.calculateInterest(principal);
};

depositProductSchema.methods.isEligibleAmount = function (amount) {
  return amount >= this.minimumAmount && amount <= this.maximumAmount;
};

/* ----------------------------------
        STATIC METHODS
----------------------------------- */

depositProductSchema.statics.activeProducts = function () {
  return this.find({
    isActive: true,
  });
};

depositProductSchema.statics.findFDR = function () {
  return this.find({
    category: 'FDR',

    isActive: true,
  });
};

depositProductSchema.statics.findDPS = function () {
  return this.find({
    category: 'DPS',

    isActive: true,
  });
};

/* ----------------------------------
        QUERY HELPERS
----------------------------------- */

depositProductSchema.query.active = function () {
  return this.where({
    isActive: true,
  });
};

depositProductSchema.query.fdr = function () {
  return this.where({
    category: 'FDR',
  });
};

depositProductSchema.query.dps = function () {
  return this.where({
    category: 'DPS',
  });
};

module.exports = mongoose.model('DepositProduct', depositProductSchema);
