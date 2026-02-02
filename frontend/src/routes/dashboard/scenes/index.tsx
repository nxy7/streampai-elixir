import { Title } from "@solidjs/meta";
import { For, Show, createEffect, createSignal, onMount } from "solid-js";
import Button from "~/design-system/Button";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import { useCurrentUser } from "~/lib/auth";
import { getSmartCanvasLayout, saveSmartCanvasLayout } from "~/sdk/ash_rpc";

interface CanvasWidget {
	id: string;
	widgetType: string;
	x: number;
	y: number;
	width: number;
	height: number;
	config?: Record<string, unknown>;
}

interface _SmartCanvasLayout {
	id?: string;
	userId: string;
	widgets: CanvasWidget[];
}

const AVAILABLE_WIDGETS = [
	{
		type: "placeholder",
		name: "Placeholder",
		icon: "🎨",
		defaultWidth: 200,
		defaultHeight: 120,
	},
	{
		type: "viewer-count",
		name: "Viewer Count",
		icon: "👁️",
		defaultWidth: 200,
		defaultHeight: 100,
	},
	{
		type: "follower-count",
		name: "Follower Count",
		icon: "👥",
		defaultWidth: 200,
		defaultHeight: 100,
	},
	{
		type: "donation-goal",
		name: "Donation Goal",
		icon: "🎯",
		defaultWidth: 300,
		defaultHeight: 150,
	},
	{
		type: "chat",
		name: "Chat",
		icon: "💬",
		defaultWidth: 400,
		defaultHeight: 600,
	},
	{
		type: "alertbox",
		name: "Alertbox",
		icon: "🔔",
		defaultWidth: 400,
		defaultHeight: 200,
	},
	{
		type: "timer",
		name: "Timer",
		icon: "⏱️",
		defaultWidth: 200,
		defaultHeight: 100,
	},
	{
		type: "poll",
		name: "Poll",
		icon: "📊",
		defaultWidth: 300,
		defaultHeight: 200,
	},
	{
		type: "eventlist",
		name: "Event List",
		icon: "📋",
		defaultWidth: 300,
		defaultHeight: 400,
	},
	{
		type: "topdonors",
		name: "Top Donors",
		icon: "🏆",
		defaultWidth: 300,
		defaultHeight: 300,
	},
	{
		type: "giveaway",
		name: "Giveaway",
		icon: "🎁",
		defaultWidth: 350,
		defaultHeight: 250,
	},
	{
		type: "slider",
		name: "Slider",
		icon: "🎠",
		defaultWidth: 600,
		defaultHeight: 200,
	},
];

const layoutFields: ("id" | "userId" | "widgets")[] = [
	"id",
	"userId",
	"widgets",
];

function PaletteWidgetItem(props: {
	widgetDef: (typeof AVAILABLE_WIDGETS)[number];
}) {
	const handleAddWidget = () => {
		const event = new CustomEvent("add-widget", {
			detail: { widgetType: props.widgetDef.type },
		});
		window.dispatchEvent(event);
	};

	return (
		<button
			class="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-linear-to-r from-primary-light to-secondary p-3 text-white transition-shadow hover:shadow-lg"
			onClick={handleAddWidget}
			type="button">
			<span class="text-2xl">{props.widgetDef.icon}</span>
			<span class="font-semibold">{props.widgetDef.name}</span>
		</button>
	);
}

