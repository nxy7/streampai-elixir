import { renderWidget } from "./widgetRegistry";

interface CanvasWidget {
	id: string;
	widgetType: string;
	x: number;
	y: number;
	width: number;
	height: number;
	config?: Record<string, unknown>;
}

interface WidgetRendererProps {
	widget: CanvasWidget;
}

export default function SmartCanvasWidgetRenderer(props: WidgetRendererProps) {
	const renderWidgetContent = () => {
		const rendered = renderWidget(props.widget.widgetType, props.widget.config);

		if (rendered) {
			return rendered;
		}

		// Fallback for unknown widget types
		return (
			<div class="flex h-full w-full items-center justify-center rounded-lg border-2 border-white/20 bg-linear-to-br from-neutral-500 to-neutral-700 p-4 text-white shadow-lg">
				<div class="text-center">
					<div class="mb-2 text-4xl">&#x2753;</div>
					<div class="font-semibold">Unknown Widget</div>
					<div class="text-sm opacity-80">{props.widget.widgetType}</div>
				</div>
			</div>
		);
	};

	return (
		<div
			class="absolute"
			style={{
				left: `${props.widget.x}px`,
				top: `${props.widget.y}px`,
				width: `${props.widget.width}px`,
				height: `${props.widget.height}px`,
				overflow: "hidden",
			}}>
			<div class="flex h-full w-full items-center justify-center">
				{renderWidgetContent()}
			</div>
		</div>
	);
}
