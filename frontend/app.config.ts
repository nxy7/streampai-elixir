import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	ssr: false,
	vite: {
		plugins: [tailwindcss()],
		server: {
			// HMR connects through Caddy proxy (now using HTTP/1.1 which supports WebSocket upgrade)
			hmr: {
				protocol: "wss",
				host: "localhost",
				clientPort: 8000,
			},
		},
	},
});
