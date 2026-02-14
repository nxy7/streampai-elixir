import PlaceholderWidget from "~/components/widgets/PlaceholderWidget";
import { createWidgetRoute } from "~/lib/createWidgetRoute";

interface PlaceholderConfig {
	message: string;
	fontSize: number;
	textColor: string;
	backgroundColor: string;
	borderColor: string;
	borderWidth: number;
	padding: number;
	borderRadius: number;
}

export default createWidgetRoute<PlaceholderConfig>({
	widgetType: "placeholder_widget",
	title: "Placeholder Widget",
	defaults: {
		message: "Placeholder Widget",
		fontSize: 24,
		textColor: "#ffffff",
		backgroundColor: "#9333ea",
		borderColor: "#ffffff",
		borderWidth: 2,
		padding: 16,
		borderRadius: 8,
	},
	render: (config) => <PlaceholderWidget config={config} />,
});
