"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    userAddr: {
        type: String,
        required: true,
        unique: true,
    },
    mailCount: {
        type: Number,
        default: 0,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
    },
    referred: [
        {
            type: String,
        },
    ],
    isSuperUser: {
        type: Boolean,
        default: false,
    },
    alchemyTransfers: [
        {
            type: "ObjectId",
            ref: "alchemyTransferModel",
        },
    ],
    transferLastUpdated: {
        type: Map,
        of: String,
        default: {},
    },
});
UserSchema.method("getReferralPoints", function () {
    const pointsPerRef = 10;
    const user = this;
    if (user) {
        const actualReffered = user.getActualReferred();
        return actualReffered.length * pointsPerRef;
    }
    else {
        return 0;
    }
});
//handle bug scenario of same address reffered multiple times and referring self
UserSchema.method("getActualReferred", function () {
    const user = this;
    if (user) {
        const referred = user.referred;
        const actualReffered = [...new Set(referred)].filter((addr) => addr != user.userAddr);
        return actualReffered;
    }
    else {
        return 0;
    }
});
UserSchema.method("getTotalPoints", function () {
    const user = this;
    if (user) {
        const defaultPoints = 25;
        const referredPoints = user.getReferralPoints();
        const superuserPoints = user.isSuperUser ? 500 : 0;
        return defaultPoints + referredPoints + superuserPoints;
    }
    else {
        return 0;
    }
});
exports.UserModel = (0, mongoose_1.model)("UserModel", UserSchema);
