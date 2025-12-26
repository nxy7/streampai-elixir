import {
	createMemo,
	createSignal,
	For,
	onCleanup,
	onMount,
	Show,
} from "solid-js";

interface DonationEvent {
	id: string;
	amount: number;
	currency: string;
	username: string;
	timestamp: Date;
}

interface FloatingBubble {
	id: string;
	amount: number;
	currency: string;
	x: number;
	y: number;
}

interface DonationGoalConfig {
	goalAmount: number;
	startingAmount: number;
	currency: string;
	startDate: string;
	endDate: string;
	title: string;
	showPercentage: boolean;
	showAmountRaised: boolean;
	showDaysLeft: boolean;
	theme: "default" | "minimal" | "modern";
	barColor: string;
	backgroundColor: string;
	textColor: string;
	animationEnabled: boolean;
}

interface DonationGoalWidgetProps {
	config: DonationGoalConfig;
	currentAmount: number;
	donation?: DonationEvent | null;
}

export default function DonationGoalWidget(props: DonationGoalWidgetProps) {
	const [floatingBubbles, setFloatingBubbles] = createSignal<FloatingBubble[]>(
		[],
	);
	const [lastDonationId, setLastDonationId] = createSignal<string | null>(null);

	const progressPercentage = createMemo(() => {
		const total = props.currentAmount || props.config.startingAmount || 0;
		const goal = props.config.goalAmount || 1000;
		return Math.min((total / goal) * 100, 100);
	});

	const formattedGoal = createMemo(() => {
		const currency = props.config.currency || "$";
		const amount = props.config.goalAmount || 1000;
		return `${currency}${amount.toLocaleString()}`;
	});

	const formattedCurrent = createMemo(() => {
		const currency = props.config.currency || "$";
		const amount = props.currentAmount || props.config.startingAmount || 0;
		return `${currency}${amount.toLocaleString()}`;
	});

	const daysLeft = createMemo(() => {
		if (!props.config.endDate) return null;
		const end = new Date(props.config.endDate);
		const now = new Date();
		const diff = end.getTime() - now.getTime();
		const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
		return days > 0 ? days : 0;
	});

	const themeClasses = createMemo(() => {
		switch (props.config.theme) {
			case "minimal":
				return "theme-minimal";
			case "modern":
				return "theme-modern";
			default:
				return "theme-default";
		}
	});

	onMount(() => {
		let timeoutId: number | undefined;

		if (
			props.donation &&
			props.config.animationEnabled &&
			props.donation.id !== lastDonationId()
		) {
			setLastDonationId(props.donation.id);
			const bubble: FloatingBubble = {
				id: props.donation.id,
				amount: props.donation.amount,
				currency: props.donation.currency || props.config.currency || "$",
				x: Math.random() * 80 + 10,
				y: 0,
			};
			setFloatingBubbles([...floatingBubbles(), bubble]);
			timeoutId = window.setTimeout(() => {
				setFloatingBubbles(floatingBubbles().filter((b) => b.id !== bubble.id));
			}, 4000);
		}

		onCleanup(() => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId);
			}
		});
	});

	return (
		<div class="widget-container" style={{ width: "100%", height: "100%" }}>
			<style>{`
        .donation-goal-widget {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          padding: 1.5rem;
          border-radius: 1.25rem;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
          backdrop-filter: blur(20px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-sizing: border-box;
        }
        .title-text {
          font-size: 1.5rem;
          font-weight: 800;
          position: relative;
          z-index: 2;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .progress-track {
          position: relative;
          height: 2.5rem;
          margin-bottom: 1rem;
        }
        .progress-background {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, color-mix(in srgb, var(--bg-color, #e5e7eb) 90%, white), var(--bg-color, #e5e7eb), color-mix(in srgb, var(--bg-color, #e5e7eb) 90%, black));
          border-radius: 1.25rem;
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .progress-bar {
          position: relative;
          height: 100%;
          background: linear-gradient(135deg, var(--bar-color, #10b981), color-mix(in srgb, var(--bar-color, #10b981) 80%, white), var(--bar-color, #10b981), color-mix(in srgb, var(--bar-color, #10b981) 90%, white));
          border-radius: 1.25rem;
          transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.7) rotate(-5deg); opacity: 0; }
          15% { transform: translateY(-15px) scale(1.2) rotate(2deg); opacity: 1; }
          85% { transform: translateY(-80px) scale(1) rotate(-2deg); opacity: 1; }
          100% { transform: translateY(-120px) scale(0.8) rotate(5deg); opacity: 0; }
        }
        .floating-bubble {
          position: absolute;
          pointer-events: none;
          animation: floatUp 4s ease-out forwards;
          z-index: 15;
        }
        .theme-minimal { background: rgba(255, 255, 255, 0.9); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 1.5rem; }
        .theme-minimal .progress-track { height: 1.5rem; }
        .theme-minimal .title-text { font-size: 1.25rem; }
        .theme-modern {
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
          border: 1px solid rgba(148, 163, 184, 0.1);
          color: #e2e8f0;
        }
      `}</style>

			<div
				class={`donation-goal-widget ${themeClasses()}`}
				style={{
					"--bar-color": props.config.barColor || "#10b981",
					"--bg-color": props.config.backgroundColor || "#e5e7eb",
					"--text-color": props.config.textColor || "#1f2937",
					color: props.config.textColor || "#1f2937",
				}}
			>
				<Show when={props.config.title}>
					<div
						class="widget-title"
						style={{
							position: "relative",
							"text-align": "center",
							"margin-bottom": "1rem",
							overflow: "hidden",
							"flex-shrink": "0",
						}}
					>
						<span class="title-text" style={{ color: props.config.textColor }}>
							{props.config.title}
						</span>
					</div>
				</Show>

				<div class="progress-section" style={{ position: "relative" }}>
					<div
						class="progress-container"
						style={{ position: "relative", "margin-bottom": "1rem" }}
					>
						<div
							class="progress-labels"
							style={{
								display: "flex",
								"justify-content": "space-between",
								"margin-bottom": "0.75rem",
								"font-weight": "600",
							}}
						>
							<Show when={props.config.showAmountRaised}>
								<div
									class="current-amount"
									style={{
										color: props.config.barColor,
										"font-size": "1.1rem",
										"font-weight": "800",
										"text-shadow": "0 1px 2px rgba(0, 0, 0, 0.1)",
									}}
								>
									{formattedCurrent()}
								</div>
							</Show>
							<div
								class="goal-amount"
								style={{
									color: `color-mix(in srgb, ${props.config.textColor} 70%, transparent)`,
									"font-size": "1rem",
								}}
							>
								{formattedGoal()}
							</div>
						</div>

						<div class="progress-track">
							<div class="progress-background">
								<div class="progress-texture"></div>
							</div>
							<div
								class="progress-bar"
								style={{ width: `${progressPercentage()}%` }}
							>
								<Show when={props.config.animationEnabled}>
									<div
										style={{
											position: "absolute",
											top: 0,
											left: "-100%",
											width: "100%",
											height: "100%",
											background:
												"linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent)",
											animation: "shimmer 3s infinite",
											"border-radius": "1.25rem",
										}}
									></div>
								</Show>
								<div
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										right: 0,
										height: "40%",
										background:
											"linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent)",
										"border-radius": "1.25rem 1.25rem 0 0",
									}}
								></div>
							</div>

							<Show when={props.config.showPercentage}>
								<div
									style={{
										position: "absolute",
										top: "-45px",
										left: `${Math.min(progressPercentage(), 95)}%`,
										transform: "translateX(-50%)",
										"z-index": "20",
									}}
								>
									<div
										style={{
											background: props.config.barColor,
											color: "white",
											padding: "0.5rem 0.75rem",
											"border-radius": "1rem",
											"font-size": "0.875rem",
											"font-weight": "700",
											"white-space": "nowrap",
											"box-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",
											position: "relative",
										}}
									>
										{Math.round(progressPercentage())}%
									</div>
								</div>
							</Show>
						</div>

						<For each={floatingBubbles()}>
							{(bubble) => (
								<div
									class="floating-bubble"
									style={{ left: `${bubble.x}%`, bottom: "0" }}
								>
									<div
										style={{
											display: "flex",
											"align-items": "center",
											background: `linear-gradient(135deg, ${props.config.barColor}, color-mix(in srgb, ${props.config.barColor} 80%, white))`,
											color: "white",
											padding: "0.5rem 1rem",
											"border-radius": "2rem",
											"font-weight": "800",
											"font-size": "0.875rem",
											"white-space": "nowrap",
											"box-shadow":
												"0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
											position: "relative",
											"z-index": "2",
										}}
									>
										<span
											style={{
												"font-size": "1.1rem",
												"margin-right": "0.25rem",
											}}
										>
											+
										</span>
										<span style={{ "font-weight": "900" }}>
											{bubble.currency}
											{bubble.amount.toFixed(2)}
										</span>
									</div>
								</div>
							)}
						</For>
					</div>

					<div
						class="stats-container"
						style={{
							display: "flex",
							"justify-content": "center",
							gap: "1rem",
							"flex-wrap": "wrap",
							"margin-top": "1rem",
						}}
					>
						<Show when={props.config.showDaysLeft && daysLeft() !== null}>
							<div
								class="days-left-subtle"
								style={{
									"font-size": "0.875rem",
									color: `color-mix(in srgb, ${props.config.textColor} 50%, transparent)`,
									"text-align": "center",
									"font-weight": "500",
									"margin-top": "0.5rem",
								}}
							>
								{daysLeft()} days left
							</div>
						</Show>
					</div>
				</div>
			</div>

			<style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>
		</div>
	);
}
