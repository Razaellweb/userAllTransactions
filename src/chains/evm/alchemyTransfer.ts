import { sleep } from "../../getters";
import { alchemyTransferwithTimestamp } from "../../models/alchemyTransferModel";
import {
  alchemyTransferCategory,
  alchemyTransferFilterQuery,
  alchemyTransferWithMetadata,
  txAction,
} from "../../types";
import { EVMNodeInquirer } from "./nodeInquirer";

export class alchemyTransfers {
  nodeInquirer: EVMNodeInquirer;
  constructor(nodeInquirer: EVMNodeInquirer) {
    this.nodeInquirer = nodeInquirer;
  }

  //fetches asset transfer of a single page
  private async _getSinglePageAssetTransfers(
    transferFilterQuery: alchemyTransferFilterQuery
  ) {
    try {
      const data =
        await this.nodeInquirer.callFunctionSpecficToCertainProvider<{
          pageKey?: string;
          transfers: alchemyTransferWithMetadata[];
        }>("ALCHEMY", "alchemy_getAssetTransfers", [transferFilterQuery]);

      return data;
    } catch (error: any) {
      console.error(
        "Error fetching transfer due to" +
          (error?.error?.message ||
            error?.data?.message ||
            error?.message ||
            error.body.message)
      );
      return {
        pageKey: transferFilterQuery.pageKey,
        transfers: [],
      };
    }
  }

  //fetches all pages of a particular transfer Query
  private async getAllPagesAssetTransfers(
    transferFilterQuery: alchemyTransferFilterQuery,
    limit?: number
  ): Promise<alchemyTransferwithTimestamp[]> {
    var result:
      | {
          pageKey?: string;
          transfers: alchemyTransferWithMetadata[];
        }
      | undefined;
    var filter = transferFilterQuery;
    var pageKey;
    const allTransfers: alchemyTransferWithMetadata[] = [];
    do {
      if (limit && allTransfers.length >= limit) {
        console.log("broke out of loop");
        break;
      }
      result = await this._getSinglePageAssetTransfers(filter);
      pageKey = result.pageKey;
      allTransfers.push(
        ...result.transfers.filter(
          (transfer) =>
            transfer.asset && transfer.value && transfer.from != transfer.to
        )
      );
      filter = {
        ...transferFilterQuery,
        pageKey: pageKey,
      };
      await sleep(0.25);
    } while (pageKey);
    return allTransfers.map((transfer) => {
      const { metadata, ...alchemyTransferWithoutMetadata } = transfer;
      return {
        ...alchemyTransferWithoutMetadata,
        chain: this.nodeInquirer.chain,
        uniqueId: `${this.nodeInquirer.chain}:${alchemyTransferWithoutMetadata.uniqueId}`,
        blockTimestamp: new Date(metadata?.blockTimestamp || 0),
      };
    });
  }

  //fetches all asset transfers by Query
  async getAssetTransfers(
    category: alchemyTransferCategory[],
    addr?: string,
    fromBlock: string = "0x0",
    toBlock: string = "latest",
    limit?: number,
    excludeZeroValue: boolean = true,
    contractAddresses?: string[],
    addrActions: txAction[] = ["received", "sent"],
    order: "asc" | "desc" = "desc",
    maxCount = "0x3e8",
    withMetadata: boolean = true
  ) {
    category = [...new Set(category)]; //remove duplicates incase there are multiple
    addrActions = [...new Set(addrActions)]; //remove duplicates incase there are multiple
    if (addrActions.length == 0) {
      return this.getAllPagesAssetTransfers(
        {
          fromBlock: fromBlock,
          toBlock: toBlock,
          category: category,
          order: order,
          maxCount,
          withMetadata,
          contractAddresses,
          excludeZeroValue,
        },
        limit
      );
    }
    const [receivedTransfers, sentTransfers] = await Promise.all(
      addrActions.map((action) =>
        this.getAllPagesAssetTransfers(
          {
            fromAddress: action == "sent" ? addr : undefined,
            toAddress: action == "received" ? addr : undefined,
            fromBlock: fromBlock,
            toBlock: toBlock,
            category: category,
            order: order,
            maxCount,
            withMetadata,
            contractAddresses,
            excludeZeroValue,
          },
          limit
        )
      )
    );
    return receivedTransfers
      .concat(sentTransfers)
      .sort(
        (txn1, txn2) =>
          -(
            new Date(txn1.blockTimestamp).getTime() -
            new Date(txn2.blockTimestamp).getTime()
          )
      );
  }
}
