import { useParams } from "@solidjs/router";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
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

export default function SmartCanvasDisplay() {
	const params = useParams<{ userId: string }>();
	const [widgets, setWidgets] = createSignal<CanvasWidget[]>([]);

	async function loadLayout() {
		const userId = params.userId;
		if (!userId) return;

		const result = await getSmartCanvasLayout({
			input: { userId },
			fields: ["id", "userId", "widgets"],
			fetchOptions: { credentials: "include" },
		});

		if (
			result.success &&
			result.data.widgets &&
			Array.isArray(result.data.widgets)
		) {
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

		// Poll for updates every 5 seconds
		const interval = setInterval(loadLayout, 5000);
		onCleanup(() => clearInterval(interval));
	});

	return (
		<div
			style={{
				position: "absolute",
				inset: "0",
				width: "100vw",
				height: "100vh",
				background: "transparent",
				margin: "0",
				padding: "0",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					position: "relative",
					width: "1920px",
					height: "1080px",
					background: "transparent",
				}}
			>
				<For each={widgets()}>
					{(widget) => <SmartCanvasWidgetRenderer widget={widget} />}
				</For>

				<Show when={widgets().length === 0}>
					<div
						style={{
							position: "absolute",
							inset: "0",
							display: "flex",
							"flex-direction": "column",
							"align-items": "center",
							"justify-content": "center",
							color: "rgba(255, 255, 255, 0.5)",
						}}
					>
						<div style={{ "font-size": "4rem", "margin-bottom": "1rem" }}>
							🎨
						</div>
						<h3
							style={{
								"font-size": "1.5rem",
								"font-weight": "600",
								"margin-bottom": "0.5rem",
							}}
						>
							No Widgets
						</h3>
						<p style={{ "font-size": "0.875rem" }}>
							Configure your Smart Canvas in the dashboard
						</p>
					</div>
				</Show>
			</div>
		</div>
	);
}
