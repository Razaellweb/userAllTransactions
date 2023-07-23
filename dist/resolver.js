"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const utils_1 = require("ethers/lib/utils");
const ethers_1 = require("ethers");
const transactionHistory_1 = require("./products/portfolio/transactionHistory");
exports.resolvers = {
    saleInfoType: {
        txAmounts(saleInfoType) {
            return saleInfoType.txAmounts.map((amount) => ethers_1.utils.formatEther(amount));
        },
    },
    Query: {
        userAllTransactions(_, args) {
            return __awaiter(this, void 0, void 0, function* () {
                const { input, pageLimit, pageNumber } = args;
                if (!input.userAddr || !(0, utils_1.isAddress)(input.userAddr)) {
                    throw new Error("Input a valid address");
                }
                const transactionHistory = new transactionHistory_1.TransactionHistory();
                const addrTransfers = yield transactionHistory.getLatestTxnHistory(input.userAddr.toLowerCase(), input.chain.toLowerCase());
                return {
                    transfers: pageNumber >= 0 && pageLimit > 0
                        ? addrTransfers
                            .slice(pageNumber * pageLimit, (pageNumber + 1) * pageLimit)
                            .map((txn) => (Object.assign(Object.assign({}, txn._doc), { action: input.userAddr.toLowerCase() == txn.from.toLowerCase()
                                ? "sent"
                                : "received" })))
                        : addrTransfers.map((txn) => (Object.assign(Object.assign({}, txn._doc), { action: input.userAddr.toLowerCase() == txn.from.toLowerCase()
                                ? "sent"
                                : "received" }))),
                    transfersTotal: addrTransfers.length,
                };
            });
        },
    },
};
