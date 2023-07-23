import { Schema, model, Document, Model, Types } from "mongoose";
import { alchemyTransfer } from "../types";

export interface alchemyTransferwithTimestamp extends alchemyTransfer {
  chain: string;
  blockTimestamp: Date;
}

export interface alchemyTransferModel
  extends Model<alchemyTransferwithTimestamp> {}

const alchemyTransferSchema = new Schema<alchemyTransferwithTimestamp>({
  blockNum: {
    type: String,
    required: true,
  },
  chain: {
    type: String,
    required: true,
  },
  uniqueId: {
    type: String,
    required: true,
    unique: true,
  },
  hash: {
    type: String,
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  asset: {
    type: String,
    required: true,
  },
  tokenId: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  erc1155Metadata: {
    type: Object,
  },
  rawContract: {
    type: Object,
  },
  blockTimestamp: {
    type: Date,
  },
});

export const alchemyTransferModel = model<alchemyTransferwithTimestamp>(
  "alchemyTransferModel",
  alchemyTransferSchema
);