function CanvasWidgetComponent(props: {
	widget: CanvasWidget;
	selectedWidgetId: string | null;
	onSelect: (id: string) => void;
	onDelete: (id: string) => void;
	onUpdatePosition: (id: string, x: number, y: number) => void;
	onUpdateSize: (id: string, width: number, height: number) => void;
	scale: number;
	setIsResizing: (resizing: boolean) => void;
}) {
	let isDragging = false;
	let startX = 0;
	let startY = 0;
	let startWidgetX = 0;
	let startWidgetY = 0;

	const widgetDef = () =>
		AVAILABLE_WIDGETS.find((w) => w.type === props.widget.widgetType);

	const handleMouseDown = (e: MouseEvent) => {
		if (
			(e.target as HTMLElement).closest(".resize-handle") ||
			(e.target as HTMLElement).closest(".delete-button")
		) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		isDragging = true;
		startX = e.clientX;
		startY = e.clientY;
		startWidgetX = props.widget.x;
		startWidgetY = props.widget.y;

		props.onSelect(props.widget.id);

		const handleMouseMove = (moveEvent: MouseEvent) => {
			if (!isDragging) return;

			const deltaX = (moveEvent.clientX - startX) / props.scale;
			const deltaY = (moveEvent.clientY - startY) / props.scale;

			props.onUpdatePosition(
				props.widget.id,
				startWidgetX + deltaX,
				startWidgetY + deltaY,
			);
		};

		const handleMouseUp = () => {
			isDragging = false;
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};

		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);
	};

	const handleSelect = (e: MouseEvent) => {
		e.stopPropagation();
		props.onSelect(props.widget.id);
	};

	return (
		<div
			class="group absolute text-left"
			onClick={handleSelect}
			style={{
				left: `${props.widget.x}px`,
				top: `${props.widget.y}px`,
				width: `${props.widget.width}px`,
				height: `${props.widget.height}px`,
				"z-index": props.selectedWidgetId === props.widget.id ? 20 : 10,
			}}>
			<div
				class="h-full w-full cursor-move rounded-lg border-2 border-white/20 bg-linear-to-br from-primary-light to-secondary p-4 shadow-lg"
				classList={{
					"ring-2 ring-yellow-400": props.selectedWidgetId === props.widget.id,
				}}
				onMouseDown={handleMouseDown}
				role="application">
				<div class="mb-2 flex items-center gap-2 text-white">
					<span class="text-xl">{widgetDef()?.icon}</span>
					<span class="font-semibold text-sm">{widgetDef()?.name}</span>
				</div>
				<div class="rounded bg-black/20 p-2 text-white/80 text-xs">
					<div>
						Position: ({Math.round(props.widget.x)},{" "}
						{Math.round(props.widget.y)})
					</div>
					<div>
						Size: {props.widget.width}x{props.widget.height}
					</div>
				</div>
			</div>

			<button
				class="delete-button absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
				onClick={(e) => {
					e.stopPropagation();
					props.onDelete(props.widget.id);
				}}
				type="button">
				×
			</button>

			<button
				class="resize-handle absolute -right-2 -bottom-2 flex h-6 w-6 cursor-nwse-resize items-center justify-center rounded-full border-2 border-white bg-blue-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
				onMouseDown={(e) => {
					e.stopPropagation();
					e.preventDefault();
					props.setIsResizing(true);
					const startX = e.clientX;
					const startY = e.clientY;
					const startWidth = props.widget.width;
					const startHeight = props.widget.height;

					const handleMouseMove = (moveEvent: MouseEvent) => {
						const deltaX = (moveEvent.clientX - startX) / props.scale;
						const deltaY = (moveEvent.clientY - startY) / props.scale;
						props.onUpdateSize(
							props.widget.id,
							startWidth + deltaX,
							startHeight + deltaY,
						);
					};

					const handleMouseUp = () => {
						props.setIsResizing(false);
						document.removeEventListener("mousemove", handleMouseMove);
						document.removeEventListener("mouseup", handleMouseUp);
					};

					document.addEventListener("mousemove", handleMouseMove);
					document.addEventListener("mouseup", handleMouseUp);
				}}
				type="button">
				⇲
			</button>
		</div>
	);
}

