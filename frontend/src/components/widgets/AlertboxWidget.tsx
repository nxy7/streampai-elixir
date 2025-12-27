import { createMemo, Show } from "solid-js";
import {
	getEventColor,
	getEventGradient,
	getEventLabel,
	getPlatformName,
} from "~/lib/eventMetadata";
import {
	formatAmount,
	getFontClass,
	getPositionClass,
} from "~/lib/widgetHelpers";

interface AlertEvent {
	id: string;
	type: "donation" | "follow" | "subscription" | "raid";
	username: string;
	message?: string;
	amount?: number;
	currency?: string;
	timestamp: Date;
	displayTime?: number;
	ttsUrl?: string;
	platform: {
		icon: string;
		color: string;
	};
}

interface AlertConfig {
	animationType: "slide" | "fade" | "bounce";
	displayDuration: number;
	soundEnabled: boolean;
	soundVolume: number;
	showMessage: boolean;
	showAmount: boolean;
	fontSize: "small" | "medium" | "large";
	alertPosition: "top" | "center" | "bottom";
}

interface AlertboxWidgetProps {
	config: AlertConfig;
	event: AlertEvent | null;
}

export default function AlertboxWidget(props: AlertboxWidgetProps) {
	const fontClass = createMemo(() =>
		getFontClass(props.config.fontSize, "alertbox"),
	);

	const positionClass = createMemo(() =>
		getPositionClass(props.config.alertPosition),
	);

	// Custom label mapping for alertbox (slightly different from generic labels)
	const getAlertTypeLabel = (type: string) => {
		const labels: Record<string, string> = {
			donation: "Donation",
			follow: "New Follower",
			subscription: "New Subscriber",
			raid: "Raid",
		};
		return labels[type] || getEventLabel(type);
	};

	return (
		<div class="alertbox-widget relative h-full w-full overflow-hidden">
			<style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.85) translateY(20px); filter: blur(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-60px) scale(0.8) rotateX(15deg); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); filter: blur(0px); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.2) translateY(-100px) rotateZ(-5deg); filter: blur(4px); }
          50% { opacity: 1; transform: scale(1.15) translateY(-10px) rotateZ(2deg); filter: blur(1px); }
          75% { transform: scale(0.95) translateY(5px) rotateZ(-1deg); filter: blur(0px); }
          100% { opacity: 1; transform: scale(1) translateY(0) rotateZ(0deg); filter: blur(0px); }
        }
        @keyframes fade-out {
          from { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
          to { opacity: 0; transform: scale(0.85) translateY(-20px); filter: blur(4px); }
        }
        @keyframes slide-out {
          from { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); filter: blur(0px); }
          to { opacity: 0; transform: translateY(-60px) scale(0.8) rotateX(15deg); filter: blur(4px); }
        }
        @keyframes bounce-out {
          0% { opacity: 1; transform: scale(1) translateY(0) rotateZ(0deg); filter: blur(0px); }
          25% { transform: scale(1.05) translateY(-5px) rotateZ(1deg); filter: blur(0px); }
          50% { opacity: 1; transform: scale(0.95) translateY(10px) rotateZ(-2deg); filter: blur(1px); }
          100% { opacity: 0; transform: scale(0.2) translateY(100px) rotateZ(5deg); filter: blur(4px); }
        }
        .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-in { animation: slide-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounce-in { animation: bounce-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-out { animation: fade-out 0.6s cubic-bezier(0.3, 0, 0.8, 0.15) forwards; }
        .animate-slide-out { animation: slide-out 0.5s cubic-bezier(0.3, 0, 0.8, 0.15) forwards; }
        .animate-bounce-out { animation: bounce-out 0.8s cubic-bezier(0.3, 0, 0.8, 0.15) forwards; }
      `}</style>

			<div class={`absolute inset-0 flex justify-center ${positionClass()}`}>
				<Show when={props.event}>
					<div
						class={`alert-card relative mx-4 w-96 rounded-lg border border-white/20 bg-linear-to-br from-gray-900/95 to-gray-800/95 p-8 shadow-2xl backdrop-blur-lg ${fontClass()} animate-${props.config.animationType}-in`}>
						<div class="absolute inset-0 rounded-lg bg-linear-to-r from-purple-500/50 to-pink-500/50 opacity-20 blur-sm"></div>
						<div
							class={`absolute inset-0 rounded-lg bg-linear-to-r ${getEventGradient(props.event?.type || "donation")} animate-pulse opacity-10`}></div>

						<div class="relative z-10">
							<div class="mb-6 text-center">
								<div
									class={`font-extrabold text-sm uppercase tracking-wider ${getEventColor(props.event?.type || "donation")} mb-2 drop-shadow-sm`}>
									{getAlertTypeLabel(props.event?.type || "donation")}
								</div>
								<div class="font-bold text-2xl text-white drop-shadow-sm">
									{props.event?.username}
								</div>
								<div class="mt-3 flex justify-center">
									<div class="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-semibold text-white text-xs backdrop-blur-sm">
										<span class="opacity-70">via</span>{" "}
										<span class="font-bold">
											{getPlatformName(props.event?.platform.icon || "")}
										</span>
									</div>
								</div>
							</div>

							<Show when={props.config.showAmount && props.event?.amount}>
								<div class="mb-6 text-center">
									<div class="relative inline-block">
										<div class="absolute inset-0 font-black text-4xl text-green-400 opacity-50 blur-sm">
											{formatAmount(props.event?.amount, props.event?.currency)}
										</div>
										<div class="relative font-black text-4xl text-green-400 drop-shadow-lg">
											{formatAmount(props.event?.amount, props.event?.currency)}
										</div>
									</div>
								</div>
							</Show>

							<Show when={props.config.showMessage && props.event?.message}>
								<div class="mb-4 text-center">
									<div class="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
										<div class="font-medium text-gray-200 leading-relaxed">
											{props.event?.message}
										</div>
									</div>
								</div>
							</Show>

							<div class="absolute top-4 right-4 h-2 w-2 animate-pulse rounded-full bg-white/30"></div>
							<div class="absolute bottom-4 left-4 h-1 w-1 animate-pulse rounded-full bg-white/20 delay-300"></div>
						</div>

						<div class="absolute right-0 bottom-0 left-0 h-1 overflow-hidden rounded-b-lg bg-white/10">
							<div
								class="h-full bg-linear-to-r from-purple-500 to-pink-500"
								style={{
									width: "100%",
									animation: `progress-width-shrink ${props.config.displayDuration}s linear forwards`,
								}}></div>
						</div>
					</div>
				</Show>
			</div>

			<style>{`
        @keyframes progress-width-shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
		</div>
	);
}
