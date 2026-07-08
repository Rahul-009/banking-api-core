import mongoose from 'mongoose';

const { Schema } = mongoose;

// Generic atomic counter, used to hand out race-safe sequence numbers
// (e.g. LedgerEntry.sequenceNo) via findOneAndUpdate's atomic $inc.
const counterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model('Counter', counterSchema);
