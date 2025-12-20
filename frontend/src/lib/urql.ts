import {
  cacheExchange,
  fetchExchange,
  subscriptionExchange,
  Client,
} from "@urql/solid";
import { createClient as createWSClient } from "graphql-ws";
import { GRAPHQL_ENDPOINT, WS_ENDPOINT } from "./constants";

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
