import { Contract, providers } from "ethers";
import { Interface, hexZeroPad, id } from "ethers/lib/utils";
import { sleep } from "../../getters";
import { EVMContract } from "./contracts";
import { ALCHEMY_API_KEY } from "../../config";
import {
  ABI,
  Dictionary,
  EVMSupportedChains,
  NodeObject,
  SUPPORTED_NODES,
} from "../../types";

class EVMNodeInquirerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EVMNodeInquirerError";
  }
}

export function getNodeConnectionObject(chain: EVMSupportedChains): NodeObject {
  if (chain == "bsc") {
    return {
      RPC: "https://bscrpc.com", //use RPC for bsc
    };
  } else if (chain == "avalanche") {
    return {
      RPC: "https://rpc.ankr.com/avalanche",
    };
  } else if (chain == "fantom") {
    return {
      RPC: "https://rpc.ankr.com/fantom",
    };
  } else if (chain == "cronos") {
    return {
      RPC: "https://evm-cronos.crypto.org",
    };
  } else {
    return {
      ALCHEMY: ALCHEMY_API_KEY,
    };
  }
}

export class EVMNodeInquirer {
  chain: EVMSupportedChains;
  providerMapping: {
    [key in SUPPORTED_NODES]?:
      | providers.JsonRpcProvider
      | providers.BaseProvider;
  };

  constructor(
    chain: EVMSupportedChains,
    connectAtStart?: NodeObject,
    contracts?: EVMContract[]
  ) {
    this.chain = chain;
    this.providerMapping = {};
    if (connectAtStart) this.connectToProviders(connectAtStart);
  }

  connectedToAnyNode() {
    return Object.keys(this.providerMapping).length != 0;
  }
  getConnectedNodes() {
    return Object.keys(this.providerMapping);
  }
  connectToProviders(nodes: NodeObject) {
    const chainMapping: Dictionary<string> = {
      eth: "homestead",
      polygon: "matic",
      arbitrum: "arbitrum",
      optimism: "optimism",
    };
    this.providerMapping = {};
    Object.entries(nodes).forEach(([providerType, providerKey]) => {
      if (providerType == "RPC") {
        this.providerMapping[providerType] = new providers.JsonRpcProvider(
          providerKey
        );
      } else if (providerType == "ALCHEMY") {
        this.providerMapping[providerType] = new providers.AlchemyProvider(
          chainMapping[this.chain],
          providerKey
        );
      } else if (providerType == "INFURA") {
        this.providerMapping[providerType] = new providers.InfuraProvider(
          chainMapping[this.chain],
          providerKey
        );
      } else if (providerType == "ETHERSCAN") {
        this.providerMapping[providerType] = new providers.EtherscanProvider(
          chainMapping[this.chain],
          providerKey
        );
      } else {
        throw new EVMNodeInquirerError(
          "Provided node provider not of accepted type"
        );
      }
    });
  }
  _query<T, Y>(
    method: (provider: providers.Provider, kwargs: Y) => Promise<T>,
    kwargs?: Y
  ): Promise<T> | undefined {
    //Queries evm data by performing a query of the method across all defined nodes.The first node that gets a returned value is returned
    const providers = Object.values(this.providerMapping);
    if (providers.length == 0) {
      throw new EVMNodeInquirerError("No provider has been connected");
    }
    for (let i = 0; i < providers.length; i++) {
      try {
        const result = method(providers[i], kwargs as Y);
        return result;
      } catch (error: any) {
        console.error(error);
        throw new EVMNodeInquirerError(error.message);
      }
    }
  }

  //To do use ethScanner Contract for multiple addresses
  static _getAccountBalance(
    provider: providers.Provider,
    params: { accountAddr: string }
  ) {
    return provider.getBalance(params.accountAddr);
  }

  getAccountBalance(accountAddr: string) {
    return this._query(EVMNodeInquirer._getAccountBalance, {
      accountAddr: accountAddr,
    });
  }

  static _getHistoricalAccountBalance(
    provider: providers.Provider,
    params: { accountAddr: string; blockTag: providers.BlockTag }
  ) {
    return provider.getBalance(params.accountAddr, params.blockTag);
  }

  getHistoricalAccountBalance(
    accountAddr: string,
    blockTag: providers.BlockTag
  ) {
    return this._query(EVMNodeInquirer._getHistoricalAccountBalance, {
      accountAddr: accountAddr,
      blockTag,
    });
  }

  static _getBlockByNumber(
    provider: providers.Provider,
    params: { blockTag: providers.BlockTag }
  ) {
    return provider.getBlock(params.blockTag);
  }
  getBlockByNumber(blockTag: providers.BlockTag) {
    return this._query(EVMNodeInquirer._getBlockByNumber, {
      blockTag: blockTag,
    });
  }

  static _getLatestBlockNumber(provider: providers.Provider) {
    return provider.getBlockNumber();
  }

