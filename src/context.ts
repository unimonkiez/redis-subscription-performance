export const createContext = async () => {
  return {
    connection: "mock",
  };
};

export type Context = Awaited<Awaited<ReturnType<typeof createContext>>>;


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
        email: "user.email",
        client_id: 2,
        role: {
          id: 3,
          name: "user.role.name",
          privileges: [],
        },
      };
    },
    endConnectionPromise,
  });


export type GraphqlContext = Awaited<Awaited<ReturnType<typeof createGraphqlContext>>>;