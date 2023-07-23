import { Schema, model, Document, Model } from "mongoose";

export interface tokenTxnLog {
  //   contractAddress: string;
  //   contract: NFTContract;
  //   estimatedConfirmedAt: Date;

  //   transactionValue: string;
  //   gas: string;
  transaction_hash: string;
  address: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
  from_address: string;
  to_address: string;
  value: string;
  log_index: number;
}

export interface nativeTxnLog {
  hash: string;
  nonce: string;
  input: string;
  gas: string;
  gas_price: string;
  transaction_index: string;
  address: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
  from_address: string;
  to_address: string;
  value: string;
}

export class nativeTxn implements nativeTxnLog {
  public hash = "";
  public nonce = "";
  public input = "";
  public gas = "";
  public gas_price = "";
  public transaction_index = "";
  public address = "";
  public block_timestamp = "";
  public block_number = "";
  public block_hash = "";
  public from_address = "";
  public to_address = "";
  public value = "";
}

export interface tokenPortfolio extends Document {
  userAddr: string;
  tokenTxnLogs: Map<string, tokenTxnLog[]>;
  nativeTxnLogs: Map<string, nativeTxnLog[]>;
  tokenlastUpdated: Map<string, Date>;
  nativelastUpdated: Map<string, Date>;
}
export interface tokenPortfolioModel extends Model<tokenPortfolio> {}

const tokenPortfolioSchema = new Schema<tokenPortfolio>({
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

export const tokenPortfolioModel = model<tokenPortfolio, tokenPortfolioModel>(
  "tokenPortfolioModel",
  tokenPortfolioSchema
);
