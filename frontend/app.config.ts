import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const env = loadEnv("development", projectRoot, "");

const caddyPort = Number.parseInt(env.CADDY_PORT || "8000", 10);

export default defineConfig({
  ssr: false,
  devOverlay: false,
  server: {
    static: true,
  },
  vite: {
    plugins: [tailwindcss(), tsConfigPaths({ projects: ["./tsconfig.json"] })],
    resolve: {
      dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
    },

    server: {
      hmr: {
        protocol: "wss",
        clientPort: caddyPort,
      },
    },
  },
});
