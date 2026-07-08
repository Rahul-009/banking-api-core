import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, 'Token is required to blacklist'],
      unique: [true, 'Token is already blacklisted'],
    },
    // Set from the token's own `exp` claim so short-lived access tokens
    // and long-lived refresh tokens each expire from the blacklist at the
    // right time, instead of sharing one fixed TTL.
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Blacklist a JWT until its own expiry, decoded without verifying the
// signature (callers may want to blacklist a token they haven't/can't
// re-verify, e.g. an already-expired one on logout).
tokenBlacklistSchema.statics.blacklist = async function (token) {
  const decoded = jwt.decode(token);
  const expiresAt = decoded?.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 15 * 60 * 1000);
  return this.create({ token, expiresAt });
};

const tokenBlackListModel = mongoose.model('tokenBlackList', tokenBlacklistSchema);
export default tokenBlackListModel;
