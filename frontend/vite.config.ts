import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/solid-start/plugin/vite";
import { defineConfig, loadEnv } from "vite";
import viteSolid from "vite-plugin-solid";
import tsConfigPaths from "vite-tsconfig-paths";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const env = loadEnv("development", projectRoot, "");
const frontendPort = Number.parseInt(env.FRONTEND_PORT || "3000", 10);
const caddyPort = Number.parseInt(env.CADDY_PORT || "8000", 10);

export default defineConfig({
	server: {
		port: frontendPort,
		strictPort: true,
		hmr: {
			port: Number.parseInt(env.FRONTEND_HMR_CLIENT_PORT || "3001", 10),
			path: "/_hmr/client",
			host: "localhost",
			clientPort: caddyPort,
			protocol: "wss",
		},
	},
	plugins: [
		tailwindcss(),
		tsConfigPaths({ projects: ["./tsconfig.json"] }),
		tanstackStart({
			spa: {
				enabled: true,
				prerender: {
					outputPath: "/index",
				},
			},
			router: {
				autoCodeSplitting: false,
			},
		}),
		viteSolid({ ssr: true }),
	],
});
