import { createFileRoute } from "@tanstack/solid-router";
import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import SmartCanvasWidgetRenderer from "~/components/SmartCanvasWidgetRenderer";
import { getSmartCanvasLayout } from "~/sdk/ash_rpc";

interface CanvasWidget {
	id: string;
	widgetType: string;
	x: number;
	y: number;
	width: number;
	height: number;
	config?: Record<string, unknown>;
}

const layoutFields: ("id" | "userId" | "widgets")[] = [
	"id",
	"userId",
	"widgets",
];

export const Route = createFileRoute("/dashboard/scenes/$userId/display")({
	component: SmartCanvasDisplay,
	head: () => ({
		meta: [{ title: "Smart Canvas Display - Streampai" }],
	}),
});

function SmartCanvasDisplay() {
	const params = Route.useParams();
	const [widgets, setWidgets] = createSignal<CanvasWidget[]>([]);

	async function loadLayout() {
		if (!params().userId) return;
		const result = await getSmartCanvasLayout({
			input: { userId: params().userId },
			fields: [...layoutFields],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data?.widgets) {
			const parsedWidgets = result.data.widgets.map((w: unknown) => {
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
	}

	onMount(() => {
		loadLayout();

		const interval = setInterval(loadLayout, 5000);

		onCleanup(() => clearInterval(interval));
	});

	return (
		<div
			style={{
				background: "transparent",
				width: "1920px",
				height: "1080px",
				position: "relative",
				margin: 0,
				padding: 0,
				overflow: "hidden",
			}}>
			<For each={widgets()}>
				{(widget) => <SmartCanvasWidgetRenderer widget={widget} />}
			</For>

			<Show when={widgets().length === 0}>
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						"flex-direction": "column",
						"align-items": "center",
						"justify-content": "center",
						color: "#9ca3af",
					}}>
					<div style={{ "font-size": "4rem", "margin-bottom": "1rem" }}>🎨</div>
					<h3
						style={{
							"font-size": "1.5rem",
							"font-weight": "600",
							"margin-bottom": "0.5rem",
						}}>
						No Widgets Configured
					</h3>
					<p style={{ "font-size": "0.875rem" }}>
						Add widgets to your Smart Canvas to see them here
					</p>
				</div>
			</Show>
		</div>
	);
}