export default function SmartCanvas() {
	const { user } = useCurrentUser();
	const [widgets, setWidgets] = createSignal<CanvasWidget[]>([]);
	const [_layoutId, setLayoutId] = createSignal<string | null>(null);
	const [layoutSaved, setLayoutSaved] = createSignal(true);
	const [canvasMaximized, setCanvasMaximized] = createSignal(false);
	const [scale, setScale] = createSignal(0.5); // Start with reasonable default, will be updated by ResizeObserver
	const [selectedWidgetId, setSelectedWidgetId] = createSignal<string | null>(
		null,
	);
	const [_isResizing, setIsResizing] = createSignal(false);
	const [canvasRef, setCanvasRef] = createSignal<HTMLDivElement | undefined>();

	async function loadLayout() {
		const userId = user()?.id;
		if (!userId) return;

		const result = await getSmartCanvasLayout({
			input: { userId },
			fields: [...layoutFields],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data) {
			const layout = result.data;
			setLayoutId(layout.id);

			if (layout.widgets && Array.isArray(layout.widgets)) {
				const parsedWidgets = layout.widgets.map((w: unknown) => {
					const widget =
						typeof w === "string"
							? JSON.parse(w)
							: (w as Record<string, unknown>);
					return {
						id: widget.id,
						widgetType: widget.type || widget.widgetType,
						x: widget.x || 0,
						y: widget.y || 0,
						width: widget.width || 200,
						height: widget.height || 120,
						config: widget.config,
					};
				});
				setWidgets(parsedWidgets);
			}
			setLayoutSaved(true);
		}
	}

	async function saveLayout() {
		const userId = user()?.id;
		if (!userId) return;

		const widgetsData = widgets().map((w) => ({
			id: w.id,
			type: w.widgetType,
			x: w.x,
			y: w.y,
			width: w.width,
			height: w.height,
			config: w.config,
		}));

		// The create action uses upsert, so we can use it for both create and update
		const result = await saveSmartCanvasLayout({
			input: { userId, widgets: widgetsData },
			fields: [...layoutFields],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data) {
			setLayoutId(result.data.id);
			setLayoutSaved(true);
		}
	}

	function addWidget(
		widgetType: string,
		x: number = Math.random() * 400,
		y: number = Math.random() * 200,
	) {
		const widgetDef = AVAILABLE_WIDGETS.find((w) => w.type === widgetType);
		const newWidget: CanvasWidget = {
			id: `widget-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
			widgetType,
			x: Math.max(0, Math.min(1920 - (widgetDef?.defaultWidth || 200), x)),
			y: Math.max(0, Math.min(1080 - (widgetDef?.defaultHeight || 120), y)),
			width: widgetDef?.defaultWidth || 200,
			height: widgetDef?.defaultHeight || 120,
		};

		setWidgets([...widgets(), newWidget]);
		setLayoutSaved(false);
	}

	function deleteWidget(widgetId: string) {
		setWidgets(widgets().filter((w) => w.id !== widgetId));
		setLayoutSaved(false);
	}

	function updateWidgetPosition(widgetId: string, x: number, y: number) {
		setWidgets(
			widgets().map((w) =>
				w.id === widgetId
					? {
							...w,
							x: Math.max(0, Math.min(1920 - w.width, x)),
							y: Math.max(0, Math.min(1080 - w.height, y)),
						}
					: w,
			),
		);
		setLayoutSaved(false);
	}

	function updateWidgetSize(widgetId: string, width: number, height: number) {
		setWidgets(
			widgets().map((w) =>
				w.id === widgetId
					? {
							...w,
							width: Math.max(100, Math.min(1920 - w.x, width)),
							height: Math.max(50, Math.min(1080 - w.y, height)),
						}
					: w,
			),
		);
		setLayoutSaved(false);
	}

	function clearWidgets() {
		setWidgets([]);
		setLayoutSaved(false);
	}

	function updateScale() {
		const canvas = canvasRef();
		if (!canvas) return;

		const container = canvas.parentElement;
		if (!container) return;

		const containerWidth = container.clientWidth;
		const containerHeight = container.clientHeight;

		// Don't calculate if container has no dimensions yet
		if (containerWidth === 0 || containerHeight === 0) return;

		const scaleX = containerWidth / 1920;
		const scaleY = containerHeight / 1080;
		const newScale = Math.min(scaleX, scaleY);

		// Only update if scale actually changed
		if (Math.abs(newScale - scale()) > 0.001) {
			setScale(newScale);
		}
	}

	// Load layout when user becomes available
	createEffect(() => {
		if (user()?.id) {
			loadLayout();
		}
	});

	onMount(() => {
		// Initial scale calculation after mount
		setTimeout(() => {
			updateScale();
		}, 0);

		window.addEventListener("resize", updateScale);

		// Listen for widget add events from palette
		const handleAddWidget = (e: Event) => {
			const customEvent = e as CustomEvent;
			addWidget(customEvent.detail.widgetType);
		};
		window.addEventListener("add-widget", handleAddWidget);

		return () => {
			window.removeEventListener("resize", updateScale);
			window.removeEventListener("add-widget", handleAddWidget);
		};
	});

	// Recalculate scale whenever canvasRef is set or canvasMaximized changes
	createEffect(() => {
		const canvas = canvasRef();
		if (canvas) {
			// Track canvasMaximized to trigger recalculation when it changes
			canvasMaximized();

			const container = canvas.parentElement;
			if (!container) return;

			// Use ResizeObserver to detect when container is sized
			const resizeObserver = new ResizeObserver(() => {
				updateScale();
			});
			resizeObserver.observe(container);

			// Try immediate update
			updateScale();

			// Also try with RAF as fallback
			requestAnimationFrame(() => {
				updateScale();
				requestAnimationFrame(() => {
					updateScale();
				});
			});

			// And setTimeout as additional fallback
			setTimeout(() => {
				updateScale();
			}, 0);

			setTimeout(() => {
				updateScale();
			}, 100);

			// Cleanup
			return () => {
				resizeObserver.disconnect();
			};
		}
	});

	const obsUrl = () => {
		if (!user()?.id) return "";
		return `${window.location.origin}/w/smart-canvas/${user()?.id}`;
	};

	return (
		<>
			<Title>Scenes - Streampai</Title>
			<Show when={user()}>
				<div class="space-y-6">
					<Card variant="ghost">
						<h1 class={text.h1}>Scenes</h1>
						<p class={`${text.muted} mt-2`}>
							Compose your stream overlay with interactive widgets. Click
							widgets from the palette to add them to the canvas.
						</p>
					</Card>

					<Card class="border-blue-500/20 bg-blue-500/10" variant="ghost">
						<div class="flex items-start gap-3">
							<div class="shrink-0 text-blue-400">ℹ️</div>
							<div class="flex-1">
								<h3 class="mb-1 font-semibold">OBS Browser Source URL</h3>
								<p class="mb-2 text-sm opacity-70">
									Copy this URL and add it as a Browser Source in OBS (set to
									1920x1080):
								</p>
								<div class="flex gap-2">
									<input
										class="flex-1 rounded-lg border border-neutral-500/30 bg-surface px-3 py-2 font-mono text-sm"
										readonly
										type="text"
										value={obsUrl()}
									/>
									<Button
										onClick={() => {
											navigator.clipboard.writeText(obsUrl());
										}}>
										Copy
									</Button>
								</div>
							</div>
						</div>
					</Card>

					<Card variant="ghost">
						<div class="flex items-center justify-between">
							<div class="flex gap-2">
								<Button
									onClick={saveLayout}
									variant={layoutSaved() ? "success" : "primary"}>
									{layoutSaved() ? "Layout Saved" : "Save Layout"}
								</Button>
								<Button onClick={clearWidgets} variant="secondary">
									Clear All
								</Button>
								<Button
									onClick={() => setCanvasMaximized(!canvasMaximized())}
									variant="ghost">
									{canvasMaximized() ? "Exit Fullscreen" : "Fullscreen"}
								</Button>
							</div>
							<div class="text-neutral-600 text-sm">
								Widgets: {widgets().length}
							</div>
						</div>
					</Card>

					<div class="grid grid-cols-1 gap-6 lg:grid-cols-4">
						<div class="lg:col-span-1">
							<Card class="max-h-[700px] overflow-y-auto">
								<h3 class={`${text.h3} mb-4`}>Widget Palette</h3>
								<p class="mb-4 text-neutral-600 text-sm">
									Click a widget to add it to the canvas
								</p>
								<div class="space-y-2">
									<For each={AVAILABLE_WIDGETS}>
										{(widgetDef) => <PaletteWidgetItem widgetDef={widgetDef} />}
									</For>
								</div>
							</Card>
						</div>

						<div class="lg:col-span-3">
							<Card
								class="bg-neutral-900 p-4"
								classList={{
									"!fixed !inset-0 !z-50 !m-0 !rounded-none": canvasMaximized(),
								}}>
								<Show when={canvasMaximized()}>
									<button
										class="absolute top-4 right-4 z-50 rounded-lg bg-neutral-800 p-2 text-white hover:bg-neutral-700"
										onClick={() => setCanvasMaximized(false)}
										type="button">
										✕
									</button>
								</Show>

								<div
									class="mb-2 text-neutral-400 text-sm"
									classList={{ hidden: canvasMaximized() }}>
									Canvas: 1920x1080 (16:9)
								</div>

								<div
									class="w-full"
									style={{
										"aspect-ratio": "16/9",
										"max-height": canvasMaximized() ? "100vh" : "650px",
									}}>
									<div class="relative h-full w-full">
										<div
											class="absolute overflow-hidden rounded-lg border-2 border-neutral-700 bg-neutral-950"
											onClick={() => setSelectedWidgetId(null)}
											onKeyDown={(e) => {
												if (e.key === "Escape") {
													setSelectedWidgetId(null);
												}
											}}
											ref={setCanvasRef}
											role="application"
											style={{
												width: "1920px",
												height: "1080px",
												"transform-origin": "top left",
												transform: `scale(${scale()})`,
												background:
													"linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
												"background-size": "50px 50px",
											}}>
											<For each={widgets()}>
												{(widget) => (
													<CanvasWidgetComponent
														onDelete={deleteWidget}
														onSelect={setSelectedWidgetId}
														onUpdatePosition={updateWidgetPosition}
														onUpdateSize={updateWidgetSize}
														scale={scale()}
														selectedWidgetId={selectedWidgetId()}
														setIsResizing={setIsResizing}
														widget={widget}
													/>
												)}
											</For>

											<Show when={widgets().length === 0}>
												<div class="absolute inset-0 flex flex-col items-center justify-center text-neutral-400">
													<div class="mb-4 text-6xl">🎨</div>
													<h3 class="mb-2 font-semibold text-xl">
														No Widgets Yet
													</h3>
													<p class="text-sm">
														Click widgets from the palette to get started
													</p>
												</div>
											</Show>
										</div>
									</div>
								</div>
							</Card>
						</div>
					</div>
				</div>
			</Show>
		</>
	);
}
