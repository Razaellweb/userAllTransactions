"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const apollo_server_core_1 = require("apollo-server-core");
exports.typeDefs = (0, apollo_server_core_1.gql) `
  input UserInput {
    userAddr: String
    chain: String
  }
  type alchemyERC1155Metadata {
    tokenId: String
    value: String
  }
  type saleInfoType {
    addr: String!
    contractAddresses: [String!]
    txAmounts: [String]
  }
  type alchemyRawContract {
    value: String
    address: String
    decimal: String
  }
  type AlchemyTransfer {
    blockNum: String
    hash: String
    from: String
    uniqueId: String
    to: String
    value: String
    asset: String
    category: String
    event: String
    tokenId: String
    erc1155Metadata: [alchemyERC1155Metadata]
    rawContract: alchemyRawContract
    chain: String
    blockTimestamp: String
    action: String
    usdAmount: Float
  }
  type TransferHistoryData {
    transfersTotal: Int
    transfers: [AlchemyTransfer]
  }
  type Query {
    userAllTransactions(
      input: UserInput
      pageNumber: Int
      pageLimit: Int
    ): TransferHistoryData
  }
`;
