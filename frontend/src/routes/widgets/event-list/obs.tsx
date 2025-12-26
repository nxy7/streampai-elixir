import { useSearchParams } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { createMemo, For, Show } from "solid-js";
import {
	createUserScopedStreamEventsCollection,
	streamEventsCollection,
} from "~/lib/electric";

type StreamEventType =
	| "donation"
	| "follower"
	| "subscriber"
	| "raid"
	| "cheer";

type Event = {
	id: string;
	type: StreamEventType;
	username: string;
	description: string;
	icon: string;
	color: string;
	timestamp: Date;
};

// Cache for user-scoped event collections
const eventCollections = new Map<
	string,
	ReturnType<typeof createUserScopedStreamEventsCollection>
>();
function getEventsCollection(userId: string) {
	let collection = eventCollections.get(userId);
	if (!collection) {
		collection = createUserScopedStreamEventsCollection(userId);
		eventCollections.set(userId, collection);
	}
	return collection;
}

export default function EventListOBS() {
	const [params] = useSearchParams();
	const rawUserId = params.userId;
	const userId = () => (Array.isArray(rawUserId) ? rawUserId[0] : rawUserId);
	const rawMaxEvents = params.maxEvents;
	const maxEvents = () =>
		parseInt(
			(Array.isArray(rawMaxEvents) ? rawMaxEvents[0] : rawMaxEvents) || "10",
			10,
		);

	const eventsQuery = useLiveQuery(() => {
		const id = userId();
		if (!id) return streamEventsCollection;
		return getEventsCollection(id);
	});

	const events = createMemo(() => {
		const data = eventsQuery.data || [];
		const relevantEvents = data.filter(
			(e) =>
				e.type === "donation" ||
				e.type === "follow" ||
				e.type === "subscription" ||
				e.type === "raid" ||
				e.type === "cheer",
		);

		return relevantEvents
			.map((streamEvent): Event | undefined => {
				const username =
					(streamEvent.data?.username as string) || streamEvent.author_id;
				let eventType:
					| "donation"
					| "follower"
					| "subscriber"
					| "raid"
					| "cheer";
				let description: string;
				let icon: string;
				let color: string;

				switch (streamEvent.type) {
					case "donation": {
						eventType = "donation";
						const amount = (streamEvent.data?.amount as number) || 0;
						const currency = (streamEvent.data?.currency as string) || "$";
						description = `Donated ${currency}${amount}`;
						icon = "💰";
						color = "from-purple-600 to-pink-600";
						break;
					}
					case "follow":
						eventType = "follower";
						description = "Followed";
						icon = "❤️";
						color = "from-pink-600 to-red-600";
						break;
					case "subscription": {
						eventType = "subscriber";
						const months = (streamEvent.data?.months as number) || 1;
						description =
							months > 1 ? `Subscribed (${months} months)` : "Subscribed";
						icon = "⭐";
						color = "from-indigo-600 to-purple-600";
						break;
					}
					case "raid": {
						eventType = "raid";
						const viewerCount = (streamEvent.data?.viewerCount as number) || 0;
						description = `Raided with ${viewerCount} viewers`;
						icon = "🎉";
						color = "from-orange-600 to-red-600";
						break;
					}
					case "cheer": {
						eventType = "cheer";
						const bits = (streamEvent.data?.bits as number) || 0;
						description = `Cheered ${bits} bits`;
						icon = "💎";
						color = "from-blue-600 to-cyan-600";
						break;
					}
					default:
						return undefined;
				}

				return {
					id: streamEvent.id,
					type: eventType,
					username,
					description,
					icon,
					color,
					timestamp: new Date(streamEvent.inserted_at),
				};
			})
			.filter((e): e is Event => e !== null)
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
			.slice(0, maxEvents());
	});

	return (
		<div class="flex h-screen w-full flex-col overflow-hidden bg-transparent p-4">
			<Show
				when={userId()}
				fallback={
					<div class="rounded-lg bg-red-500 p-4 text-2xl text-white">
						Error: No userId provided in URL parameters
					</div>
				}>
				<div class="flex-1 overflow-hidden">
					<div class="space-y-2">
						<For each={events()}>
							{(event) => (
								<div
									class={`bg-linear-to-r ${event.color} animate-slide-in-right rounded-lg p-4 shadow-lg`}>
									<div class="flex items-center gap-3">
										<div class="text-3xl">{event.icon}</div>
										<div class="flex-1">
											<div class="font-bold text-lg text-white">
												{event.username}
											</div>
											<div class="text-sm text-white opacity-90">
												{event.description}
											</div>
										</div>
									</div>
								</div>
							)}
						</For>
					</div>
				</div>
			</Show>
		</div>
	);
}
