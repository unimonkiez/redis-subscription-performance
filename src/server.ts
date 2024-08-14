// import { subscribe } from "graphql";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { createServer } from "http";
import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import bodyParser from "body-parser";
import { schema as schemaCodeFirst } from "./schema-code-first";
import { schema as schemaStlFirst } from "./schema-stl-first";
import { createContext, createGraphqlContext } from "./context";

const PORT = 4_000;

const IS_CODE_FIRST = process.env.CODE_FIRST === "true";
const schema = IS_CODE_FIRST ? schemaCodeFirst : schemaStlFirst;

export const start = async () => {
  const ctx = await createContext();
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
      context: async (data) => {
        const promise = mapOfUserPromises.get(data.extra.socket);
        if (!promise) {
          throw new Error("Should find the promise of connection");
        }
        return createGraphqlContext(
          ctx,
          (data?.connectionParams ?? {}) as Record<string, string>,
          promise,
        );
      },
      // async subscribe(...args) {
      //   const result = await subscribe(...args);
      //   if ("next" in result) {
      //     // is an async iterable, augment the next method to handle thrown errors
      //     const originalNext = result.next;
      //     (result as any).next = async () => {
      //       try {
      //         return await originalNext();
      //       } catch (err) {
      //         if (err instanceof Error) {
      //           return {
      //             value: {
      //               errors: [
      //                 {
      //                   ...err,
      //                   message: err.message,
      //                   path:
      //                     args[0].document.definitions[0].loc !== undefined
      //                       ? args[0].document.definitions[0].loc.source.body.split(
      //                           "\n",
      //                         )
      //                       : [],
      //                   extensions: {
      //                     code: err.name,
      //                     stacktrace: err.stack
      //                       ? err.stack.split("\n")
      //                       : [`${err.name}: ${err.message}`],
      //                     ...(err as any).extensions,
      //                   },
      //                 },
      //               ],
      //             },
      //           };
      //         }
      //         // gracefully handle the error thrown from the next method
      //       }
      //     };
      //   }
      //   return result;
      // },
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
  app.use(
    "/graphql",
    bodyParser.json(),
    expressMiddleware(server, {
      context: async (data) =>
        createGraphqlContext(
          ctx,
          data.req.headers as Record<string, string>,
          undefined,
        ),
    }),
  );

  httpServer.listen(PORT, () => {
    console.log(
      `Server is now running on http://localhost:${PORT}/graphql using ${IS_CODE_FIRST ? "code" : "stl"} first approach`,
    );
  });
};

start().then(
  () => {},
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
