import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";

// Map router names to fixed HMR ports
const hmrPorts: Record<string, number> = {
	client: 24678,
	server: 24679,
	"server-function": 24680,
	ssr: 24681,
};

export default defineConfig({
	ssr: false,
	vite: ({ router }) => ({
		plugins: [tailwindcss()],
		server: {
			// HMR through Caddy HTTPS proxy at https://localhost:8000
			port: 3000,
			strictPort: true,
			hmr: {
				// Fixed HMR ports per router (Vinxi 0.5.6+)
				// Caddy proxies /_build/_hmr/* to these ports
				port: hmrPorts[router] ?? 24682,
				path: `/_hmr/${router}`,
				host: "localhost",
				clientPort: 8000,
				protocol: "wss",
			},
		},
	}),
});
