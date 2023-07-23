import { AxiosResponse } from "axios";
import { moralisAPI } from "../config";
import { sleep } from "../getters";
import { nativeTxnLog, tokenTxnLog } from "../models/tokenPortfolio";

export interface NFTInfo {
  token_address: string;
  token_id: string;
  amount: string;
  owner_of: string;
  token_hash: string;
  block_number_minted: string;
  block_number: string;
  contract_type: "ERC721" | "ERC1155";
  name: string;
  symbol: string;
  token_uri: string;
  metadata: string;
  last_token_uri_sync: string;
  last_metadata_sync: string;
  minter_address: string;
}

export interface TokenInfo {
  token_address: string;
  name?: string;
  ownerName?: string;
  ownerAddr?: string;
  Networth: number;
  symbol?: string;
  logo?: string;
  decimals?: number;
  balance: string;
  validated?: number;
  usdPrice?: number | null;
  chain: string;
}

export async function getTokenMetadata(
  tokenAddr: string,
  chain: string = "Eth"
) {
  try {
    const tokenMetadataResponse: AxiosResponse<TokenInfo[]> =
      await moralisAPI.get(`erc20/metadata`, {
        params: {
          chain: chain.toLowerCase(),
          addresses: tokenAddr,
        },
      });

    return tokenMetadataResponse.data.map((tokenData: any) => {
      return {
        ...tokenData,
        decimals: Number(tokenData.decimals),
        token_address: tokenData.address,
      };
    })[0];
  } catch (error) {
    return {
      token_address: tokenAddr,
      decimals: 0,
      name: "",
      symbol: "",
      logo: "",
      chain: chain,
    };
  }
}

export async function getTokenTransferByAddrSinceTimestamp(
  address: string,
  chain: string = "Eth",
  from_date?: String,
  from_block?: number,
  limit: number = 400000
) {
  const allTransfers: tokenTxnLog[] = [];
  try {
    var cursor;
    do {
      if (allTransfers.length >= limit) {
        break;
      }
      var transfers: AxiosResponse<{ cursor: string; result: tokenTxnLog[] }> =
        await moralisAPI.get(`${address}/erc20/transfers`, {
          params: {
            chain: chain.toLowerCase(),
            from_date: from_date,
            from_block: from_block,
            limit: 100,
            cursor: cursor,
          },
        });

      cursor = transfers.data.cursor;
      allTransfers.push(...transfers.data.result);
      await sleep(0.3);
    } while (cursor !== null);
    return allTransfers;
  } catch (error: any) {
    console.error("Error from Moralis history fetcher " + error.message);
    return allTransfers;
  }
}

export async function getNativeTransferByAddrSinceTimestamp(
  address: string,
  chain: string = "Eth",
  from_date?: String,
  from_block?: number,
  limit: number = 400000
) {
  const allTransfers: nativeTxnLog[] = [];
  var cursor;
  do {
    if (allTransfers.length >= limit) {
      break;
    }
    var transfers: AxiosResponse<{ cursor: string; result: nativeTxnLog[] }> =
      await moralisAPI.get(`${address}`, {
        params: {
          chain: chain.toLowerCase(),
          from_date: from_date,
          from_block: from_block,
          limit: 100,
          cursor: cursor,
        },
      });

    cursor = transfers.data.cursor;
    allTransfers.push(...transfers.data.result);
    await sleep(0.3);
  } while (cursor !== null);
  return allTransfers;
}
