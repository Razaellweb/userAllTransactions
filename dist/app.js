"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = __importDefault(require("http"));
const apollo_server_express_1 = require("apollo-server-express");
const apollo_server_core_1 = require("apollo-server-core");
const config_1 = require("./config");
const resolver_1 = require("./resolver");
const schema_1 = require("./schema");
mongoose_1.default
    .connect(config_1.uri)
    .then(() => console.log("DB Connection Successfull!"))
    .catch((err) => {
    console.log(err);
});
function startApolloServer(typeDef, resolvers) {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        // const client = await initRedis();
        const httpServer = http_1.default.createServer(app).setTimeout(1000 * 60 * 10);
        const server = new apollo_server_express_1.ApolloServer({
            typeDefs: typeDef,
            resolvers: resolvers,
            cache: "bounded",
            introspection: true,
            plugins: [
                (0, apollo_server_core_1.ApolloServerPluginDrainHttpServer)({ httpServer }),
                (0, apollo_server_core_1.ApolloServerPluginLandingPageLocalDefault)({ embed: true }),
            ],
        });
        yield server.start();
        app.use((0, cors_1.default)());
        app.use((0, body_parser_1.json)({ limit: "50mb" }));
        app.get("/", function (req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                res.status(200).send({
                    status: "Go to path /graphql for requests",
                });
            });
        });
        server.applyMiddleware({ app });
        yield new Promise((resolve) => httpServer.listen({ port: config_1.PORT }, resolve));
        console.log("Server started on Port " + config_1.PORT);
    });
}
startApolloServer(schema_1.typeDefs, resolver_1.resolvers);
