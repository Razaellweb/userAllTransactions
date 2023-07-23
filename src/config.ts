import { config } from "dotenv";
import axios from "axios";
config();

export const uri = String(process.env.MONGO_CONNECTION_STRING);
export const PORT: number = parseInt(process.env.PORT as string) || 8000;
export const MORALIS_API_KEY = String(process.env.MORALIS_API_KEY);
export const ALCHEMY_URL = String(process.env.ALCHEMY_URL);
export const ALCHEMY_API_KEY = ALCHEMY_URL.split("v2/")[1];



export const moralisAPI = axios.create({
    baseURL: "https://deep-index.moralis.io/api/v2/",
    headers: { accept: "application/json", "X-API-Key": MORALIS_API_KEY },
  });