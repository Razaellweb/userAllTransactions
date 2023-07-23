export type EVMSupportedChains =
  | "eth"
  | "bsc"
  | "polygon"
  | "arbitrum"
  | "optimism"
  | "avalanche"
  | "fantom"
  | "cronos";

  export interface TokenInfo {
    token_address: string;
    name?: string;
    ownerName?: string;
    ownerAddr?: string;
    Networth?: number;
    symbol?: string;
    logo?: string;
    decimals?: number;
    balance: string;
    validated?: number;
    usdPrice?: number | null;
    chain?: string;
  }

  
type alchemyTransferCategory =
| "external"
| "internal"
| "token"
| "erc20"
| "erc721"
| "erc1155"
| "specialnft";

interface alchemyRawContract {
    value: string;
    address?: string;
    decimal: string;
  }


type alchemyERC1155Metadata = {
    tokenId: string;
    value: string;
  };
  
  export type ABI = Record<string, any>[];

export interface alchemyTransfer {
    blockNum: string;
    hash: string;
    from: string;
    uniqueId: string;
    to: string;
    value: string;
    asset: string;
    category: alchemyTransferCategory;
    tokenId?: string;
    erc1155Metadata?: alchemyERC1155Metadata[];
    rawContract: alchemyRawContract;
  }

  export type alchemyTransferFilterQuery = {
    fromBlock: string;
    toBlock?: string;
    fromAddress?: string;
    toAddress?: string;
    contractAddresses?: string[];
    category: alchemyTransferCategory[];
    order: "asc" | "desc";
    withMetadata: boolean;
    excludeZeroValue: boolean;
    maxCount: string;
    pageKey?: string;
  };

  export type SUPPORTED_NODES = "ALCHEMY" | "ETHERSCAN" | "INFURA" | "RPC";

  
export type NodeObject = {
    [key in SUPPORTED_NODES]?: string;
  };
  
  export interface Dictionary<T> {
    [key: string]: T;
  }

  export interface alchemyTransferWithMetadata extends alchemyTransfer {
    metadata?: {
      blockTimestamp: string;
    };
  }

  export type txAction = "sent" | "received";



  