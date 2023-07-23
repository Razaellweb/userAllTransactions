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
exports.EVMNodeInquirer = exports.getNodeConnectionObject = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const getters_1 = require("../../getters");
const config_1 = require("../../config");
class EVMNodeInquirerError extends Error {
    constructor(message) {
        super(message);
        this.name = "EVMNodeInquirerError";
    }
}
function getNodeConnectionObject(chain) {
    if (chain == "bsc") {
        return {
            RPC: "https://bscrpc.com", //use RPC for bsc
        };
    }
    else if (chain == "avalanche") {
        return {
            RPC: "https://rpc.ankr.com/avalanche",
        };
    }
    else if (chain == "fantom") {
        return {
            RPC: "https://rpc.ankr.com/fantom",
        };
    }
    else if (chain == "cronos") {
        return {
            RPC: "https://evm-cronos.crypto.org",
        };
    }
    else {
        return {
            ALCHEMY: config_1.ALCHEMY_API_KEY,
        };
    }
}
exports.getNodeConnectionObject = getNodeConnectionObject;
class EVMNodeInquirer {
    constructor(chain, connectAtStart, contracts) {
        this.chain = chain;
        this.providerMapping = {};
        if (connectAtStart)
            this.connectToProviders(connectAtStart);
    }
    connectedToAnyNode() {
        return Object.keys(this.providerMapping).length != 0;
    }
    getConnectedNodes() {
        return Object.keys(this.providerMapping);
    }
    connectToProviders(nodes) {
        const chainMapping = {
            eth: "homestead",
            polygon: "matic",
            arbitrum: "arbitrum",
            optimism: "optimism",
        };
        this.providerMapping = {};
        Object.entries(nodes).forEach(([providerType, providerKey]) => {
            if (providerType == "RPC") {
                this.providerMapping[providerType] = new ethers_1.providers.JsonRpcProvider(providerKey);
            }
            else if (providerType == "ALCHEMY") {
                this.providerMapping[providerType] = new ethers_1.providers.AlchemyProvider(chainMapping[this.chain], providerKey);
            }
            else if (providerType == "INFURA") {
                this.providerMapping[providerType] = new ethers_1.providers.InfuraProvider(chainMapping[this.chain], providerKey);
            }
            else if (providerType == "ETHERSCAN") {
                this.providerMapping[providerType] = new ethers_1.providers.EtherscanProvider(chainMapping[this.chain], providerKey);
            }
            else {
                throw new EVMNodeInquirerError("Provided node provider not of accepted type");
            }
        });
    }
    _query(method, kwargs) {
        //Queries evm data by performing a query of the method across all defined nodes.The first node that gets a returned value is returned
        const providers = Object.values(this.providerMapping);
        if (providers.length == 0) {
            throw new EVMNodeInquirerError("No provider has been connected");
        }
        for (let i = 0; i < providers.length; i++) {
            try {
                const result = method(providers[i], kwargs);
                return result;
            }
            catch (error) {
                console.error(error);
                throw new EVMNodeInquirerError(error.message);
            }
        }
    }
    //To do use ethScanner Contract for multiple addresses
    static _getAccountBalance(provider, params) {
        return provider.getBalance(params.accountAddr);
    }
    getAccountBalance(accountAddr) {
        return this._query(EVMNodeInquirer._getAccountBalance, {
            accountAddr: accountAddr,
        });
    }
    static _getHistoricalAccountBalance(provider, params) {
        return provider.getBalance(params.accountAddr, params.blockTag);
    }
    getHistoricalAccountBalance(accountAddr, blockTag) {
        return this._query(EVMNodeInquirer._getHistoricalAccountBalance, {
            accountAddr: accountAddr,
            blockTag,
        });
    }
    static _getBlockByNumber(provider, params) {
        return provider.getBlock(params.blockTag);
    }
    getBlockByNumber(blockTag) {
        return this._query(EVMNodeInquirer._getBlockByNumber, {
            blockTag: blockTag,
        });
    }
    static _getLatestBlockNumber(provider) {
        return provider.getBlockNumber();
    }
    getLatestBlockNumber() {
        return this._query(EVMNodeInquirer._getLatestBlockNumber);
    }
    static _getTransactionByHash(provider, params) {
        return provider.getTransaction(params.txHash);
    }
    getTransactionByHash(txHash) {
        return this._query(EVMNodeInquirer._getTransactionByHash, { txHash });
    }
    static _getTransactionReceipt(provider, params) {
        return provider.getTransactionReceipt(params.txHash);
    }
    getTransactionReceipt(txHash) {
        return this._query(EVMNodeInquirer._getTransactionReceipt, { txHash });
    }
    static _callContract(provider, params) {
        //calls a contract method
        const { contractAddr, abi, methodName, methodParams, blockTag } = params;
        const contract = new ethers_1.Contract(contractAddr, abi, provider);
        const result = contract[methodName](...methodParams, {
            blockTag: blockTag,
        });
        return result;
    }
    callContract(contractAddr, abi, methodName, methodParams = [], blockTag) {
        return this._query(EVMNodeInquirer._callContract, {
            contractAddr,
            abi,
            methodName,
            methodParams,
            blockTag,
        });
    }
    static _getLogs(provider, params) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            //Queries the logs of an EVM contract
            const contractIface = new utils_1.Interface(params.abi);
            const eventId = contractIface.getEventTopic(params.eventName);
            const topics = params.topics.map((topic) => topic == null ? null : (0, utils_1.hexZeroPad)(topic, 32));
            var startBlock = params.fromBlock;
            var untilBlock = params.toBlock == "latest"
                ? (yield EVMNodeInquirer._getLatestBlockNumber(provider)) || 0
                : params.toBlock;
            const filter = {
                address: params.contractAddr,
                topics: [eventId, ...topics],
                toBlock: untilBlock,
                fromBlock: startBlock,
            };
            try {
                const logData = yield provider.getLogs(filter);
                return logData;
            }
            catch (error) {
                const errorMessage = JSON.parse(error.body).error.message ||
                    ((_a = error === null || error === void 0 ? void 0 : error.error) === null || _a === void 0 ? void 0 : _a.message) ||
                    ((_b = error === null || error === void 0 ? void 0 : error.data) === null || _b === void 0 ? void 0 : _b.message) ||
                    (error === null || error === void 0 ? void 0 : error.message);
                if (!errorMessage.includes("Log response size exceeded") &&
                    !errorMessage.includes("query returned more than 10000 results")) {
                    throw new EVMNodeInquirerError("Error fetching logs due to" + ((_c = error === null || error === void 0 ? void 0 : error.error) === null || _c === void 0 ? void 0 : _c.message));
                }
                yield (0, getters_1.sleep)(0.5);
                const middle = Math.floor((startBlock + untilBlock) / 2);
                const lowerPromise = EVMNodeInquirer._getLogs(provider, {
                    contractAddr: params.contractAddr,
                    abi: params.abi,
                    eventName: params.eventName,
                    topics: params.topics,
                    fromBlock: params.fromBlock,
                    toBlock: middle,
                });
                const upperPromise = EVMNodeInquirer._getLogs(provider, {
                    contractAddr: params.contractAddr,
                    abi: params.abi,
                    eventName: params.eventName,
                    topics: params.topics,
                    fromBlock: middle,
                    toBlock: params.toBlock,
                });
                const [lowerLog, upperLog] = yield Promise.all([
                    lowerPromise,
                    upperPromise,
                ]);
                return [...lowerLog, ...upperLog];
            }
        });
    }
    getLogs(eventName, topics, abi, contractAddr, fromBlock = 0, toBlock = "latest") {
        return this._query(EVMNodeInquirer._getLogs, {
            contractAddr,
            abi,
            eventName,
            topics,
            fromBlock,
            toBlock,
        });
    }
    getEventTimestamp(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const blockNumber = event.blockNumber;
            const block = yield this.getBlockByNumber(blockNumber);
            return block === null || block === void 0 ? void 0 : block.timestamp;
        });
    }
    callFunctionSpecficToCertainProvider(providerName, method, params) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const provider = this.providerMapping[providerName];
                return provider.send(method, params);
            }
            catch (error) {
                const errorMessage = JSON.parse(error.body).error.message ||
                    ((_a = error === null || error === void 0 ? void 0 : error.error) === null || _a === void 0 ? void 0 : _a.message) ||
                    ((_b = error === null || error === void 0 ? void 0 : error.data) === null || _b === void 0 ? void 0 : _b.message) ||
                    (error === null || error === void 0 ? void 0 : error.message);
                if (!errorMessage.includes("Unable to complete request at this time") ||
                    !errorMessage.includes("Internal JSON-RPC error.")) {
                    throw new EVMNodeInquirerError("Error calling method " + method + "on " + providerName);
                }
                yield (0, getters_1.sleep)(2);
                return this.callFunctionSpecficToCertainProvider(providerName, method, params);
            }
        });
    }
}
exports.EVMNodeInquirer = EVMNodeInquirer;
