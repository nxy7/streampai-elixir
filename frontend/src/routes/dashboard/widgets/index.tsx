import { Title } from "@solidjs/meta";
import { For, Show, createSignal } from "solid-js";
import Badge from "~/components/ui/Badge";
import Button from "~/components/ui/Button";
import Card from "~/components/ui/Card";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { getWidgetCatalog, getWidgetCategories } from "~/lib/widget-registry";
import { text } from "~/styles/design-system";

// Get widgets and categories from the central registry
const widgets = getWidgetCatalog();
const categories = [
	{ name: "All", value: "all" },
	...getWidgetCategories().map((cat) => ({ name: cat, value: cat })),
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
				fallback={
					<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
						<div class="text-white text-xl">Loading...</div>
					</div>
				}
				when={!isLoading()}>
				<Show
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
									class="inline-block rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600"
									href={getLoginUrl()}>
									Sign In
								</a>
							</div>
						</div>
					}
					when={user()}>
					<div class="mx-auto max-w-7xl space-y-6">
						{/* Header */}
						<Card>
							<h1 class={text.h1}>Stream Widgets</h1>
							<p class={`${text.muted} mt-2`}>
								Customize your stream with beautiful, interactive widgets for
								OBS
							</p>
						</Card>

						{/* Category Filter */}
						<Card>
							<div class="flex flex-wrap gap-2">
								<For each={categories}>
									{(category) => (
										<Button
											onClick={() => setSelectedCategory(category.value)}
											type="button"
											variant={
												selectedCategory() === category.value
													? "primary"
													: "secondary"
											}>
											{category.name}
										</Button>
									)}
								</For>
							</div>
						</Card>

						{/* Widgets Grid */}
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							<For each={filteredWidgets()}>
								{(widget) => (
									<Card
										class="overflow-hidden transition-shadow hover:shadow-lg"
										padding="none">
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
												<Badge variant="info">{widget.category}</Badge>
												<Show when={widget.status === "coming-soon"}>
													<Badge variant="warning">Coming Soon</Badge>
												</Show>
												<Show when={widget.priority === "high"}>
													<Badge variant="success">Popular</Badge>
												</Show>
											</div>

											<p class="mb-4 text-gray-700 text-sm">
												{widget.description}
											</p>

											<div class="flex gap-2">
												<Show
													fallback={
														<Button disabled type="button" variant="secondary">
															Configure
														</Button>
													}
													when={widget.status === "available"}>
													<Button
														as="link"
														class="flex-1 text-center"
														href={widget.settingsRoute}>
														Configure
													</Button>
												</Show>
												<Show when={widget.status === "available"}>
													<Button
														as="a"
														href={`${widget.displayRoute}/${user()?.id}`}
														rel="noopener noreferrer"
														target="_blank"
														variant="ghost">
														<span class="sr-only">
															Open widget display in new tab
														</span>
														<svg
															aria-hidden="true"
															class="h-5 w-5"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24">
															<path
																d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
															/>
														</svg>
													</Button>
												</Show>
											</div>
										</div>
									</Card>
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
