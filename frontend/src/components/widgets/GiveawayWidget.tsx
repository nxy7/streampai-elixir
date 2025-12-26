import { createMemo, Show } from "solid-js";

interface GiveawayConfig {
	showTitle: boolean;
	title: string;
	showDescription: boolean;
	description: string;
	activeLabel: string;
	inactiveLabel: string;
	winnerLabel: string;
	entryMethodText: string;
	showEntryMethod: boolean;
	showProgressBar: boolean;
	targetParticipants: number;
	patreonMultiplier: number;
	patreonBadgeText: string;
	winnerAnimation: "fade" | "slide" | "bounce" | "confetti";
	titleColor: string;
	textColor: string;
	backgroundColor: string;
	accentColor: string;
	fontSize: "small" | "medium" | "large" | "extra-large";
	showPatreonInfo: boolean;
}

interface GiveawayUpdate {
	type: "update";
	participants: number;
	patreons: number;
	isActive: boolean;
}

interface GiveawayResult {
	type: "result";
	winner: {
		username: string;
		isPatreon: boolean;
	};
	totalParticipants: number;
	patreonParticipants: number;
}

type GiveawayEvent = GiveawayUpdate | GiveawayResult;

interface GiveawayWidgetProps {
	config: GiveawayConfig;
	event?: GiveawayEvent;
}

