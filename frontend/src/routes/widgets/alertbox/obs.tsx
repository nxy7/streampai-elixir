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

interface AlertData {
	username?: string;
	amount?: number;
	currency?: string;
	message?: string;
	months?: number;
	viewerCount?: number;
}

type AlertEvent = {
	id: string;
	type: "donation" | "follower" | "subscriber" | "raid";
	data: AlertData;
	timestamp: Date;
};

export const Route = createFileRoute("/widgets/alertbox/obs")({
	component: AlertboxOBS,
});

function AlertboxOBS() {
	const params = useSearch({ strict: false }) as Accessor<
		Record<string, string | string[] | undefined>
	>;
	const userId = () => {
		const val = params().userId;
		return (Array.isArray(val) ? val[0] : val) as string | undefined;
	};

	const [alertQueue, setAlertQueue] = createSignal<AlertEvent[]>([]);
	const [currentAlert, setCurrentAlert] = createSignal<AlertEvent | null>(null);
	const [isAnimating, setIsAnimating] = createSignal(false);
	const [processedEventIds, setProcessedEventIds] = createSignal<Set<string>>(
		new Set(),
	);

	const eventsQuery = useLiveQuery(() => {
		const id = userId();
		if (!id) return streamEventsCollection;
		return getEventsCollection(id);
	});

	const relevantEvents = createMemo(() => {
		const data = eventsQuery.data || [];
		return data
			.filter(
				(e) =>
					e.type === "donation" ||
					e.type === "follow" ||
					e.type === "subscription" ||
					e.type === "raid",
			)
			.sort(
				(a, b) =>
					new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime(),
			);
	});

	createEffect(() => {
		const events = relevantEvents();
		const processed = processedEventIds();

		events.forEach((streamEvent) => {
			if (processed.has(streamEvent.id)) return;

			let alertType: "donation" | "follower" | "subscriber" | "raid";
			if (streamEvent.type === "follow") {
				alertType = "follower";
			} else if (streamEvent.type === "subscription") {
				alertType = "subscriber";
			} else {
				alertType = streamEvent.type as "donation" | "raid";
			}

			const event: AlertEvent = {
				id: streamEvent.id,
				type: alertType,
				data: streamEvent.data,
				timestamp: new Date(streamEvent.inserted_at),
			};

			addToQueue(event);
			setProcessedEventIds((prev) => new Set([...prev, streamEvent.id]));
		});
	});

	function addToQueue(event: AlertEvent) {
		setAlertQueue((prev) => [...prev, event]);
		if (!isAnimating()) {
			processQueue();
		}
	}

	function processQueue() {
		const queue = alertQueue();
		if (queue.length === 0) {
			setIsAnimating(false);
			return;
		}

		const nextEvent = queue[0];
		setAlertQueue((prev) => prev.slice(1));
		setCurrentAlert(nextEvent);
		setIsAnimating(true);

		setTimeout(() => {
			setIsAnimating(false);
			setCurrentAlert(null);
			setTimeout(() => {
				processQueue();
			}, 500);
		}, 5000);
	}

	function _getPlatformColor(platform: string) {
		switch (platform.toLowerCase()) {
			case "twitch":
				return "#9146FF";
			case "youtube":
				return "#FF0000";
			case "facebook":
				return "#1877F2";
			case "kick":
				return "#53FC18";
			default:
				return "#6B7280";
		}
	}

	function renderDonationAlert(data: AlertData) {
		return (
			<div class="alert-content animate-bounce-in rounded-2xl bg-linear-to-r from-purple-600 to-pink-600 p-8 text-center shadow-2xl">
				<div class="mb-4 text-5xl text-white">💰</div>
				<div class="mb-2 font-bold text-4xl text-white">
					{data.username} donated {data.currency}
					{data.amount}!
				</div>
				<Show when={data.message}>
					<div class="mt-4 text-2xl text-white italic">"{data.message}"</div>
				</Show>
			</div>
		);
	}

	function renderFollowerAlert(data: AlertData) {
		return (
			<div class="alert-content animate-bounce-in rounded-2xl bg-linear-to-r from-blue-600 to-cyan-600 p-8 text-center shadow-2xl">
				<div class="mb-4 text-5xl text-white">❤️</div>
				<div class="mb-2 font-bold text-4xl text-white">
					{data.username} just followed!
				</div>
				<div class="text-white text-xl">Welcome to the community!</div>
			</div>
		);
	}

	function renderSubscriberAlert(data: AlertData) {
		return (
			<div class="alert-content animate-bounce-in rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 p-8 text-center shadow-2xl">
				<div class="mb-4 text-5xl text-white">⭐</div>
				<div class="mb-2 font-bold text-4xl text-white">
					{data.username} subscribed!
				</div>
				<Show when={data.months && data.months > 1}>
					<div class="text-2xl text-white">{data.months} months strong!</div>
				</Show>
				<Show when={data.message}>
					<div class="mt-4 text-white text-xl italic">"{data.message}"</div>
				</Show>
			</div>
		);
	}

	function renderRaidAlert(data: AlertData) {
		return (
			<div class="alert-content animate-bounce-in rounded-2xl bg-linear-to-r from-orange-600 to-red-600 p-8 text-center shadow-2xl">
				<div class="mb-4 text-5xl text-white">🎉</div>
				<div class="mb-2 font-bold text-4xl text-white">
					{data.username} is raiding!
				</div>
				<div class="text-3xl text-white">with {data.viewerCount} viewers!</div>
			</div>
		);
	}

	return (
		<div class="flex h-screen w-full items-center justify-center overflow-hidden bg-transparent">
			<Show when={isAnimating() && currentAlert()}>
				{(alert) => (
					<div class="alert-container w-full max-w-4xl px-8">
						<Show when={alert().type === "donation"}>
							{renderDonationAlert(alert().data)}
						</Show>
						<Show when={alert().type === "follower"}>
							{renderFollowerAlert(alert().data)}
						</Show>
						<Show when={alert().type === "subscriber"}>
							{renderSubscriberAlert(alert().data)}
						</Show>
						<Show when={alert().type === "raid"}>
							{renderRaidAlert(alert().data)}
						</Show>
					</div>
				)}
			</Show>

			<Show when={!userId()}>
				<div class="rounded-lg bg-red-500 p-4 text-2xl text-white">
					Error: No userId provided in URL parameters
				</div>
			</Show>
		</div>
	);
}
