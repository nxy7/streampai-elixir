import { Show } from "solid-js";

interface FollowerCountConfig {
	label: string;
	fontSize: number;
	textColor: string;
	backgroundColor: string;
	showIcon: boolean;
	animateOnChange: boolean;
}

interface FollowerCountWidgetProps {
	config: FollowerCountConfig;
	count?: number;
}

export default function FollowerCountWidget(props: FollowerCountWidgetProps) {
	const displayCount = () => props.count ?? 0;

	return (
		<div
			style={{
				"background-color": props.config.backgroundColor,
				color: props.config.textColor,
				"font-size": `${props.config.fontSize}px`,
				display: "inline-flex",
				"align-items": "center",
				gap: "12px",
				padding: "16px 24px",
				"border-radius": "12px",
				"font-weight": "bold",
				"font-family": "system-ui, -apple-system, sans-serif",
				"box-shadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
				transition: props.config.animateOnChange
					? "transform 0.3s ease"
					: "none",
			}}>
			<Show when={props.config.showIcon}>
				<svg
					aria-hidden="true"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="currentColor"
					style={{ "flex-shrink": "0" }}>
					<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
			</Show>
			<span>{displayCount().toLocaleString()}</span>
			<Show when={props.config.label}>
				<span style={{ "font-size": "0.7em", opacity: "0.9" }}>
					{props.config.label}
				</span>
			</Show>
		</div>
	);
}
