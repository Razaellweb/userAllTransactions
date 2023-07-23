import {
  EVMNodeInquirer,
  getNodeConnectionObject,
} from "../../chains/evm/nodeInquirer";
import {
  alchemyTransferModel,
  alchemyTransferwithTimestamp,
} from "../../models/alchemyTransferModel";
import { EVMSupportedChains, TokenInfo } from "../../types";
import {
  getNativeTransferByAddrSinceTimestamp,
  getTokenMetadata,
  getTokenTransferByAddrSinceTimestamp,
} from "../../helpers/moralis";
import { BigNumber } from "ethers";
import {
  formatEther,
  formatUnits,
} from "ethers/lib/utils";
import { supportedChainsTonativeTokenData } from "./nativeTokenData";
import { Document, Types } from "mongoose";
import { alchemyTransfers } from "../../chains/evm/alchemyTransfer";
import { UserModel } from "../../models/userModel";

class MoralisTxnHistoryFetcher {
  async getErc20Transfers(
    address: string,
    chain: string = "Eth",
    from_date?: String,
    from_block?: number
  ): Promise<alchemyTransferwithTimestamp[]> {
    const transfers = await getTokenTransferByAddrSinceTimestamp(
      address,
      chain,
      undefined,
      from_block,
      5000
    );
    const uniqueTokens = [
      ...new Set(transfers.map((transfer) => transfer.address.toLowerCase())),
    ];
    const tokenAddrToMetadata: Record<string, TokenInfo> = {};
    const chunkSize = 50;
    for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
      const chunkAddr = uniqueTokens.slice(i, i + chunkSize);
      await Promise.all(
        chunkAddr.map(async (addr) => {
          tokenAddrToMetadata[addr] = await getTokenMetadata(addr, chain);
        })
      );
    }

    return transfers.map((transfer) => ({
      chain: chain.toLowerCase(),
      blockTimestamp: new Date(transfer.block_timestamp),
      hash: transfer.transaction_hash,
      blockNum: BigNumber.from(transfer.block_number).toHexString(),
      from: transfer.from_address,
      to: transfer.to_address,
      category: "erc20",
      rawContract: {
        address: transfer.address,
        value: BigNumber.from(transfer.value).toHexString(),
        decimal: BigNumber.from(
          tokenAddrToMetadata[transfer.address.toLowerCase()].decimals
        ).toHexString(),
      },
      asset: tokenAddrToMetadata[transfer.address].symbol as string,
      uniqueId: `${chain.toLowerCase()}:${transfer.transaction_hash.toLowerCase()}:log:${transfer.log_index
        }`,
      value: formatUnits(
        BigNumber.from(transfer.value),
        tokenAddrToMetadata[transfer.address].decimals
      ).toString(),
    }));
  }

  async getNativeTransfers(
    address: string,
    chain: string,
    from_date?: String,
    from_block?: number
  ): Promise<alchemyTransferwithTimestamp[]> {
    const transfers = await getNativeTransferByAddrSinceTimestamp(
      address,
      chain,
      undefined,
      from_block,
      5000
    );

    return transfers
      .filter((transfer) => Number(transfer.value) > 0)
      .map((transfer) => ({
        chain: chain.toLowerCase(),
        blockTimestamp: new Date(transfer.block_timestamp),
        hash: transfer.hash,
        from: transfer.from_address,
        category: "external",
        to: transfer.to_address,
        asset: supportedChainsTonativeTokenData[chain.toLowerCase()].symbol,
        blockNum: BigNumber.from(transfer.block_number).toHexString(),
        rawContract: {
          address: undefined,
          value: BigNumber.from(transfer.value).toHexString(),
          decimal: "0x12",
        },
        value: formatEther(BigNumber.from(transfer.value)).toString(),
        uniqueId: `${chain.toLowerCase()}:${transfer.hash}:external`,
      }));
  }

  async getAllTransfers(addr: string, chain: string, from_block?: number) {
    const [erc20Transfers, nativeTransfers] = await Promise.all([
      this.getErc20Transfers(addr, chain, undefined, from_block),
      this.getNativeTransfers(addr, chain, undefined, from_block),
    ]);
    return erc20Transfers
      .concat(nativeTransfers)
      .sort(
        (txn1, txn2) =>
          -(
            new Date(txn1.blockTimestamp).getTime() -
            new Date(txn2.blockTimestamp).getTime()
          )
      );
  }
}

export class TransactionHistory {
  alchemyTransferModel: alchemyTransferModel;
  userModel: UserModel;
  constructor() {
    this.alchemyTransferModel = alchemyTransferModel;
    this.userModel = UserModel;
  }

