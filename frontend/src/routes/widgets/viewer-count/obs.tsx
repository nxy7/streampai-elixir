import { useLiveQuery } from "@tanstack/solid-db";
import { createFileRoute, useSearch } from "@tanstack/solid-router";
import {
	type Accessor,
	Show,
	createEffect,
	createMemo,
	createSignal,
} from "solid-js";
import { streamEventsCollection } from "~/lib/electric";
import { getEventsCollection } from "~/lib/useEventsCollection";

export const Route = createFileRoute("/widgets/viewer-count/obs")({
	component: ViewerCountOBS,
});

function ViewerCountOBS() {
	const params = useSearch({ strict: false }) as Accessor<
		Record<string, string | string[] | undefined>
	>;
	const userId = () => {
		const raw = params().userId;
		return Array.isArray(raw) ? raw[0] : raw;
	};

	const [viewerCount, setViewerCount] = createSignal(0);
	const [isAnimating, setIsAnimating] = createSignal(false);

	const eventsQuery = useLiveQuery(() => {
		const id = userId();
		if (!id) return streamEventsCollection;
		return getEventsCollection(id);
	});

	const viewerEvents = createMemo(() => {
		const data = eventsQuery.data || [];
		return data.filter((e) => e.type === "viewer_count_update");
	});

	createEffect(() => {
		const events = viewerEvents();
		if (events.length > 0) {
			const latestEvent = events[events.length - 1];
			const newCount = (latestEvent.data?.count as number) || 0;
			setIsAnimating(true);
			setViewerCount(newCount);
			setTimeout(() => setIsAnimating(false), 300);
		}
	});

	return (
		<div class="flex h-screen w-full items-center justify-center overflow-hidden bg-transparent">
			<Show
				fallback={
					<div class="rounded-lg bg-red-500 p-4 text-2xl text-white">
						Error: No userId provided in URL parameters
					</div>
				}
				when={userId()}>
				<div class="rounded-2xl bg-linear-to-r from-blue-900/80 to-purple-900/80 p-8 shadow-2xl backdrop-blur-sm">
					<div class="text-center">
						<div class="mb-2 text-2xl text-white">👥 Viewers</div>
						<div
							class="font-bold text-6xl text-white transition-all duration-300"
							classList={{
								"scale-125": isAnimating(),
								"scale-100": !isAnimating(),
							}}>
							{viewerCount()}
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}
