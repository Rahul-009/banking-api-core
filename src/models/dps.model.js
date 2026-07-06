const mongoose = require("mongoose");

const { Schema } = mongoose;

const dpsSchema = new Schema(
  {
    account: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },

    product: {
      type: Schema.Types.ObjectId,
      ref: "DepositProduct",
      required: true,
      index: true,
    },

    installmentAmount: {
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

    totalInstallments: {
      type: Number,
      required: true,
    },

    paidInstallments: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDeposited: {
      type: Schema.Types.Decimal128,
      default: 0,
    },

    maturityAmount: {
      type: Schema.Types.Decimal128,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    nextDueDate: {
      type: Date,
      required: true,
      index: true,
    },

    maturityDate: {
      type: Date,
      required: true,
      index: true,
    },

    autoDebit: {
      type: Boolean,
      default: false,
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
      enum: [
        "ACTIVE",
        "COMPLETED",
        "MATURED",
        "DEFAULTED",
        "CLOSED",
      ],
      default: "ACTIVE",
      index: true,
    },

    remarks: String,
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    versionKey: false,
  }
);

/* --------------------------
        INDEXES
--------------------------- */

dpsSchema.index({ account: 1, status: 1 });

dpsSchema.index({ nextDueDate: 1, status: 1 });

dpsSchema.index({ maturityDate: 1 });

/* --------------------------
        VIRTUALS
--------------------------- */

dpsSchema.virtual("remainingInstallments").get(function () {
  return this.totalInstallments - this.paidInstallments;
});

dpsSchema.virtual("completionPercentage").get(function () {
  return (
    (this.paidInstallments / this.totalInstallments) * 100
  ).toFixed(2);
});

/* --------------------------
    INSTANCE METHODS
--------------------------- */

dpsSchema.methods.canReceiveInstallment = function () {
  return this.status === "ACTIVE";
};

dpsSchema.methods.markCompleted = function () {
  this.status = "COMPLETED";
  return this.save();
};

dpsSchema.methods.markMatured = function () {
  this.status = "MATURED";
  return this.save();
};

dpsSchema.methods.markDefaulted = function () {
  this.status = "DEFAULTED";
  return this.save();
};

/* --------------------------
    STATIC METHODS
--------------------------- */

dpsSchema.statics.findActive = function () {
  return this.find({ status: "ACTIVE" });
};

dpsSchema.statics.findDueToday = function () {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return this.find({
    nextDueDate: {
      $gte: start,
      $lt: end,
    },
    status: "ACTIVE",
  });
};

module.exports = mongoose.model("DPS", dpsSchema);