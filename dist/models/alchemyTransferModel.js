"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alchemyTransferModel = void 0;
const mongoose_1 = require("mongoose");
const alchemyTransferSchema = new mongoose_1.Schema({
    blockNum: {
        type: String,
        required: true,
    },
    chain: {
        type: String,
        required: true,
    },
    uniqueId: {
        type: String,
        required: true,
        unique: true,
    },
    hash: {
        type: String,
        required: true,
    },
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    value: {
        type: String,
        required: true,
    },
    asset: {
        type: String,
        required: true,
    },
    tokenId: {
        type: String,
    },
    category: {
        type: String,
        required: true,
    },
    erc1155Metadata: {
        type: Object,
    },
    rawContract: {
        type: Object,
    },
    blockTimestamp: {
        type: Date,
    },
});
exports.alchemyTransferModel = (0, mongoose_1.model)("alchemyTransferModel", alchemyTransferSchema);
