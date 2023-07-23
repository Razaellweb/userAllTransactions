"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenPortfolioModel = exports.nativeTxn = void 0;
const mongoose_1 = require("mongoose");
class nativeTxn {
    constructor() {
        this.hash = "";
        this.nonce = "";
        this.input = "";
        this.gas = "";
        this.gas_price = "";
        this.transaction_index = "";
        this.address = "";
        this.block_timestamp = "";
        this.block_number = "";
        this.block_hash = "";
        this.from_address = "";
        this.to_address = "";
        this.value = "";
    }
}
exports.nativeTxn = nativeTxn;
const tokenPortfolioSchema = new mongoose_1.Schema({
    userAddr: {
        type: String,
        required: true,
        unique: true,
    },
    tokenTxnLogs: {
        type: Map,
        of: Object,
    },
    nativeTxnLogs: {
        type: Map,
        of: Object,
    },
    tokenlastUpdated: {
        type: Map,
        of: Date,
    },
    nativelastUpdated: {
        type: Map,
        of: Date,
    },
});
exports.tokenPortfolioModel = (0, mongoose_1.model)("tokenPortfolioModel", tokenPortfolioSchema);
