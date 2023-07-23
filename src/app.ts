import express from "express";
import { json } from "body-parser";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} from "apollo-server-core";
import { PORT, uri } from "./config";
import { resolvers } from "./resolver";
import { typeDefs } from "./schema";

mongoose
  .connect(uri)
  .then(() => console.log("DB Connection Successfull!"))
  .catch((err) => {
    console.log(err);
  });

async function startApolloServer(typeDef: any, resolvers: any) {
  const app = express();
  // const client = await initRedis();
  const httpServer = http.createServer(app).setTimeout(1000 * 60 * 10);

  const server = new ApolloServer({
    typeDefs: typeDef,
    resolvers: resolvers,
    cache: "bounded",
    introspection: true,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  await server.start();
  app.use(cors());
  app.use(json({ limit: "50mb" }));

  app.get("/", async function (req, res) {
    res.status(200).send({
      status: "Go to path /graphql for requests",
    });
  });
  server.applyMiddleware({ app });
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );

  console.log("Server started on Port " + PORT);
}

startApolloServer(typeDefs, resolvers);
