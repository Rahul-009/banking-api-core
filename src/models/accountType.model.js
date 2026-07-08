import mongoose from "mongoose";

const { Schema } = mongoose;

const accountTypeSchema = new Schema(
  {
    code: {
      type: String, 
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      immutable: true,
      enum: [
        "SAVINGS",
        "CURRENT",
        "STUDENT",
        "WOMEN",
      ],
    },

    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    interestRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    minimumBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    monthlyMaintenanceFee: {
      type: Number,
      default: 0,
      min: 0,
    },

    minimumOpeningDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },

    dailyWithdrawalLimit: {
      type: Number,
      default: 50000,
      min: 0,
    },

    maximumDailyTransactions: {
      type: Number,
      default: 20,
      min: 1,
    },

    minimumAge: {
      type: Number,
      min: 0,
      max: 120,
    },

    maximumAge: {
      type: Number,
      min: 0,
      max: 120,
    },

    allowedGender: {
      type: String,
      enum: [
        "MALE",
        "FEMALE",
        "ANY",
      ],
      default: "ANY",
    },

    requiresStudentVerification: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    features: {
      atmCard: {
        type: Boolean,
        default: true,
      },

      chequeBook: {
        type: Boolean,
        default: false,
      },

      internetBanking: {
        type: Boolean,
        default: true,
      },

      mobileBanking: {
        type: Boolean,
        default: true,
      },

      smsAlert: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


/* ---------------------------------------
                VIRTUALS
---------------------------------------- */

accountTypeSchema.virtual("isStudent").get(function () {
  return this.code === "STUDENT";
});

accountTypeSchema.virtual("isWomen").get(function () {
  return this.code === "WOMEN";
});

accountTypeSchema.virtual("isSavings").get(function () {
  return this.code === "SAVINGS";
});

accountTypeSchema.virtual("isCurrent").get(function () {
  return this.code === "CURRENT";
});


/* ---------------------------------------
                PRE SAVE
---------------------------------------- */

accountTypeSchema.pre("save", function () {
  return this.code = this.code.toUpperCase();
});


/* ---------------------------------------
            INSTANCE METHODS
---------------------------------------- */

accountTypeSchema.methods.calculateInterest = function (balance) {
  return (balance * this.interestRate) / 100;
};

accountTypeSchema.methods.isEligible = function (user) {
  const age =
    Math.floor(
      (Date.now() - user.dateOfBirth.getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
    );

  if (this.minimumAge && age < this.minimumAge) {
    return false;
  }

  if (this.maximumAge && age > this.maximumAge) {
    return false;
  }

  if (this.allowedGender !== "ANY" && user.gender !== this.allowedGender) {
    return false;
  }

  if (this.requiresStudentVerification && user.occupation !== "Student") {
    return false;
  }

  return true;
};





/* ---------------------------------------
            STATIC METHODS
---------------------------------------- */

accountTypeSchema.statics.activeProducts =
  function () {
    return this.find({
      isActive: true,
    });
  };

accountTypeSchema.statics.findByCode =
  function (code) {
    return this.findOne({
      code: code.toUpperCase(),
    });
  };





/* ---------------------------------------
            QUERY HELPERS
---------------------------------------- */

accountTypeSchema.query.active =
  function () {
    return this.where({
      isActive: true,
    });
  };

export default mongoose.model(
  "AccountType",
  accountTypeSchema
);