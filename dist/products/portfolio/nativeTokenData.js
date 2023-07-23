"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportedChainsTonativeTokenData = void 0;
exports.supportedChainsTonativeTokenData = {
    eth: {
        name: "Ether",
        symbol: "ETH",
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBRkLzaNUEOFz92NJbPeh9kcxgDBS7L0AIVw&usqp=CAU",
        decimals: 18,
        token_address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", //use wrapped token address for tokenaddress for price fetching
    },
    bsc: {
        name: "Binance Coin",
        symbol: "BNB",
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT39q8jdJh5cPwTF5TpbzA8jA-BMT3zG8Z-pg&usqp=CAU",
        decimals: 18,
        token_address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", //use wrapped token address for tokenaddress for price fetching
    },
    polygon: {
        name: "Matic",
        symbol: "MATIC",
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkej3_RbN9Q9RVSYrpdWCgr3c6M7HAVuACmnh-utDkxg&s",
        token_address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        decimals: 18,
    },
    avalanche: {
        name: "Avalanche",
        symbol: "AVAX",
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSreMXB91QOANrXiz8P6sOaFg6co1JLOYB20orOjHOyog&s",
        decimals: 18,
        token_address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7n", //use wrapped token address for tokenaddress for price fetching,
    },
    arbitrum: {
        name: "Ether Arbitrum",
        symbol: "ETH-ARB",
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBRkLzaNUEOFz92NJbPeh9kcxgDBS7L0AIVw&usqp=CAU",
        decimals: 18,
        token_address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", //use wrapped token address for tokenaddress for price fetching
    },
    fantom: {
        name: "Fantom Token",
        symbol: "FTM",
        logo: "https://seeklogo.com/images/F/fantom-ftm-logo-3566C53917-seeklogo.com.png",
        decimals: 18,
        token_address: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83", //use wrapped token address for tokenaddress for price fetching
    },
    optimism: {
        name: "Ether Optimism",
        symbol: "ETH-OP",
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRBRkLzaNUEOFz92NJbPeh9kcxgDBS7L0AIVw&usqp=CAU",
        decimals: 18,
        token_address: "0x4200000000000000000000000000000000000006", //use wrapped token address for tokenaddress for price fetching
    },
    cronos: {
        name: "Cronos",
        symbol: "CRO",
        logo: "https://icodrops.com/wp-content/uploads/2017/12/oCw2s3GI_400x400.jpg",
        decimals: 18,
        token_address: "0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23", //use wrapped token address for tokenaddress for price fetching
    },
};
