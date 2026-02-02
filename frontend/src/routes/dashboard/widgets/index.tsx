import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { For, Show, createSignal } from "solid-js";
import Badge from "~/design-system/Badge";
import Card from "~/design-system/Card";
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { getWidgetCatalog, getWidgetCategories } from "~/lib/widget-registry";

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
					<div class="flex min-h-screen items-center justify-center">
						<div class="text-xl">Loading...</div>
					</div>
				}
				when={!isLoading()}>
				<Show
					fallback={
						<div class="flex min-h-screen items-center justify-center">
							<div class="py-12 text-center">
								<h2 class="mb-4 font-bold text-2xl">Not Authenticated</h2>
								<p class="mb-6 text-neutral-500">
									Please sign in to access widgets.
								</p>
								<a
									class="inline-block rounded-lg bg-primary px-6 py-2 font-medium text-white transition-colors hover:bg-primary-hover"
									href={getLoginUrl()}>
									Sign In
								</a>
							</div>
						</div>
					}
					when={user()}>
					<div class="mx-auto max-w-4xl space-y-6">
						{/* Category Filter */}
						<div class="flex flex-wrap gap-1.5">
							<For each={categories}>
								{(category) => (
									<button
										class={`rounded-full px-3 py-1 text-sm transition-colors ${
											selectedCategory() === category.value
												? "bg-primary text-white"
												: "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
										}`}
										onClick={() => setSelectedCategory(category.value)}
										type="button">
										{category.name}
									</button>
								)}
							</For>
						</div>

						{/* Widgets List */}
						<Card padding="none">
							<div class="divide-y divide-neutral-100">
								<For each={filteredWidgets()}>
									{(widget) => (
										<div
											class={`flex items-center gap-4 px-4 py-3 ${
												widget.status === "coming-soon"
													? "opacity-50"
													: "hover:bg-neutral-50"
											}`}>
											<span class="text-2xl">{widget.icon}</span>
											<div class="min-w-0 flex-1">
												<div class="font-medium text-neutral-900 text-sm">
													{widget.name}
												</div>
												<div class="truncate text-neutral-500 text-xs">
													{widget.description}
												</div>
											</div>
											<Badge size="sm" variant="neutral">
												{widget.category}
											</Badge>
											<Show
												fallback={
													<Badge size="sm" variant="warning">
														Coming Soon
													</Badge>
												}
												when={widget.status === "available"}>
												<div class="flex items-center gap-1">
													<A
														class="rounded-md px-3 py-1 text-primary text-sm transition-colors hover:bg-primary-50"
														href={widget.settingsRoute}>
														Configure
													</A>
													{/* biome-ignore lint/a11y/useAnchorContent: aria-label provides accessible content */}
													<a
														aria-label="Open widget preview"
														class="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
														href={`${widget.displayRoute}/${user()?.id}`}
														rel="noopener noreferrer"
														target="_blank"
														title="Open widget preview">
														<svg
															aria-hidden="true"
															class="h-4 w-4"
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
													</a>
												</div>
											</Show>
										</div>
									)}
								</For>
							</div>
						</Card>

						{/* Stream Tools */}
						<div>
							<h2 class="mb-2 font-medium text-neutral-500 text-xs uppercase tracking-wider">
								Stream Tools
							</h2>
							<Card padding="none">
								<div class="divide-y divide-neutral-100">
									<A
										class="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50"
										href="/dashboard/widgets/timer">
										<span class="text-2xl">⏱️</span>
										<div class="min-w-0 flex-1">
											<div class="font-medium text-neutral-900 text-sm">
												Timers
											</div>
											<div class="text-neutral-500 text-xs">
												Configure countdown timers for your stream
											</div>
										</div>
										<svg
											aria-hidden="true"
											class="h-4 w-4 text-neutral-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												d="M9 5l7 7-7 7"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											/>
										</svg>
									</A>
									<div class="flex items-center gap-4 px-4 py-3 opacity-50">
										<span class="text-2xl">🔗</span>
										<div class="min-w-0 flex-1">
											<div class="font-medium text-neutral-900 text-sm">
												Hooks
											</div>
											<div class="text-neutral-500 text-xs">
												Automate actions before/after stream (e.g. post to
												Discord, Twitter)
											</div>
										</div>
										<Badge size="sm" variant="warning">
											Coming Soon
										</Badge>
									</div>
								</div>
							</Card>
						</div>
					</div>
				</Show>
			</Show>
		</>
	);
}
