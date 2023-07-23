"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVMContract = void 0;
const utils_1 = require("ethers/lib/utils");
class EVMContract {
    constructor(address, abi, deployedBlock = 0) {
        this.abi = abi;
        this.address = address;
        this.deployedBlock = deployedBlock;
    }
    call(nodeInquirer, methodName, methodParams = [], blockTag) {
        return nodeInquirer.callContract(this.address, this.abi, methodName, methodParams, blockTag);
    }
    getLogsSinceDeployment(nodeInquirer, eventName, topics, toBlock = "latest") {
        return nodeInquirer.getLogs(eventName, topics, this.abi, this.address, this.deployedBlock, toBlock);
    }
    getLogs(nodeInquirer, eventName, topics, fromBlock, toBlock = "latest") {
        return nodeInquirer.getLogs(eventName, topics, this.abi, this.address, fromBlock, toBlock);
    }
    encodeFunctionData(methodName, methodParams) {
        const contractIface = new utils_1.Interface(this.abi);
        return contractIface.encodeFunctionData(methodName, methodParams);
    }
    decodeFunctionResult(methodName, methodResult) {
        const contractIface = new utils_1.Interface(this.abi);
        return contractIface.decodeFunctionResult(methodName, methodResult);
    }
    decodeLogs(eventData, eventTopics) {
        const contractIface = new utils_1.Interface(this.abi);
        return contractIface.parseLog({ data: eventData, topics: eventTopics });
    }
}
exports.EVMContract = EVMContract;
