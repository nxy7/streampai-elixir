import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { badge, button, card, text } from "~/styles/design-system";

type Widget = {
	id: string;
	name: string;
	description: string;
	category: string;
	icon: string;
	settingsRoute: string;
	displayRoute: string;
	priority: "high" | "medium" | "low";
	status: "available" | "coming-soon";
};

const widgets: Widget[] = [
	{
		id: "alertbox",
		name: "Alertbox",
		description:
			"Display alerts for donations, follows, subscriptions, and more",
		category: "Engagement",
		icon: "🔔",
		settingsRoute: "/dashboard/widgets/alertbox",
		displayRoute: "/w/alertbox",
		priority: "high",
		status: "available",
	},
	{
		id: "chat",
		name: "Chat Widget",
		description: "Show chat messages from all connected platforms",
		category: "Chat",
		icon: "💬",
		settingsRoute: "/dashboard/widgets/chat",
		displayRoute: "/w/chat",
		priority: "high",
		status: "available",
	},
	{
		id: "viewer-count",
		name: "Viewer Count",
		description: "Display current viewer count across all platforms",
		category: "Stats",
		icon: "👁️",
		settingsRoute: "/dashboard/widgets/viewer-count",
		displayRoute: "/w/viewer-count",
		priority: "high",
		status: "available",
	},
	{
		id: "donation-goal",
		name: "Donation Goal",
		description: "Track progress towards your donation goals",
		category: "Goals",
		icon: "🎯",
		settingsRoute: "/dashboard/widgets/donation-goal",
		displayRoute: "/w/donation-goal",
		priority: "medium",
		status: "available",
	},
	{
		id: "event-list",
		name: "Event List",
		description: "Show recent stream events (follows, subs, donations)",
		category: "Engagement",
		icon: "📋",
		settingsRoute: "/dashboard/widgets/eventlist",
		displayRoute: "/w/eventlist",
		priority: "medium",
		status: "available",
	},
	{
		id: "follower-count",
		name: "Follower Count",
		description: "Display total follower count across platforms",
		category: "Stats",
		icon: "👥",
		settingsRoute: "/dashboard/widgets/follower-count",
		displayRoute: "/w/follower-count",
		priority: "medium",
		status: "available",
	},
	{
		id: "top-donors",
		name: "Top Donors",
		description: "Leaderboard of your top donors",
		category: "Engagement",
		icon: "🏆",
		settingsRoute: "/dashboard/widgets/topdonors",
		displayRoute: "/w/topdonors",
		priority: "medium",
		status: "available",
	},
	{
		id: "poll",
		name: "Poll Widget",
		description: "Create and display interactive polls for viewers",
		category: "Interaction",
		icon: "📊",
		settingsRoute: "/dashboard/widgets/poll",
		displayRoute: "/w/poll",
		priority: "medium",
		status: "available",
	},
	{
		id: "timer",
		name: "Timer Widget",
		description: "Countdown timer for events and segments",
		category: "Tools",
		icon: "⏱️",
		settingsRoute: "/dashboard/widgets/timer",
		displayRoute: "/w/timer",
		priority: "medium",
		status: "available",
	},
	{
		id: "giveaway",
		name: "Giveaway",
		description: "Run giveaways and pick random winners",
		category: "Interaction",
		icon: "🎁",
		settingsRoute: "/dashboard/widgets/giveaway",
		displayRoute: "/w/giveaway",
		priority: "low",
		status: "available",
	},
	{
		id: "slider",
		name: "Slider Widget",
		description: "Rotating carousel for sponsors, announcements, and more",
		category: "Display",
		icon: "🎠",
		settingsRoute: "/dashboard/widgets/slider",
		displayRoute: "/w/slider",
		priority: "low",
		status: "available",
	},
];

const categories = [
	{ name: "All", value: "all" },
	{ name: "Engagement", value: "Engagement" },
	{ name: "Chat", value: "Chat" },
	{ name: "Stats", value: "Stats" },
	{ name: "Goals", value: "Goals" },
	{ name: "Interaction", value: "Interaction" },
	{ name: "Tools", value: "Tools" },
	{ name: "Display", value: "Display" },
];

