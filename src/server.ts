import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { createServer } from "http";
import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import bodyParser from "body-parser";
import fs from "fs/promises";
import path from "path";
import { GraphQLSchema, GraphQLObjectType, GraphQLString } from "graphql";

const PORT = 4_000;

const sleep = (ms: number) =>
  new Promise((res) => {
    setTimeout(res, ms);
  });

const makeId = (length: number) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};

const ids = Array.from({ length: 20 }).map(() => makeId(1000));

const getId = () => {
  return ids[Math.floor(Math.random() * ids.length)];
};

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      hello: {
        type: GraphQLString,
        resolve: () => "world",
      },
    },
  }),
  subscription: new GraphQLObjectType({
    name: "Subscription",
    fields: {
      greetings: {
        type: GraphQLString,
        subscribe: async function* () {
          while (true) {
            await sleep(1);
            yield { greetings: getId() };
          }
        },
      },
    },
  }),
});

const start = async () => {
  const app = express();
  const httpServer = createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });
  const mapOfUserPromises = new Map<WebSocket, Promise<void>>();
  const serverCleanup = useServer(
    {
      schema,
      onConnect(data) {
        mapOfUserPromises.set(
          data.extra.socket,
          new Promise((res, rej) => {
            data.extra.socket.on("close", () => {
              const deleted = mapOfUserPromises.delete(data.extra.socket);
              if (deleted) {
                res();
              } else {
                rej();
              }
            });
          }),
        );
      },
    },
    wsServer,
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),

      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();
  app.use("/graphql", bodyParser.json(), expressMiddleware(server, {}));

  httpServer.listen(PORT, () => {
    console.log(`Server is now running on http://localhost:${PORT}/graphql`);
  });
};

start().then(
  () => {},
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
