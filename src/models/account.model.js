
import mongoose from "mongoose";

const { Schema } = mongoose;

const accountSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    accountType: {
      type: Schema.Types.ObjectId,
      ref: "AccountType",
      required: true,
      index: true,
    },

    accountNumber: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },

    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    currency: {
      type: String,
      default: "BDT",
      enum: ["BDT"],
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "ACTIVE",
        "FROZEN",
        "DORMANT",
        "CLOSED",
      ],
      default: "PENDING",
      index: true,
    },

    openedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    closedAt: {
      type: Date,
    },

    lastTransactionAt: {
      type: Date,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    remarks: {
      type: String,
      maxlength: 300,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);





/* ---------------------------------------
                INDEXES
---------------------------------------- */



// admin reports
accountSchema.index({
  status: 1,
  accountType: 1,
});

// recent activity
accountSchema.index({
  lastTransactionAt: -1,
});

// one primary account per customer
accountSchema.index(
  {
    user: 1,
    isPrimary: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isPrimary: true,
    },
  }
);





/* ---------------------------------------
                VIRTUALS
---------------------------------------- */

accountSchema.virtual("isClosed").get(function () {
  return this.status === "CLOSED";
});

accountSchema.virtual("isActive").get(function () {
  return this.status === "ACTIVE";
});





/* ---------------------------------------
                PRE SAVE
---------------------------------------- */

accountSchema.pre("save", function (next) {
  if (this.status === "CLOSED" && !this.closedAt) {
    this.closedAt = new Date();
  }

  next();
});





/* ---------------------------------------
            INSTANCE METHODS
---------------------------------------- */

accountSchema.methods.deposit = function (amount) {
  if (amount <= 0)
    throw new Error("Invalid amount.");

  this.balance += amount;

  this.lastTransactionAt = new Date();

  return this.save();
};

accountSchema.methods.withdraw = function (amount) {
  if (amount <= 0)
    throw new Error("Invalid amount.");

  if (this.balance < amount)
    throw new Error("Insufficient balance.");

  this.balance -= amount;

  this.lastTransactionAt = new Date();

  return this.save();
};

accountSchema.methods.freeze = function () {
  this.status = "FROZEN";
  return this.save();
};

accountSchema.methods.activate = function () {
  this.status = "ACTIVE";
  return this.save();
};

accountSchema.methods.close = function () {
  this.status = "CLOSED";
  return this.save();
};





/* ---------------------------------------
            STATIC METHODS
---------------------------------------- */

accountSchema.statics.findByAccountNumber = function (
  accountNumber
) {
  return this.findOne({ accountNumber });
};

accountSchema.statics.findActive = function () {
  return this.find({
    status: "ACTIVE",
  });
};

accountSchema.statics.findByCustomer = function (
  userId
) {
  return this.find({
    user: userId,
  });
};





/* ---------------------------------------
            QUERY HELPERS
---------------------------------------- */

accountSchema.query.active = function () {
  return this.where({
    status: "ACTIVE",
  });
};

accountSchema.query.primary = function () {
  return this.where({
    isPrimary: true,
  });
};

accountSchema.query.byType = function (typeId) {
  return this.where({
    accountType: typeId,
  });
};





export default mongoose.model(
  "Account",
  accountSchema
);