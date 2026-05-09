import mongoose from "mongoose"

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [ true, "Token is required to blacklist" ],
        unique: [ true, "Token is already blacklisted" ]
    }
}, {
    timestamps: true
})

//
tokenBlacklistSchema.index({createdAt: 1}, {
    expireAfterSeconds: 60*60*24*1  // 1 day
})

const tokenBlackListModel = mongoose.model("tokenBlackList", tokenBlacklistSchema);
export default tokenBlackListModel