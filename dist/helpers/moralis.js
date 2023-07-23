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
exports.getNativeTransferByAddrSinceTimestamp = exports.getTokenTransferByAddrSinceTimestamp = exports.getTokenMetadata = void 0;
const config_1 = require("../config");
const getters_1 = require("../getters");
function getTokenMetadata(tokenAddr, chain = "Eth") {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const tokenMetadataResponse = yield config_1.moralisAPI.get(`erc20/metadata`, {
                params: {
                    chain: chain.toLowerCase(),
                    addresses: tokenAddr,
                },
            });
            return tokenMetadataResponse.data.map((tokenData) => {
                return Object.assign(Object.assign({}, tokenData), { decimals: Number(tokenData.decimals), token_address: tokenData.address });
            })[0];
        }
        catch (error) {
            return {
                token_address: tokenAddr,
                decimals: 0,
                name: "",
                symbol: "",
                logo: "",
                chain: chain,
            };
        }
    });
}
exports.getTokenMetadata = getTokenMetadata;
function getTokenTransferByAddrSinceTimestamp(address, chain = "Eth", from_date, from_block, limit = 400000) {
    return __awaiter(this, void 0, void 0, function* () {
        const allTransfers = [];
        try {
            var cursor;
            do {
                if (allTransfers.length >= limit) {
                    break;
                }
                var transfers = yield config_1.moralisAPI.get(`${address}/erc20/transfers`, {
                    params: {
                        chain: chain.toLowerCase(),
                        from_date: from_date,
                        from_block: from_block,
                        limit: 100,
                        cursor: cursor,
                    },
                });
                cursor = transfers.data.cursor;
                allTransfers.push(...transfers.data.result);
                yield (0, getters_1.sleep)(0.3);
            } while (cursor !== null);
            return allTransfers;
        }
        catch (error) {
            console.error("Error from Moralis history fetcher " + error.message);
            return allTransfers;
        }
    });
}
exports.getTokenTransferByAddrSinceTimestamp = getTokenTransferByAddrSinceTimestamp;
function getNativeTransferByAddrSinceTimestamp(address, chain = "Eth", from_date, from_block, limit = 400000) {
    return __awaiter(this, void 0, void 0, function* () {
        const allTransfers = [];
        var cursor;
        do {
            if (allTransfers.length >= limit) {
                break;
            }
            var transfers = yield config_1.moralisAPI.get(`${address}`, {
                params: {
                    chain: chain.toLowerCase(),
                    from_date: from_date,
                    from_block: from_block,
                    limit: 100,
                    cursor: cursor,
                },
            });
            cursor = transfers.data.cursor;
            allTransfers.push(...transfers.data.result);
            yield (0, getters_1.sleep)(0.3);
        } while (cursor !== null);
        return allTransfers;
    });
}
exports.getNativeTransferByAddrSinceTimestamp = getNativeTransferByAddrSinceTimestamp;
