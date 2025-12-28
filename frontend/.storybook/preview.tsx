import type { Preview } from "storybook-solidjs-vite";
import "../src/app.css";
import { I18nProvider } from "../src/i18n";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},

		a11y: {
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: "todo",
		},
	},
	decorators: [
		(Story) => (
			<I18nProvider>
				<Story />
			</I18nProvider>
		),
	],
};

export default preview;
