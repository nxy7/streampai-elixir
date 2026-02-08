import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const env = loadEnv("development", projectRoot, "");

const hmrPort = Number.parseInt(env.FRONTEND_HMR_PORT || "3001", 10);
const caddyPort = Number.parseInt(env.CADDY_PORT || "8000", 10);

export default defineConfig({
	ssr: false,
	devOverlay: false,
	server: {
		static: true,
	},
	vite: ({ router }) => ({
		plugins: [tailwindcss(), tsConfigPaths({ projects: ["./tsconfig.json"] })],
		resolve: {
			dedupe: ["solid-js", "solid-js/web", "solid-js/store"],
		},
		server: {
			// Only the client router needs HMR. Vinxi runs each router's Vite in
			// middlewareMode, so HMR must bind to its own port. Caddy proxies the
			// WebSocket upgrade on /_build/_hmr to that port, providing TLS.
			hmr:
				router === "client"
					? {
							port: hmrPort,
							path: "/_hmr",
							clientPort: caddyPort,
							protocol: "wss",
						}
					: false,
		},
	}),
});
