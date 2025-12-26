import AlertboxWidget from "./widgets/AlertboxWidget";
import ChatWidget from "./widgets/ChatWidget";
import DonationGoalWidget from "./widgets/DonationGoalWidget";
import EventListWidget from "./widgets/EventListWidget";
import FollowerCountWidget from "./widgets/FollowerCountWidget";
import GiveawayWidget from "./widgets/GiveawayWidget";
import PlaceholderWidget from "./widgets/PlaceholderWidget";
import PollWidget from "./widgets/PollWidget";
import SliderWidget from "./widgets/SliderWidget";
import TimerWidget from "./widgets/TimerWidget";
import TopDonorsWidget from "./widgets/TopDonorsWidget";
import ViewerCountWidget from "./widgets/ViewerCountWidget";

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

// Widget config defaults - these are merged with user configs at runtime
// Using explicit type for the record since configs are dynamically merged
const DEFAULT_CONFIGS: Record<string, Record<string, unknown>> = {
	placeholder: {
		message: "Placeholder Widget",
		fontSize: 24,
		textColor: "#ffffff",
		backgroundColor: "#9333ea",
		borderColor: "#ffffff",
		borderWidth: 2,
		padding: 16,
		borderRadius: 8,
	},
	"viewer-count": {
		label: "viewers",
		fontSize: 32,
		textColor: "#ffffff",
		backgroundColor: "#8b5cf6",
		showIcon: true,
	},
	"follower-count": {
		label: "followers",
		fontSize: 32,
		textColor: "#ffffff",
		backgroundColor: "#ec4899",
		showIcon: true,
	},
	timer: {
		duration: 300,
		fontSize: 48,
		textColor: "#ffffff",
		backgroundColor: "#3b82f6",
		showLabel: true,
		label: "Time Remaining",
	},
	chat: {
		maxMessages: 10,
		fontSize: 16,
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		textColor: "#ffffff",
		showAvatars: true,
	},
	eventlist: {
		maxEvents: 5,
		fontSize: 16,
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		textColor: "#ffffff",
		showIcons: true,
	},
	topdonors: {
		maxDonors: 5,
		fontSize: 18,
		backgroundColor: "rgba(0, 0, 0, 0.9)",
		textColor: "#ffffff",
		showRank: true,
	},
	alertbox: {
		duration: 5,
		fontSize: 32,
		backgroundColor: "#8b5cf6",
		textColor: "#ffffff",
		soundEnabled: true,
	},
	poll: {
		question: "What should we play next?",
		options: ["Game 1", "Game 2", "Game 3"],
		fontSize: 20,
		backgroundColor: "rgba(0, 0, 0, 0.9)",
		textColor: "#ffffff",
	},
	giveaway: {
		title: "Giveaway!",
		prize: "Amazing Prize",
		fontSize: 24,
		backgroundColor: "#ec4899",
		textColor: "#ffffff",
	},
	slider: {
		slides: [
			{ text: "Slide 1", duration: 5 },
			{ text: "Slide 2", duration: 5 },
		],
		fontSize: 24,
		backgroundColor: "#8b5cf6",
		textColor: "#ffffff",
	},
	"donation-goal": {
		goal: 1000,
		current: 450,
		title: "Support the Stream!",
		fontSize: 24,
		backgroundColor: "#10b981",
		textColor: "#ffffff",
		showPercentage: true,
	},
};

export default function SmartCanvasWidgetRenderer(props: WidgetRendererProps) {
	const getConfig = <T,>(): T => {
		const defaultConfig = DEFAULT_CONFIGS[props.widget.widgetType] || {};
		return { ...defaultConfig, ...props.widget.config } as T;
	};

	const renderWidgetContent = () => {
		switch (props.widget.widgetType) {
			case "placeholder":
				return <PlaceholderWidget config={getConfig()} />;

			case "viewer-count":
				return <ViewerCountWidget config={getConfig()} data={null} />;

			case "follower-count":
				return (
					<FollowerCountWidget
						config={getConfig()}
						count={Math.floor(Math.random() * 10000)}
					/>
				);

			case "timer":
				return <TimerWidget config={getConfig()} />;

			case "chat":
				return <ChatWidget config={getConfig()} messages={[]} />;

			case "eventlist":
				return <EventListWidget config={getConfig()} events={[]} />;

			case "topdonors":
				return <TopDonorsWidget config={getConfig()} donors={[]} />;

			case "alertbox":
				return <AlertboxWidget config={getConfig()} event={null} />;

			case "poll":
				return <PollWidget config={getConfig()} />;

			case "giveaway":
				return <GiveawayWidget config={getConfig()} />;

			case "slider":
				return <SliderWidget config={getConfig()} />;

			case "donation-goal":
				return <DonationGoalWidget config={getConfig()} currentAmount={0} />;

			default:
				return (
					<div class="flex h-full w-full items-center justify-center rounded-lg border-2 border-white/20 bg-linear-to-br from-gray-500 to-gray-700 p-4 text-white shadow-lg">
						<div class="text-center">
							<div class="mb-2 text-4xl">❓</div>
							<div class="font-semibold">Unknown Widget</div>
							<div class="text-sm opacity-80">{props.widget.widgetType}</div>
						</div>
					</div>
				);
		}
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
