import { useParams } from "@solidjs/router";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import DonationGoalWidget from "~/components/widgets/DonationGoalWidget";
import { getWidgetConfig } from "~/sdk/ash_rpc";

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

const DEFAULT_CONFIG: DonationGoalConfig = {
	goalAmount: 1000,
	startingAmount: 0,
	currency: "$",
	startDate: new Date().toISOString().split("T")[0],
	endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
		.toISOString()
		.split("T")[0],
	title: "Donation Goal",
	showPercentage: true,
	showAmountRaised: true,
	showDaysLeft: true,
	theme: "default",
	barColor: "#10b981",
	backgroundColor: "#e5e7eb",
	textColor: "#1f2937",
	animationEnabled: true,
};

export default function DonationGoalWidgetDisplay() {
	const params = useParams<{ userId: string }>();
	const [config, setConfig] = createSignal<DonationGoalConfig | null>(null);

	async function loadConfig() {
		const userId = params.userId;
		if (!userId) return;

		const result = await getWidgetConfig({
			input: { userId, type: "donation_goal_widget" },
			fields: ["id", "config"],
			fetchOptions: { credentials: "include" },
		});

		if (result.success && result.data.config) {
			const loadedConfig = result.data.config;
			setConfig({
				goalAmount: loadedConfig.goal_amount ?? DEFAULT_CONFIG.goalAmount,
				startingAmount:
					loadedConfig.starting_amount ?? DEFAULT_CONFIG.startingAmount,
				currency: loadedConfig.currency ?? DEFAULT_CONFIG.currency,
				startDate: loadedConfig.start_date ?? DEFAULT_CONFIG.startDate,
				endDate: loadedConfig.end_date ?? DEFAULT_CONFIG.endDate,
				title: loadedConfig.title ?? DEFAULT_CONFIG.title,
				showPercentage:
					loadedConfig.show_percentage ?? DEFAULT_CONFIG.showPercentage,
				showAmountRaised:
					loadedConfig.show_amount_raised ?? DEFAULT_CONFIG.showAmountRaised,
				showDaysLeft:
					loadedConfig.show_days_left ?? DEFAULT_CONFIG.showDaysLeft,
				theme: loadedConfig.theme ?? DEFAULT_CONFIG.theme,
				barColor: loadedConfig.bar_color ?? DEFAULT_CONFIG.barColor,
				backgroundColor:
					loadedConfig.background_color ?? DEFAULT_CONFIG.backgroundColor,
				textColor: loadedConfig.text_color ?? DEFAULT_CONFIG.textColor,
				animationEnabled:
					loadedConfig.animation_enabled ?? DEFAULT_CONFIG.animationEnabled,
			});
		} else {
			setConfig(DEFAULT_CONFIG);
		}
	}

	onMount(() => {
		loadConfig();
		const interval = setInterval(loadConfig, 5000);
		onCleanup(() => clearInterval(interval));
	});

	return (
		<div
			style={{
				background: "transparent",
				width: "100vw",
				height: "100vh",
				display: "flex",
				"align-items": "center",
				"justify-content": "center",
				padding: "1rem",
			}}
		>
			<Show when={config()}>
				<div style={{ "max-width": "600px", width: "100%" }}>
					<DonationGoalWidget
						config={config() as NonNullable<ReturnType<typeof config>>}
						currentAmount={config()?.startingAmount}
					/>
				</div>
			</Show>
		</div>
	);
}
