import { createClient } from "graphql-ws";
import WebSocket from "ws";

const client = createClient({
  url: "ws://localhost:4000/graphql",
  webSocketImpl: WebSocket,
});

const listen = async (id: number) => {
  const subscription = client.iterate({
    query: "subscription { greetings }",
  });

  let i = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const event of subscription) {
    console.log(`id=${id}, i=${i++}`);
  }
};
const start = async () => {
  await Promise.race(Array.from({ length: 10 }).map((_, id) => listen(id)));
};

start().then(
  () => {},
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
