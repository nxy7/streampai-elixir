import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

import { loadEnv } from "vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const env = loadEnv("development", projectRoot, "");
const frontendPort = parseInt(env.FRONTEND_PORT || "3000", 10);
const caddyPort = parseInt(env.CADDY_PORT || "8000", 10);

const hmrPorts: Record<string, number> = {
	client: parseInt(env.FRONTEND_HMR_CLIENT_PORT || "3001", 10),
	server: parseInt(env.FRONTEND_HMR_SERVER_PORT || "3002", 10),
	"server-function": parseInt(env.FRONTEND_HMR_SERVER_FUNCTION_PORT || "3003", 10),
	ssr: parseInt(env.FRONTEND_HMR_SSR_PORT || "3004", 10),
};

export default defineConfig({
	ssr: false,
	server: {
		prerender: {
			routes: ["/terms", "/privacy", "/support", "/contact"],
		},
	},
	vite: ({ router }: { router: string }) => ({
		plugins: [tailwindcss()],
		server: {
			port: frontendPort,
			strictPort: true,
			hmr: router === 'client' ? {
				port: hmrPorts[router],
				path: `/_hmr/${router}`,
							host: "localhost",
				clientPort: caddyPort,
							protocol: "wss",
			} : undefined,
		},
	}),
});
