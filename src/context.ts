import Redis from "ioredis";

export const createContext = async () => {
  const redis = new Redis(process.env.REDIS_URL!);

  return {
    redis,
  };
};

export type Context = Awaited<Awaited<ReturnType<typeof createContext>>>;

export type GraphqlContext = {
  getCurrUser: () => Promise<{
    id: number;
    name: string;
    email: string;
    client_id: number;
    role: {
      id: number;
      name: string;
      privileges: string[];
    };
  }>;
  endConnectionPromise?: Promise<void>;
} & Context;

export const createGraphqlContext = (
  ctx: Context,
  headers: Record<string, string>,
  endConnectionPromise?: Promise<void>,
) =>
  ({
    ...ctx,
    async getCurrUser() {
      const authorization = headers.authorization ?? headers.Authorization;

      return {
        id: 1,
        name: authorization,
        email: "email",
        client_id: 10,
        role: {
          id: 1,
          name: "role",
          privileges: [],
        },
      };
    },
    endConnectionPromise,
  }) as GraphqlContext;
