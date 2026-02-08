import { useSearchParams } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { Show, createEffect, createMemo, createSignal } from "solid-js";
import { streamEventsCollection } from "~/lib/electric";
import { getEventsCollection } from "~/lib/useEventsCollection";

export default function FollowerCountOBS() {
	const [params] = useSearchParams();
	const userId = () => {
		const raw = params.userId;
		return Array.isArray(raw) ? raw[0] : raw;
	};

	const [followerCount, setFollowerCount] = createSignal(0);
	const [isAnimating, setIsAnimating] = createSignal(false);
	const [latestFollower, setLatestFollower] = createSignal<string | null>(null);
	const [processedFollowerIds, setProcessedFollowerIds] = createSignal<
		Set<string>
	>(new Set());

	const eventsQuery = useLiveQuery(() => {
		const id = userId();
		if (!id) return streamEventsCollection;
		return getEventsCollection(id);
	});

	const followEvents = createMemo(() => {
		const data = eventsQuery.data || [];
		return data
			.filter((e) => e.type === "follow")
			.sort(
				(a, b) =>
					new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime(),
			);
	});

	createEffect(() => {
		const events = followEvents();
		const processed = processedFollowerIds();

		events.forEach((event) => {
			if (processed.has(event.id)) return;

			const username = (event.data?.username as string) || event.author_id;
			setFollowerCount((prev) => prev + 1);
			setLatestFollower(username);
			setIsAnimating(true);
			setTimeout(() => {
				setIsAnimating(false);
				setTimeout(() => setLatestFollower(null), 3000);
			}, 300);

			setProcessedFollowerIds((prev) => new Set([...prev, event.id]));
		});
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
				<div class="min-w-[300px] rounded-2xl bg-linear-to-r from-pink-900/80 to-red-900/80 p-8 shadow-2xl backdrop-blur-sm">
					<div class="text-center">
						<div class="mb-2 text-2xl text-white">❤️ Followers</div>
						<div
							class="font-bold text-6xl text-white transition-all duration-300"
							classList={{
								"scale-125": isAnimating(),
								"scale-100": !isAnimating(),
							}}>
							{followerCount()}
						</div>
						<Show when={latestFollower()}>
							<div class="mt-4 animate-fade-in text-white text-xl">
								Latest: {latestFollower()}
							</div>
						</Show>
					</div>
				</div>
			</Show>
		</div>
	);
}
