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
exports.TransactionHistory = void 0;
const nodeInquirer_1 = require("../../chains/evm/nodeInquirer");
const alchemyTransferModel_1 = require("../../models/alchemyTransferModel");
const moralis_1 = require("../../helpers/moralis");
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const nativeTokenData_1 = require("./nativeTokenData");
const alchemyTransfer_1 = require("../../chains/evm/alchemyTransfer");
const userModel_1 = require("../../models/userModel");
class MoralisTxnHistoryFetcher {
    getErc20Transfers(address, chain = "Eth", from_date, from_block) {
        return __awaiter(this, void 0, void 0, function* () {
            const transfers = yield (0, moralis_1.getTokenTransferByAddrSinceTimestamp)(address, chain, undefined, from_block, 5000);
            const uniqueTokens = [
                ...new Set(transfers.map((transfer) => transfer.address.toLowerCase())),
            ];
            const tokenAddrToMetadata = {};
            const chunkSize = 50;
            for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
                const chunkAddr = uniqueTokens.slice(i, i + chunkSize);
                yield Promise.all(chunkAddr.map((addr) => __awaiter(this, void 0, void 0, function* () {
                    tokenAddrToMetadata[addr] = yield (0, moralis_1.getTokenMetadata)(addr, chain);
                })));
            }
            return transfers.map((transfer) => ({
                chain: chain.toLowerCase(),
                blockTimestamp: new Date(transfer.block_timestamp),
                hash: transfer.transaction_hash,
                blockNum: ethers_1.BigNumber.from(transfer.block_number).toHexString(),
                from: transfer.from_address,
                to: transfer.to_address,
                category: "erc20",
                rawContract: {
                    address: transfer.address,
                    value: ethers_1.BigNumber.from(transfer.value).toHexString(),
                    decimal: ethers_1.BigNumber.from(tokenAddrToMetadata[transfer.address.toLowerCase()].decimals).toHexString(),
                },
                asset: tokenAddrToMetadata[transfer.address].symbol,
                uniqueId: `${chain.toLowerCase()}:${transfer.transaction_hash.toLowerCase()}:log:${transfer.log_index}`,
                value: (0, utils_1.formatUnits)(ethers_1.BigNumber.from(transfer.value), tokenAddrToMetadata[transfer.address].decimals).toString(),
            }));
        });
    }
    getNativeTransfers(address, chain, from_date, from_block) {
        return __awaiter(this, void 0, void 0, function* () {
            const transfers = yield (0, moralis_1.getNativeTransferByAddrSinceTimestamp)(address, chain, undefined, from_block, 5000);
            return transfers
                .filter((transfer) => Number(transfer.value) > 0)
                .map((transfer) => ({
                chain: chain.toLowerCase(),
                blockTimestamp: new Date(transfer.block_timestamp),
                hash: transfer.hash,
                from: transfer.from_address,
                category: "external",
                to: transfer.to_address,
                asset: nativeTokenData_1.supportedChainsTonativeTokenData[chain.toLowerCase()].symbol,
                blockNum: ethers_1.BigNumber.from(transfer.block_number).toHexString(),
                rawContract: {
                    address: undefined,
                    value: ethers_1.BigNumber.from(transfer.value).toHexString(),
                    decimal: "0x12",
                },
                value: (0, utils_1.formatEther)(ethers_1.BigNumber.from(transfer.value)).toString(),
                uniqueId: `${chain.toLowerCase()}:${transfer.hash}:external`,
            }));
        });
    }
    getAllTransfers(addr, chain, from_block) {
        return __awaiter(this, void 0, void 0, function* () {
            const [erc20Transfers, nativeTransfers] = yield Promise.all([
                this.getErc20Transfers(addr, chain, undefined, from_block),
                this.getNativeTransfers(addr, chain, undefined, from_block),
            ]);
            return erc20Transfers
                .concat(nativeTransfers)
                .sort((txn1, txn2) => -(new Date(txn1.blockTimestamp).getTime() -
                new Date(txn2.blockTimestamp).getTime()));
        });
    }
}
class TransactionHistory {
    constructor() {
        this.alchemyTransferModel = alchemyTransferModel_1.alchemyTransferModel;
        this.userModel = userModel_1.UserModel;
    }
    updateTxnHistoryOfAddrByChain(addr, chain) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeInquirer = new nodeInquirer_1.EVMNodeInquirer(chain, (0, nodeInquirer_1.getNodeConnectionObject)(chain));
            var fromBlock, toBlock, fetchedTxns;
            var user = yield this.userModel.findOne({
                userAddr: addr.toLowerCase(),
            });
            // .populate<{
            //   alchemyTransfers: Document<alchemyTransferwithTimestamp>[];
            // }>({
            //   path: "alchemyTransfers",
            // });
            if (!user) {
                const createdUser = yield this.userModel.create({
                    userAddr: addr.toLowerCase(),
                });
                user = createdUser;
                // .populate<{
                //   alchemyTransfers: Document<alchemyTransferwithTimestamp>[];
                // }>({
                //   path: "alchemyTransfers",
                // });
            }
            fromBlock = "0x0";
            toBlock = "latest";
            if (nodeInquirer.chain == "bsc" ||
                nodeInquirer.chain == "avalanche" ||
                nodeInquirer.chain == "cronos" ||
                nodeInquirer.chain == "fantom") {
                fromBlock = ethers_1.BigNumber.from(fromBlock).toNumber();
                const moralisHistoryFetcher = new MoralisTxnHistoryFetcher();
                fetchedTxns = yield moralisHistoryFetcher.getAllTransfers(addr, chain, fromBlock);
                // console.log(fetchedTxns)
            }
            else {
                fetchedTxns = yield new alchemyTransfer_1.alchemyTransfers(nodeInquirer).getAssetTransfers(["external", "erc20"], addr, fromBlock, toBlock, 5000);
                // console.log(fetchedTxns)
            }
            if (!fetchedTxns || fetchedTxns.length == 0) {
                return;
            }
            const newLength = (user.alchemyTransfers.length || 0) + fetchedTxns.length;
            const amtToRemove = newLength - 20000;
            const txnsToRemove = amtToRemove > 0
                ? user.alchemyTransfers
                    .map((tranfer) => tranfer._id)
                    .slice(-amtToRemove)
                : [];
            const chunkSize = 2000;
            const txnIds = [];
            for (let i = 0; i < fetchedTxns.length; i += chunkSize) {
                const chunkFetchedTxn = fetchedTxns.slice(i, i + chunkSize);
                const chunkTxnIds = yield Promise.all(chunkFetchedTxn.map((txn) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        var foundTxn = yield this.alchemyTransferModel.findOne({
                            uniqueId: txn.uniqueId,
                        });
                        if (!foundTxn) {
                            foundTxn = yield this.alchemyTransferModel.create(txn);
                        }
                        return foundTxn._id;
                    }
                    catch (error) {
                        console.error("Error fetching or creating transfer document because" +
                            error.message);
                    }
                })));
                txnIds.push(...chunkTxnIds.filter((id) => id));
            }
            for (let i = 0; i < ((txnsToRemove === null || txnsToRemove === void 0 ? void 0 : txnsToRemove.length) || 0); i += chunkSize) {
                const chunkTxnsToRemove = txnsToRemove === null || txnsToRemove === void 0 ? void 0 : txnsToRemove.slice(i, i + chunkSize);
                yield this.userModel.findOneAndUpdate({
                    userAddr: addr.toLowerCase(),
                }, {
                    $pullAll: {
                        alchemyTransfers: chunkTxnsToRemove || [],
                    },
                });
                yield Promise.all((chunkTxnsToRemove || []).map((transfer) => this.alchemyTransferModel.findByIdAndDelete(transfer)));
            }
            for (let i = 0; i < txnIds.length; i += chunkSize) {
                const chunkTxnIds = txnIds.slice(i, i + chunkSize);
                yield this.userModel.findOneAndUpdate({
                    userAddr: addr.toLowerCase(),
                }, {
                    $addToSet: {
                        alchemyTransfers: { $each: chunkTxnIds },
                    },
                }, { new: true });
            }
            user.transferLastUpdated.set(chain.toLowerCase(), fetchedTxns[0].blockNum);
            yield user.save();
        });
    }
    getLatestTxnHistory(addr, chain) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updateTxnHistoryOfAddrByChain(addr, chain);
            const transfers = (_a = (yield this.userModel
                .findOne({
                userAddr: addr.toLowerCase(),
            })
                .populate({
                path: "alchemyTransfers",
            }))) === null || _a === void 0 ? void 0 : _a.alchemyTransfers;
            if (!transfers) {
                return [];
            }
            return transfers
                .filter((transfer) => transfer.chain.toLowerCase() == chain.toLowerCase())
                .sort((txn1, txn2) => -(new Date(txn1 === null || txn1 === void 0 ? void 0 : txn1.blockTimestamp).getTime() -
                new Date(txn2 === null || txn2 === void 0 ? void 0 : txn2.blockTimestamp).getTime()));
        });
    }
}
exports.TransactionHistory = TransactionHistory;
