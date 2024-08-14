import * as gql from "./resolvers-generated";

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

export const resolvers: gql.Resolvers = {
  Query: {
    async test() {
      await sleep(100);
      return true;
    },
  },
  Subscription: {
    test: {
      subscribe: async function* () {
        let counter = 0;
        while (true) {
          yield {
            test: counter++,
          };
          await sleep(1000);
        }
      },
    },
    greetings: {
      subscribe: async function* (info, args, ctx) {
        while (true) {
          const shouldEnd = await Promise.race([
            sleep(1).then(() => false),
            ctx.endConnectionPromise!.then(() => true),
          ]);
          if (shouldEnd) {
            break;
          }
          yield {
            greetings: getId(),
          };
        }
      },
    },
  },
};