export default function Widgets() {
	const { user, isLoading } = useCurrentUser();
	const [selectedCategory, setSelectedCategory] = createSignal("all");

	const filteredWidgets = () => {
		if (selectedCategory() === "all") return widgets;
		return widgets.filter((w) => w.category === selectedCategory());
	};

	return (
		<>
			<Title>Widgets - Streampai</Title>
			<Show
				when={!isLoading()}
				fallback={
					<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
						<div class="text-white text-xl">Loading...</div>
					</div>
				}
			>
				<Show
					when={user()}
					fallback={
						<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
							<div class="py-12 text-center">
								<h2 class="mb-4 font-bold text-2xl text-white">
									Not Authenticated
								</h2>
								<p class="mb-6 text-gray-300">
									Please sign in to access widgets.
								</p>
								<a
									href={getLoginUrl()}
									class="inline-block rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
								>
									Sign In
								</a>
							</div>
						</div>
					}
				>
					<div class="mx-auto max-w-7xl space-y-6">
						{/* Header */}
						<div class={card.default}>
							<h1 class={text.h1}>Stream Widgets</h1>
							<p class={`${text.muted} mt-2`}>
								Customize your stream with beautiful, interactive widgets for
								OBS
							</p>
						</div>

						{/* Category Filter */}
						<div class={card.default}>
							<div class="flex flex-wrap gap-2">
								<For each={categories}>
									{(category) => (
										<button
											type="button"
											class={
												selectedCategory() === category.value
													? button.primary
													: button.secondary
											}
											onClick={() => setSelectedCategory(category.value)}
										>
											{category.name}
										</button>
									)}
								</For>
							</div>
						</div>

						{/* Widgets Grid */}
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							<For each={filteredWidgets()}>
								{(widget) => (
									<div
										class={
											card.base +
											"overflow-hidden transition-shadow hover:shadow-lg"
										}
									>
										{/* Widget Icon Header */}
										<div class="bg-linear-to-r from-purple-500 to-pink-500 p-6 text-center">
											<div class="mb-2 text-6xl">{widget.icon}</div>
											<h3 class="font-semibold text-lg text-white">
												{widget.name}
											</h3>
										</div>

										{/* Widget Content */}
										<div class="p-6">
											<div class="mb-3 flex items-center gap-2">
												<span class={badge.info}>{widget.category}</span>
												<Show when={widget.status === "coming-soon"}>
													<span class={badge.warning}>Coming Soon</span>
												</Show>
												<Show when={widget.priority === "high"}>
													<span class={badge.success}>Popular</span>
												</Show>
											</div>

											<p class="mb-4 text-gray-700 text-sm">
												{widget.description}
											</p>

											<div class="flex gap-2">
												<Show
													when={widget.status === "available"}
													fallback={
														<button
															type="button"
															class={button.secondary}
															disabled
														>
															Configure
														</button>
													}
												>
													<A
														href={widget.settingsRoute}
														class={`${button.primary} flex-1 text-center`}
													>
														Configure
													</A>
												</Show>
												<Show when={widget.status === "available"}>
													<a
														href={`${widget.displayRoute}/${user()?.id}`}
														class={button.ghost}
														target="_blank"
														rel="noopener noreferrer"
													>
														<span class="sr-only">
															Open widget display in new tab
														</span>
														<svg
															aria-hidden="true"
															class="h-5 w-5"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
															/>
														</svg>
													</a>
												</Show>
											</div>
										</div>
									</div>
								)}
							</For>
						</div>

						{/* Help Section */}
						<div class="rounded-2xl border border-purple-200 bg-linear-to-r from-purple-50 to-pink-50 p-8">
							<h2 class={`${text.h2} mb-4`}>How to Use Widgets</h2>
							<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
								<div class="flex items-start space-x-3">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 font-bold text-white">
										1
									</div>
									<div>
										<h3 class="mb-1 font-semibold text-gray-900">
											Configure Widget
										</h3>
										<p class="text-gray-700 text-sm">
											Click "Configure" on any widget to customize its
											appearance and settings.
										</p>
									</div>
								</div>
								<div class="flex items-start space-x-3">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 font-bold text-white">
										2
									</div>
									<div>
										<h3 class="mb-1 font-semibold text-gray-900">
											Copy Widget URL
										</h3>
										<p class="text-gray-700 text-sm">
											Get the widget's display URL from the settings page.
										</p>
									</div>
								</div>
								<div class="flex items-start space-x-3">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 font-bold text-white">
										3
									</div>
									<div>
										<h3 class="mb-1 font-semibold text-gray-900">Add to OBS</h3>
										<p class="text-gray-700 text-sm">
											Add a Browser Source in OBS and paste the widget URL.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</Show>
			</Show>
		</>
	);
}