  async updateTxnHistoryOfAddrByChain(
    addr: string,
    chain: string
  ): Promise<any> {
    const nodeInquirer = new EVMNodeInquirer(
      chain as EVMSupportedChains,
      getNodeConnectionObject(chain as EVMSupportedChains)
    );
    var fromBlock: string | number,
      toBlock: string,
      fetchedTxns: alchemyTransferwithTimestamp[];
    var user = await this.userModel.findOne({
      userAddr: addr.toLowerCase(),
    });
    // .populate<{
    //   alchemyTransfers: Document<alchemyTransferwithTimestamp>[];
    // }>({
    //   path: "alchemyTransfers",
    // });

    if (!user) {
      const createdUser = await this.userModel.create({
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
    if (
      nodeInquirer.chain == "bsc" ||
      nodeInquirer.chain == "avalanche" ||
      nodeInquirer.chain == "cronos" ||
      nodeInquirer.chain == "fantom"
    ) {
      fromBlock = BigNumber.from(fromBlock).toNumber();
      const moralisHistoryFetcher = new MoralisTxnHistoryFetcher();

      fetchedTxns = await moralisHistoryFetcher.getAllTransfers(
        addr,
        chain,
        fromBlock
      );
      // console.log(fetchedTxns)
    } else {
      fetchedTxns = await new alchemyTransfers(nodeInquirer).getAssetTransfers(
        ["external", "erc20"],
        addr,
        fromBlock,
        toBlock,
        5000
      );
      // console.log(fetchedTxns)
    }

    if (!fetchedTxns || fetchedTxns.length == 0) {
      return;
    }

    const newLength = (user.alchemyTransfers.length || 0) + fetchedTxns.length;
    const amtToRemove = newLength - 20000;
    const txnsToRemove =
      amtToRemove > 0
        ? user.alchemyTransfers
          .map((tranfer): Types.ObjectId => tranfer._id as any)
          .slice(-amtToRemove)
        : [];

    const chunkSize = 2000;
    const txnIds: (Types.ObjectId | undefined)[] = [];
    for (let i = 0; i < fetchedTxns.length; i += chunkSize) {
      const chunkFetchedTxn = fetchedTxns.slice(i, i + chunkSize);
      const chunkTxnIds = await Promise.all(
        chunkFetchedTxn.map(async (txn) => {
          try {
            var foundTxn = await this.alchemyTransferModel.findOne({
              uniqueId: txn.uniqueId,
            });
            if (!foundTxn) {
              foundTxn = await this.alchemyTransferModel.create(txn);
            }
            return foundTxn._id;
          } catch (error: any) {
            console.error(
              "Error fetching or creating transfer document because" +
              error.message
            );
          }
        })
      );
      txnIds.push(...chunkTxnIds.filter((id) => id));
    }

    for (let i = 0; i < (txnsToRemove?.length || 0); i += chunkSize) {
      const chunkTxnsToRemove = txnsToRemove?.slice(i, i + chunkSize);
      await this.userModel.findOneAndUpdate(
        {
          userAddr: addr.toLowerCase(),
        },
        {
          $pullAll: {
            alchemyTransfers: chunkTxnsToRemove || [],
          },
        }
      );
      await Promise.all(
        (chunkTxnsToRemove || []).map((transfer) =>
          this.alchemyTransferModel.findByIdAndDelete(transfer)
        )
      );
    }
    for (let i = 0; i < txnIds.length; i += chunkSize) {
      const chunkTxnIds = txnIds.slice(i, i + chunkSize);
      await this.userModel.findOneAndUpdate(
        {
          userAddr: addr.toLowerCase(),
        },
        {
          $addToSet: {
            alchemyTransfers: { $each: chunkTxnIds as Types.ObjectId[] },
          },
        },
        { new: true }
      );
    }
    user.transferLastUpdated.set(chain.toLowerCase(), fetchedTxns[0].blockNum);
    await user.save();
  }

  async getLatestTxnHistory(addr: string, chain: string) {
    await this.updateTxnHistoryOfAddrByChain(addr, chain);
    const transfers = (
      await this.userModel
        .findOne({
          userAddr: addr.toLowerCase(),
        })
        .populate<{
          alchemyTransfers: alchemyTransferwithTimestamp[];
        }>({
          path: "alchemyTransfers",
        })
    )?.alchemyTransfers;
    if (!transfers) {
      return [];
    }
    return transfers
      .filter((transfer) => transfer.chain.toLowerCase() == chain.toLowerCase())
      .sort(
        (txn1, txn2) =>
          -(
            new Date(txn1?.blockTimestamp).getTime() -
            new Date(txn2?.blockTimestamp).getTime()
          )
      );
  }
}
