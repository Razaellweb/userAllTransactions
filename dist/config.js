"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moralisAPI = exports.ALCHEMY_API_KEY = exports.ALCHEMY_URL = exports.MORALIS_API_KEY = exports.PORT = exports.uri = void 0;
const dotenv_1 = require("dotenv");
const axios_1 = __importDefault(require("axios"));
(0, dotenv_1.config)();
exports.uri = String(process.env.MONGO_CONNECTION_STRING);
exports.PORT = parseInt(process.env.PORT) || 8000;
exports.MORALIS_API_KEY = String(process.env.MORALIS_API_KEY);
exports.ALCHEMY_URL = String(process.env.ALCHEMY_URL);
exports.ALCHEMY_API_KEY = exports.ALCHEMY_URL.split("v2/")[1];
exports.moralisAPI = axios_1.default.create({
    baseURL: "https://deep-index.moralis.io/api/v2/",
    headers: { accept: "application/json", "X-API-Key": exports.MORALIS_API_KEY },
});
