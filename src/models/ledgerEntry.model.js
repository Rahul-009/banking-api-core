import mongoose from 'mongoose';

const { Schema } = mongoose;

const ledgerEntrySchema = new Schema(
  {
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      immutable: true,
    },

    account: {
      type: Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
      immutable: true,
      index: true,
    },

    entryType: {
      type: String,
      enum: ['DEBIT', 'CREDIT'],
      required: true,
      immutable: true,
    },

    amount: {
      type: Schema.Types.Decimal128,
      required: true,
      immutable: true,
    },

    runningBalance: {
      type: Schema.Types.Decimal128,
      required: true,
      immutable: true,
    },

    currency: {
      type: String,
      default: 'BDT',
      immutable: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 300,
      immutable: true,
    },

    sequenceNo: {
      type: Number,
      required: true,
      immutable: true,
    },

    reversedBy: {
      type: Schema.Types.ObjectId,
      ref: 'LedgerEntry',
      default: null,
      immutable: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* -----------------------------
            INDEXES
------------------------------ */

ledgerEntrySchema.index({
  account: 1,
  createdAt: -1,
});

ledgerEntrySchema.index({
  transaction: 1,
});

ledgerEntrySchema.index({
  sequenceNo: 1,
});

/* -----------------------------
        IMMUTABILITY
------------------------------ */

function preventModification() {
  throw new Error('Ledger entries are immutable and cannot be modified.');
}

ledgerEntrySchema.pre('save', function () {
  if (!this.isNew) {
    throw new Error('Ledger entries are immutable.');
  }
});

[
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'findOneAndReplace',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
].forEach((hook) => {
  ledgerEntrySchema.pre(hook, preventModification);
});

export default mongoose.model('LedgerEntry', ledgerEntrySchema);
