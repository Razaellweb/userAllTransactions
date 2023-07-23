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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alchemyTransfers = void 0;
const getters_1 = require("../../getters");
class alchemyTransfers {
    constructor(nodeInquirer) {
        this.nodeInquirer = nodeInquirer;
    }
    //fetches asset transfer of a single page
    _getSinglePageAssetTransfers(transferFilterQuery) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.nodeInquirer.callFunctionSpecficToCertainProvider("ALCHEMY", "alchemy_getAssetTransfers", [transferFilterQuery]);
                return data;
            }
            catch (error) {
                console.error("Error fetching transfer due to" +
                    (((_a = error === null || error === void 0 ? void 0 : error.error) === null || _a === void 0 ? void 0 : _a.message) ||
                        ((_b = error === null || error === void 0 ? void 0 : error.data) === null || _b === void 0 ? void 0 : _b.message) ||
                        (error === null || error === void 0 ? void 0 : error.message) ||
                        error.body.message));
                return {
                    pageKey: transferFilterQuery.pageKey,
                    transfers: [],
                };
            }
        });
    }
    //fetches all pages of a particular transfer Query
    getAllPagesAssetTransfers(transferFilterQuery, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            var result;
            var filter = transferFilterQuery;
            var pageKey;
            const allTransfers = [];
            do {
                if (limit && allTransfers.length >= limit) {
                    console.log("broke out of loop");
                    break;
                }
                result = yield this._getSinglePageAssetTransfers(filter);
                pageKey = result.pageKey;
                allTransfers.push(...result.transfers.filter((transfer) => transfer.asset && transfer.value && transfer.from != transfer.to));
                filter = Object.assign(Object.assign({}, transferFilterQuery), { pageKey: pageKey });
                yield (0, getters_1.sleep)(0.25);
            } while (pageKey);
            return allTransfers.map((transfer) => {
                const { metadata } = transfer, alchemyTransferWithoutMetadata = __rest(transfer, ["metadata"]);
                return Object.assign(Object.assign({}, alchemyTransferWithoutMetadata), { chain: this.nodeInquirer.chain, uniqueId: `${this.nodeInquirer.chain}:${alchemyTransferWithoutMetadata.uniqueId}`, blockTimestamp: new Date((metadata === null || metadata === void 0 ? void 0 : metadata.blockTimestamp) || 0) });
            });
        });
    }
    //fetches all asset transfers by Query
    getAssetTransfers(category, addr, fromBlock = "0x0", toBlock = "latest", limit, excludeZeroValue = true, contractAddresses, addrActions = ["received", "sent"], order = "desc", maxCount = "0x3e8", withMetadata = true) {
        return __awaiter(this, void 0, void 0, function* () {
            category = [...new Set(category)]; //remove duplicates incase there are multiple
            addrActions = [...new Set(addrActions)]; //remove duplicates incase there are multiple
            if (addrActions.length == 0) {
                return this.getAllPagesAssetTransfers({
                    fromBlock: fromBlock,
                    toBlock: toBlock,
                    category: category,
                    order: order,
                    maxCount,
                    withMetadata,
                    contractAddresses,
                    excludeZeroValue,
                }, limit);
            }
            const [receivedTransfers, sentTransfers] = yield Promise.all(addrActions.map((action) => this.getAllPagesAssetTransfers({
                fromAddress: action == "sent" ? addr : undefined,
                toAddress: action == "received" ? addr : undefined,
                fromBlock: fromBlock,
                toBlock: toBlock,
                category: category,
                order: order,
                maxCount,
                withMetadata,
                contractAddresses,
                excludeZeroValue,
            }, limit)));
            return receivedTransfers
                .concat(sentTransfers)
                .sort((txn1, txn2) => -(new Date(txn1.blockTimestamp).getTime() -
                new Date(txn2.blockTimestamp).getTime()));
        });
    }
}
exports.alchemyTransfers = alchemyTransfers;
