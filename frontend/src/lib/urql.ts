import {
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
  Client,
} from "@urql/solid";
import { createClient as createWSClient } from "graphql-ws";

const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";
const WS_ENDPOINT = "ws://localhost:4000/graphql/websocket";

const wsClient = createWSClient({
  url: WS_ENDPOINT,
});

export const client = new Client({
  url: GRAPHQL_ENDPOINT,
  exchanges: [
    cacheExchange,
    fetchExchange,
    subscriptionExchange({
      forwardSubscription(request) {
        const input = { ...request, query: request.query || "" };
        return {
          subscribe(sink) {
            const unsubscribe = wsClient.subscribe(input, sink);
            return { unsubscribe };
          },
        };
      },
    }),
  ],
  fetchOptions: {
    credentials: "include",
  },
});
