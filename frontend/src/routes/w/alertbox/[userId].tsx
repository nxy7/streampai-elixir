import AlertboxWidget from "~/components/widgets/AlertboxWidget";
import { createWidgetRoute } from "~/lib/createWidgetRoute";

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

export default createWidgetRoute<AlertConfig>({
	widgetType: "alertbox_widget",
	defaults: {
		animationType: "fade",
		displayDuration: 5,
		soundEnabled: true,
		soundVolume: 80,
		showMessage: true,
		showAmount: true,
		fontSize: "medium",
		alertPosition: "center",
	},
	render: (config) => <AlertboxWidget config={config} event={null} />,
});
