import { isAddress } from "ethers/lib/utils";
import { utils, BigNumber } from "ethers";

import { TransactionHistory } from "./products/portfolio/transactionHistory";

export const resolvers = {
    saleInfoType: {
        txAmounts(saleInfoType: any) {
          return saleInfoType.txAmounts.map((amount: BigNumber) =>
            utils.formatEther(amount)
          );
        },
      },
  Query: {
    async userAllTransactions(
      _: null,
      args: {
        input: { userAddr: string; chain: string };
        pageNumber: number;
        pageLimit: number;
      },
    ) {
      const { input, pageLimit, pageNumber } = args;
      if (!input.userAddr || !isAddress(input.userAddr)) {
        throw new Error("Input a valid address");
      }
      const transactionHistory = new TransactionHistory();
      const addrTransfers = await transactionHistory.getLatestTxnHistory(
        input.userAddr.toLowerCase(),
        input.chain.toLowerCase()
      );
      return {
        transfers:
          pageNumber >= 0 && pageLimit > 0
            ? addrTransfers
                .slice(pageNumber * pageLimit, (pageNumber + 1) * pageLimit)
                .map((txn) => ({
                  //@ts-ignore
                  ...txn._doc,
                  action:
                    input.userAddr.toLowerCase() == txn.from.toLowerCase()
                      ? "sent"
                      : "received",
                }))
            : addrTransfers.map((txn) => ({
                //@ts-ignore
                ...txn._doc,
                action:
                  input.userAddr.toLowerCase() == txn.from.toLowerCase()
                    ? "sent"
                    : "received",
              })),
        transfersTotal: addrTransfers.length,
      };
    },
  },
};
