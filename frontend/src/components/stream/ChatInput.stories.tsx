import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { input } from "~/design-system/design-system";

function ChatInputDemo() {
	return (
		<div style={{ width: "500px", padding: "16px", background: "white" }}>
			<div class="flex items-stretch">
				<input
					class={`${input.text} flex-1`}
					placeholder="Send a message..."
					type="text"
				/>
				<button
					class="send-btn shrink-0 rounded-r-lg bg-purple-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-purple-700"
					type="button">
					Send
				</button>
			</div>
		</div>
	);
}

const meta = {
	title: "Stream/ChatInput",
	component: ChatInputDemo,
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof ChatInputDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