  getLatestBlockNumber() {
    return this._query(EVMNodeInquirer._getLatestBlockNumber);
  }

  static _getTransactionByHash(
    provider: providers.Provider,
    params: { txHash: string }
  ) {
    return provider.getTransaction(params.txHash);
  }

  getTransactionByHash(txHash: string) {
    return this._query(EVMNodeInquirer._getTransactionByHash, { txHash });
  }

  static _getTransactionReceipt(
    provider: providers.Provider,
    params: { txHash: string }
  ) {
    return provider.getTransactionReceipt(params.txHash);
  }

  getTransactionReceipt(txHash: string) {
    return this._query(EVMNodeInquirer._getTransactionReceipt, { txHash });
  }

  static _callContract(
    provider: providers.Provider,
    params: {
      contractAddr: string;
      abi: ABI;
      methodName: string;
      methodParams: any[];
      blockTag?: providers.BlockTag;
    }
  ) {
    //calls a contract method
    const { contractAddr, abi, methodName, methodParams, blockTag } = params;
    const contract = new Contract(contractAddr, abi, provider);
    const result = contract[methodName](...methodParams, {
      blockTag: blockTag,
    });
    return result;
  }

  callContract<T>(
    contractAddr: string,
    abi: ABI,
    methodName: string,
    methodParams: any[] = [],
    blockTag?: providers.BlockTag
  ) {
    return this._query<
      T,
      {
        contractAddr: string;
        abi: ABI;
        methodName: string;
        methodParams: any[];
        blockTag?: providers.BlockTag;
      }
    >(EVMNodeInquirer._callContract, {
      contractAddr,
      abi,
      methodName,
      methodParams,
      blockTag,
    });
  }
  static async _getLogs(
    provider: providers.Provider,
    params: {
      contractAddr?: string;
      abi: ABI;
      eventName: string;
      topics: string[];
      fromBlock: number;
      toBlock: providers.BlockTag;
    }
  ): Promise<providers.Log[]> {
    //Queries the logs of an EVM contract
    const contractIface = new Interface(params.abi);
    const eventId = contractIface.getEventTopic(params.eventName);
    const topics = params.topics.map((topic) =>
      topic == null ? null : hexZeroPad(topic, 32)
    );
    var startBlock = params.fromBlock;
    var untilBlock =
      params.toBlock == "latest"
        ? (await EVMNodeInquirer._getLatestBlockNumber(provider)) || 0
        : (params.toBlock as number);
    const filter = {
      address: params.contractAddr,
      topics: [eventId, ...topics],
      toBlock: untilBlock,
      fromBlock: startBlock,
    };
    try {
      const logData = await provider.getLogs(filter);
      return logData;
    } catch (error: any) {
      const errorMessage: string =
        JSON.parse(error.body).error.message ||
        error?.error?.message ||
        error?.data?.message ||
        error?.message;

      if (
        !errorMessage.includes("Log response size exceeded") &&
        !errorMessage.includes("query returned more than 10000 results")
      ) {
        throw new EVMNodeInquirerError(
          "Error fetching logs due to" + error?.error?.message
        );
      }
      await sleep(0.5);
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
      const [lowerLog, upperLog] = await Promise.all([
        lowerPromise,
        upperPromise,
      ]);
      return [...lowerLog, ...upperLog];
    }
  }

  getLogs(
    eventName: string,
    topics: string[],
    abi: ABI,
    contractAddr?: string,
    fromBlock: number = 0,
    toBlock: providers.BlockTag = "latest"
  ) {
    return this._query(EVMNodeInquirer._getLogs, {
      contractAddr,
      abi,
      eventName,
      topics,
      fromBlock,
      toBlock,
    });
  }

  async getEventTimestamp(event: providers.Log) {
    const blockNumber = event.blockNumber;
    const block = await this.getBlockByNumber(blockNumber);
    return block?.timestamp;
  }

  async callFunctionSpecficToCertainProvider<T>(
    providerName: SUPPORTED_NODES,
    method: string,
    params: any[]
  ): Promise<T> {
    try {
      const provider = this.providerMapping[
        providerName
      ] as providers.JsonRpcProvider;
      return provider.send(method, params);
    } catch (error: any) {
      const errorMessage: string =
        JSON.parse(error.body).error.message ||
        error?.error?.message ||
        error?.data?.message ||
        error?.message;
      if (
        !errorMessage.includes("Unable to complete request at this time") ||
        !errorMessage.includes("Internal JSON-RPC error.")
      ) {
        throw new EVMNodeInquirerError(
          "Error calling method " + method + "on " + providerName
        );
      }
      await sleep(2);
      return this.callFunctionSpecficToCertainProvider(
        providerName,
        method,
        params
      );
    }
  }

  //To do add multicall and erc20 and erc721 data fetcher
}
