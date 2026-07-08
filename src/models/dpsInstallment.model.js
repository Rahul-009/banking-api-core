const mongoose = require('mongoose');

const { Schema } = mongoose;

const dpsInstallmentSchema = new Schema(
  {
    dps: {
      type: Schema.Types.ObjectId,
      ref: 'DPS',
      required: true,
      index: true,
    },

    installmentNo: {
      type: Number,
      required: true,
      min: 1,
    },

    amount: {
      type: Schema.Types.Decimal128,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    paidDate: {
      type: Date,
    },

    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },

    paymentMethod: {
      type: String,
      enum: ['ACCOUNT', 'CASH', 'ONLINE', 'AUTO_DEBIT'],
    },

    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'MISSED'],
      default: 'PENDING',
      index: true,
    },

    remarks: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* -------------------------
        INDEXES
-------------------------- */

// One installment number per DPS
dpsInstallmentSchema.index(
  {
    dps: 1,
    installmentNo: 1,
  },
  {
    unique: true,
  }
);

// Due installment lookup
dpsInstallmentSchema.index({
  dueDate: 1,
  status: 1,
});

// Payment history
dpsInstallmentSchema.index({
  paidDate: -1,
});

/* -------------------------
        VIRTUALS
-------------------------- */

dpsInstallmentSchema.virtual('isPaid').get(function () {
  return this.status === 'PAID';
});

dpsInstallmentSchema.virtual('isOverdue').get(function () {
  return this.status === 'PENDING' && this.dueDate < new Date();
});

/* -------------------------
        PRE SAVE
-------------------------- */

dpsInstallmentSchema.pre('save', function () {
  if (this.status === 'PAID' && !this.paidDate) {
    this.paidDate = new Date();
  }
});

/* -------------------------
    INSTANCE METHODS
-------------------------- */

dpsInstallmentSchema.methods.markPaid = function (transactionId) {
  this.status = 'PAID';

  this.transaction = transactionId;

  this.paidDate = new Date();

  return this.save();
};

dpsInstallmentSchema.methods.markMissed = function () {
  this.status = 'MISSED';

  return this.save();
};

/* -------------------------
    STATIC METHODS
-------------------------- */

dpsInstallmentSchema.statics.findPending = function () {
  return this.find({
    status: 'PENDING',
  });
};

dpsInstallmentSchema.statics.findOverdue = function () {
  return this.find({
    status: 'PENDING',
    dueDate: {
      $lt: new Date(),
    },
  });
};

module.exports = mongoose.model('DPSInstallment', dpsInstallmentSchema);
