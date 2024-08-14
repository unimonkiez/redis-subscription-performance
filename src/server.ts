import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { GraphQLSchema, GraphQLObjectType, GraphQLString } from "graphql";

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
  const server = new WebSocketServer({
    port: 4000,
    path: "/graphql",
  });

  useServer({ schema }, server);

  console.log("Listening to port 4000");
};

start().then(
  () => {},
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
