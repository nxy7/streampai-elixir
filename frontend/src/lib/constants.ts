export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
export const GRAPHQL_ENDPOINT = `${BACKEND_URL}/graphql`;
export const WS_ENDPOINT = `ws://${BACKEND_URL.replace(/^https?:\/\//, "")}/graphql/websocket`;
