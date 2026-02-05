import { Link, createFileRoute } from "@tanstack/solid-router";
import Counter from "~/components/Counter";

export const Route = createFileRoute("/about")({
	component: About,
});

function About() {
	return (
		<main class="mx-auto p-4 text-center text-neutral-900">
			<h1 class="max-6-xs my-16 font-thin text-6xl text-sky-700 uppercase">
				About Page
			</h1>
			<Counter />
			<p class="mt-8">
				Visit{" "}
				<a
					class="text-sky-600 hover:underline"
					href="https://solidjs.com"
					rel="noopener"
					target="_blank">
					solidjs.com
				</a>{" "}
				to learn how to build Solid apps.
			</p>
			<p class="my-4">
				<Link class="text-sky-600 hover:underline" to="/">
					Home
				</Link>
				{" - "}
				<span>About Page</span>
			</p>
		</main>
	);
}
