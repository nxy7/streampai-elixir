import { createFileRoute } from "@tanstack/solid-router";
import TimerWidget from "~/components/widgets/TimerWidget";
import { createWidgetRoute } from "~/lib/createWidgetRoute";

interface TimerConfig {
	label: string;
	fontSize: number;
	textColor: string;
	backgroundColor: string;
	countdownMinutes: number;
	autoStart: boolean;
}

const TimerDisplay = createWidgetRoute<TimerConfig>({
	widgetType: "timer_widget",
	title: "Timer Widget",
	defaults: {
		label: "TIMER",
		fontSize: 48,
		textColor: "#ffffff",
		backgroundColor: "#3b82f6",
		countdownMinutes: 5,
		autoStart: false,
	},
	render: (config) => <TimerWidget config={config} />,
});

export const Route = createFileRoute("/w/timer/$userId")({
	component: TimerDisplay,
	head: () => ({ meta: [{ title: "Timer Widget - Streampai" }] }),
});
