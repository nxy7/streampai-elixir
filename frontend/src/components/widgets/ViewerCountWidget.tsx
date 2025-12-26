import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import type { ViewerCountConfig, ViewerData } from "~/lib/fake/viewer-count";

interface ViewerCountWidgetProps {
	config: ViewerCountConfig;
	data: ViewerData | null;
	id?: string;
}

function useNumberAnimation() {
	return {
		animateNumber: (
			start: number,
			end: number,
			callback: (value: number) => void,
		) => {
			const duration = 800;
			const startTime = Date.now();
			const difference = end - start;

			function update() {
				const currentTime = Date.now();
				const elapsed = currentTime - startTime;
				const progress = Math.min(elapsed / duration, 1);

				const easeOutCubic = 1 - (1 - progress) ** 3;
				const currentValue = Math.round(start + difference * easeOutCubic);

				callback(currentValue);

				if (progress < 1) {
					requestAnimationFrame(update);
				}
			}

			requestAnimationFrame(update);
		},
	};
}

export default function ViewerCountWidget(props: ViewerCountWidgetProps) {
	const widgetId = () => props.id || "viewer-count-widget";
	const { animateNumber } = useNumberAnimation();

	const [animatedTotalViewers, setAnimatedTotalViewers] = createSignal(0);
	const [animatedPlatformViewers, setAnimatedPlatformViewers] = createSignal<
		Record<string, number>
	>({});

	createEffect(() => {
		const newTotal = props.data?.total_viewers;
		if (newTotal !== undefined) {
			if (props.config.animation_enabled) {
				const startValue = animatedTotalViewers();
				if (startValue !== newTotal) {
					animateNumber(startValue, newTotal, setAnimatedTotalViewers);
				} else {
					setAnimatedTotalViewers(newTotal);
				}
			} else {
				setAnimatedTotalViewers(newTotal);
			}
		}
	});

	createEffect(() => {
		const newPlatforms = props.data?.platform_breakdown;
		if (newPlatforms) {
			if (props.config.animation_enabled) {
				Object.entries(newPlatforms).forEach(([platform, data]) => {
					const startValue = animatedPlatformViewers()[platform] || 0;
					const newValue = data.viewers;

					if (startValue !== newValue) {
						animateNumber(startValue, newValue, (value) => {
							setAnimatedPlatformViewers((prev) => ({
								...prev,
								[platform]: value,
							}));
						});
					}
				});
			} else {
				const directValues: Record<string, number> = {};
				Object.entries(newPlatforms).forEach(([platform, data]) => {
					directValues[platform] = data.viewers;
				});
				setAnimatedPlatformViewers(directValues);
			}
		}
	});

	onMount(() => {
		if (props.data) {
			setAnimatedTotalViewers(props.data.total_viewers);
			if (props.data.platform_breakdown) {
				const initialValues: Record<string, number> = {};
				Object.entries(props.data.platform_breakdown).forEach(
					([platform, data]) => {
						initialValues[platform] = data.viewers;
					},
				);
				setAnimatedPlatformViewers(initialValues);
			}
		}
	});

	const fontClass = () => {
		switch (props.config.font_size) {
			case "small":
				return "text-xl";
			case "large":
				return "text-5xl";
			default:
				return "text-3xl";
		}
	};

	const platformEntries = () => {
		if (!props.data?.platform_breakdown) return [];
		return Object.entries(props.data.platform_breakdown).filter(
			([_, data]) => data.viewers > 0,
		);
	};

	const viewerIcon = {
		viewBox: "0 0 24 24",
		path: "M15 12c0 1.654-1.346 3-3 3s-3-1.346-3-3 1.346-3 3-3 3 1.346 3 3zm9-.449s-4.252 8.449-11.985 8.449c-7.18 0-12.015-8.449-12.015-8.449s4.446-7.551 12.015-7.551c7.694 0 11.985 7.551 11.985 7.551z",
	};

	return (
		<div
			id={widgetId()}
			class="viewer-count-widget flex h-full items-center justify-center p-4 font-sans"
		>
			<Show
				when={props.data}
				fallback={
					<div class="flex items-center space-x-2 text-gray-400">
						<svg
							aria-hidden="true"
							class="h-6 w-6 animate-pulse"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
						</svg>
						<span>Loading viewers...</span>
					</div>
				}
			>
				<div class="viewer-display">
					<Show when={props.config.display_style === "minimal"}>
						<div class="flex items-center space-x-3 rounded-xl border border-gray-700 bg-linear-to-r from-gray-800 to-gray-900 px-6 py-4 text-white shadow-lg">
							<svg
								aria-hidden="true"
								class="h-8 w-8"
								style={{ color: props.config.icon_color || "#ef4444" }}
								fill="currentColor"
								viewBox={viewerIcon.viewBox}
							>
								<path d={viewerIcon.path} />
							</svg>
							<span class={`${fontClass()} font-bold`}>
								{props.config.animation_enabled
									? animatedTotalViewers().toLocaleString()
									: props.data?.total_viewers.toLocaleString()}
							</span>
							<Show when={props.config.viewer_label}>
								<span class="font-medium text-gray-300 text-sm">
									{props.config.viewer_label}
								</span>
							</Show>
						</div>
					</Show>

					<Show when={props.config.display_style === "detailed"}>
						<div class="space-y-3">
							<Show when={props.config.show_total}>
								<div class="flex items-center justify-center space-x-3 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 p-4 text-white shadow-lg">
									<svg
										aria-hidden="true"
										class="h-10 w-10"
										style={{ color: props.config.icon_color || "#ef4444" }}
										fill="currentColor"
										viewBox={viewerIcon.viewBox}
									>
										<path d={viewerIcon.path} />
									</svg>
									<div class="text-center">
										<div class={`${fontClass()} font-bold`}>
											{props.config.animation_enabled
												? animatedTotalViewers().toLocaleString()
												: props.data?.total_viewers.toLocaleString()}
										</div>
										<Show when={props.config.viewer_label}>
											<div class="text-blue-100 text-sm">
												{props.config.viewer_label}
											</div>
										</Show>
									</div>
								</div>
							</Show>

							<Show
								when={
									props.config.show_platforms && platformEntries().length > 0
								}
							>
								<div class="flex items-center justify-center space-x-4">
									<For each={platformEntries()}>
										{([platform, platformData]) => (
											<div class="flex items-center space-x-2 rounded-lg border border-gray-700 bg-gray-900 bg-opacity-80 px-3 py-2 text-white">
												<div
													class={`h-4 w-4 rounded-full ${platformData.color} shadow-lg`}
												></div>
												<span class="font-bold">
													{props.config.animation_enabled
														? (
																animatedPlatformViewers()[platform] || 0
															).toLocaleString()
														: platformData.viewers.toLocaleString()}
												</span>
											</div>
										)}
									</For>
								</div>
							</Show>
						</div>
					</Show>

					<Show when={props.config.display_style === "cards"}>
						<div class="space-y-3">
							<Show when={props.config.show_total}>
								<div class="rounded-xl bg-linear-to-r from-blue-600 to-purple-600 p-5 text-center text-white shadow-lg">
									<div class="mb-2 flex items-center justify-center space-x-2">
										<svg
											aria-hidden="true"
											class="h-7 w-7"
											style={{ color: props.config.icon_color || "#ef4444" }}
											fill="currentColor"
											viewBox={viewerIcon.viewBox}
										>
											<path d={viewerIcon.path} />
										</svg>
										<Show when={props.config.viewer_label}>
											<span class="font-medium text-sm">
												{props.config.viewer_label}
											</span>
										</Show>
									</div>
									<div class={`${fontClass()} font-bold`}>
										{props.config.animation_enabled
											? animatedTotalViewers().toLocaleString()
											: props.data?.total_viewers.toLocaleString()}
									</div>
								</div>
							</Show>

							<Show
								when={
									props.config.show_platforms && platformEntries().length > 0
								}
							>
								<div class="flex items-center justify-center space-x-3">
									<For each={platformEntries()}>
										{([platform, platformData]) => (
											<div
												class={`${platformData.color} rounded-xl p-3 text-center text-white shadow-lg transition-shadow duration-200 hover:shadow-xl`}
											>
												<div class="font-bold text-lg">
													{props.config.animation_enabled
														? (
																animatedPlatformViewers()[platform] || 0
															).toLocaleString()
														: platformData.viewers.toLocaleString()}
												</div>
											</div>
										)}
									</For>
								</div>
							</Show>
						</div>
					</Show>
				</div>
			</Show>
		</div>
	);
}