export default function GiveawayWidget(props: GiveawayWidgetProps) {
	const participantCount = createMemo(() => {
		if (!props.event) return 0;
		return props.event.type === "update"
			? props.event.participants
			: props.event.totalParticipants;
	});

	const patreonCount = createMemo(() => {
		if (!props.event) return 0;
		return props.event.type === "update"
			? props.event.patreons
			: props.event.patreonParticipants;
	});

	const isActive = createMemo(() => {
		if (!props.event) return false;
		return props.event.type === "update" && props.event.isActive;
	});

	const winner = createMemo(() => {
		if (!props.event || props.event.type !== "result") return null;
		return props.event.winner;
	});

	const progressPercentage = createMemo(() => {
		if (!props.config.showProgressBar || props.config.targetParticipants <= 0)
			return 0;
		return Math.min(
			100,
			(participantCount() / props.config.targetParticipants) * 100,
		);
	});

	const winnerAnimationClass = createMemo(() => {
		if (!winner()) return "";
		return `winner-${props.config.winnerAnimation}`;
	});

	const fontSizeClass = createMemo(() => {
		return `font-${props.config.fontSize}`;
	});

	return (
		<div
			class={`giveaway-widget ${fontSizeClass()} ${winner() ? "has-winner" : ""} ${isActive() ? "is-active" : ""}`}
			style={{
				"font-family":
					"'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
				color: props.config.textColor,
				padding: "1rem",
			}}>
			<style>{`
        .winner-fade { animation: fadeIn 1s ease-out; }
        .winner-slide { animation: slideInUp 1s ease-out; }
        .winner-bounce { animation: bounceIn 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .winner-confetti { animation: confettiCelebration 2s ease-out; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes confettiCelebration {
          0% { transform: scale(0.5) rotateZ(0deg); opacity: 0; }
          50% { transform: scale(1.1) rotateZ(180deg); opacity: 1; }
          100% { transform: scale(1) rotateZ(360deg); opacity: 1; }
        }

        .font-small .count-value { font-size: 1.5em; }
        .font-small .giveaway-title { font-size: 1.2em; }
        .font-small .winner-name { font-size: 1.4em; }
        .font-medium .count-value { font-size: 2em; }
        .font-medium .giveaway-title { font-size: 1.5em; }
        .font-medium .winner-name { font-size: 1.8em; }
        .font-large .count-value { font-size: 2.5em; }
        .font-large .giveaway-title { font-size: 1.75em; }
        .font-large .winner-name { font-size: 2.2em; }
        .font-extra-large .count-value { font-size: 3em; }
        .font-extra-large .giveaway-title { font-size: 2em; }
        .font-extra-large .winner-name { font-size: 2.5em; }
      `}</style>

			<div
				class="giveaway-container"
				style={{
					"background-color": props.config.backgroundColor,
					"border-radius": "0.75rem",
					padding: "1.5rem",
					"box-shadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
					"text-align": "center",
					position: "relative",
					overflow: "hidden",
				}}>
				<Show when={props.config.showTitle && props.config.title}>
					<div
						class="giveaway-title"
						style={{
							"font-size": "1.5em",
							"font-weight": "bold",
							color: props.config.titleColor,
							"margin-bottom": "0.75rem",
							"line-height": "1.2",
						}}>
						{props.config.title}
					</div>
				</Show>

				<Show when={props.config.showDescription && props.config.description}>
					<div
						class="giveaway-description"
						style={{
							"font-size": "0.9em",
							opacity: "0.9",
							"margin-bottom": "1rem",
							"line-height": "1.4",
						}}>
						{props.config.description}
					</div>
				</Show>

				<div class="giveaway-status" style={{ "margin-bottom": "1rem" }}>
					<Show when={isActive()}>
						<div
							class="status-active"
							style={{
								padding: "0.75rem",
								"border-radius": "0.5rem",
								background: `linear-gradient(135deg, ${props.config.accentColor} 0%, color-mix(in srgb, ${props.config.accentColor} 80%, transparent) 100%)`,
								color: "white",
							}}>
							<div
								class="status-label"
								style={{
									"font-size": "0.875em",
									"font-weight": "600",
									"margin-bottom": "0.5rem",
									"text-transform": "uppercase",
									"letter-spacing": "0.05em",
								}}>
								{props.config.activeLabel || "Giveaway Active"}
							</div>

							<div class="participant-count" style={{ margin: "0.75rem 0" }}>
								<div
									class="count-value"
									style={{
										"font-size": "2em",
										"font-weight": "bold",
										"line-height": "1",
										"margin-bottom": "0.25rem",
									}}>
									{participantCount()}
								</div>
								<div
									class="count-label"
									style={{ "font-size": "0.875em", opacity: "0.9" }}>
									{participantCount() === 1 ? "Participant" : "Participants"}
								</div>
							</div>

							<Show
								when={props.config.patreonMultiplier > 1 && patreonCount() > 0}>
								<div
									class="patreon-info"
									style={{
										"margin-top": "0.5rem",
										"font-size": "0.8em",
										opacity: "0.9",
										padding: "0.25rem 0.5rem",
										"background-color": "rgba(255, 255, 255, 0.2)",
										"border-radius": "0.25rem",
										display: "inline-block",
									}}>
									{patreonCount()} Patreons ({props.config.patreonMultiplier}x
									entries)
								</div>
							</Show>

							<Show when={props.config.showEntryMethod}>
								<div
									class="entry-method"
									style={{
										"margin-top": "0.75rem",
										"font-size": "0.875em",
										"font-weight": "500",
										padding: "0.375rem 0.75rem",
										"background-color": "rgba(255, 255, 255, 0.2)",
										"border-radius": "0.375rem",
										display: "inline-block",
									}}>
									{props.config.entryMethodText || "Type !join to enter"}
								</div>
							</Show>
						</div>
					</Show>

					<Show when={winner()}>
						<div
							class={`status-winner ${winnerAnimationClass()}`}
							style={{
								padding: "1rem",
								"border-radius": "0.5rem",
								background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
								color: "white",
							}}>
							<div
								class="winner-label"
								style={{
									"font-size": "1.1em",
									"font-weight": "600",
									"margin-bottom": "0.5rem",
									"text-transform": "uppercase",
									"letter-spacing": "0.05em",
								}}>
								{props.config.winnerLabel || "Winner!"}
							</div>

							<div
								class="winner-name"
								style={{
									"font-size": "1.8em",
									"font-weight": "bold",
									"margin-bottom": "0.5rem",
									"line-height": "1.1",
								}}>
								{winner()?.username}
							</div>

							<Show when={winner()?.isPatreon}>
								<div
									class="winner-patreon-badge"
									style={{
										display: "inline-block",
										padding: "0.25rem 0.75rem",
										background:
											"linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
										"border-radius": "0.375rem",
										"font-size": "0.75em",
										"font-weight": "600",
										"text-transform": "uppercase",
										"letter-spacing": "0.05em",
									}}>
									{props.config.patreonBadgeText || "Patreon"}
								</div>
							</Show>
						</div>
					</Show>

					<Show when={!isActive() && !winner()}>
						<div
							class="status-inactive"
							style={{
								padding: "0.75rem",
								"border-radius": "0.5rem",
								"background-color": "rgba(107, 114, 128, 0.1)",
								color: props.config.textColor,
								opacity: "0.7",
							}}>
							<div
								class="inactive-label"
								style={{ "font-size": "1em", "font-weight": "500" }}>
								{props.config.inactiveLabel || "No Active Giveaway"}
							</div>
						</div>
					</Show>
				</div>

				<Show
					when={
						props.config.showProgressBar && props.config.targetParticipants > 0
					}>
					<div class="progress-container" style={{ "margin-top": "1rem" }}>
						<div
							class="progress-bar"
							style={{
								width: "100%",
								height: "8px",
								"background-color": "rgba(0, 0, 0, 0.1)",
								"border-radius": "4px",
								overflow: "hidden",
								"margin-bottom": "0.5rem",
							}}>
							<div
								class="progress-fill"
								style={{
									height: "100%",
									width: `${progressPercentage()}%`,
									"border-radius": "4px",
									"background-color": props.config.accentColor,
									transition: "width 0.8s ease",
								}}
							/>
						</div>
						<div
							class="progress-text"
							style={{
								"font-size": "0.875em",
								opacity: "0.8",
								"font-weight": "500",
							}}>
							{participantCount()} / {props.config.targetParticipants}
						</div>
					</div>
				</Show>
			</div>
		</div>
	);
}
