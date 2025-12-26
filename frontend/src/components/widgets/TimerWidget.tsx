import { createEffect, createSignal, onCleanup, onMount } from "solid-js";

interface TimerConfig {
	label: string;
	fontSize: number;
	textColor: string;
	backgroundColor: string;
	countdownMinutes: number;
	autoStart: boolean;
}

interface TimerWidgetProps {
	config: TimerConfig;
}

export default function TimerWidget(props: TimerWidgetProps) {
	const [seconds, setSeconds] = createSignal(0);
	const [isRunning, setIsRunning] = createSignal(false);

	function formatTime(totalSeconds: number): string {
		const absSeconds = Math.abs(totalSeconds);
		const mins = Math.floor(absSeconds / 60);
		const secs = absSeconds % 60;
		const sign = totalSeconds < 0 ? "-" : "";
		return `${sign}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}

	createEffect(() => {
		setSeconds(props.config.countdownMinutes * 60);
		setIsRunning(props.config.autoStart);
	});

	onMount(() => {
		const interval = setInterval(() => {
			if (isRunning()) {
				setSeconds((s) => {
					const newValue = s - 1;
					if (newValue <= 0 && !props.config.autoStart) {
						setIsRunning(false);
						return 0;
					}
					return newValue;
				});
			}
		}, 1000);

		onCleanup(() => clearInterval(interval));
	});

	return (
		<div
			style={{
				"background-color": props.config.backgroundColor,
				color: props.config.textColor,
				"font-size": `${props.config.fontSize}px`,
				display: "inline-flex",
				"flex-direction": "column",
				"align-items": "center",
				gap: "8px",
				padding: "16px 32px",
				"border-radius": "12px",
				"font-weight": "bold",
				"font-family": "system-ui, -apple-system, sans-serif",
				"box-shadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
				"min-width": "200px",
			}}>
			<div
				style={{ "font-variant-numeric": "tabular-nums", "line-height": "1" }}>
				{formatTime(seconds())}
			</div>
			{props.config.label && (
				<div
					style={{
						"font-size": "0.5em",
						opacity: "0.9",
						"letter-spacing": "0.05em",
					}}>
					{props.config.label}
				</div>
			)}
		</div>
	);
}
