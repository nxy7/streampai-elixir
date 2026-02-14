import FollowerCountWidget from "~/components/widgets/FollowerCountWidget";
import { createWidgetRoute } from "~/lib/createWidgetRoute";

interface FollowerCountConfig {
	label: string;
	fontSize: number;
	textColor: string;
	backgroundColor: string;
	showIcon: boolean;
	animateOnChange: boolean;
}

export default createWidgetRoute<FollowerCountConfig>({
	widgetType: "follower_count_widget",
	title: "Follower Count Widget",
	defaults: {
		label: "followers",
		fontSize: 32,
		textColor: "#ffffff",
		backgroundColor: "#9333ea",
		showIcon: true,
		animateOnChange: true,
	},
	render: (config) => <FollowerCountWidget config={config} count={0} />,
});
