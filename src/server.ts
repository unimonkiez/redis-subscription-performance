import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { GraphQLSchema, GraphQLObjectType, GraphQLString } from "graphql";
import Redis from "ioredis";
import { Memorix } from "./memorix.generated";

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
        subscribe: async function* (info, args, ctx: { memorix: Memorix }) {
          // const topic = `abc`;
          // await ctx.redis.subscribe(topic);

          // let resolve = undefined as undefined | (() => void);
          // ctx.redis.on("message", (channel: string) => {
          //   if (channel === topic && resolve !== undefined) {
          //     resolve();
          //   }
          // });

          // let messagePromise = new Promise<void>((res) => {
          //   resolve = res;
          // });
          const sub = (await ctx.memorix.gpio.pubsub.hello.subscribe())
            .asyncIterator;
          while (true) {
            await sub.next();
            yield { greetings: getId() };
            // eslint-disable-next-line @typescript-eslint/no-loop-func
            // messagePromise = new Promise<void>((res) => {
            //   resolve = res;
            // });
          }
        },
      },
    },
  }),
});

const start = async () => {
  const memorix = new Memorix({ redisUrl: process.env.REDIS_URL! });
  await memorix.connect();
  const redis = new Redis(process.env.REDIS_URL!);
  const redisSub = redis.duplicate();
  const server = new WebSocketServer({
    port: 4000,
    path: "/graphql",
  });

  useServer(
    { schema, context: async () => ({ redis: redisSub, memorix }) },
    server,
  );

  console.log("Listening to port 4000");
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await sleep(1);
    await redis.publish("abc", "def");
    await memorix.gpio.pubsub.hello.publish(true);
  }
};

start().then(
  () => {},
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
