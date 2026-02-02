import { createRouter } from "@tanstack/solid-router";
import type { RouterContext } from "./routes/__root";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		// Initial context - will be populated by root route's beforeLoad
		context: {
			user: null,
		} satisfies RouterContext,
	});
	return router;
}

declare module "@tanstack/solid-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
