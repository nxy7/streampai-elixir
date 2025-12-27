import { createSignal } from "solid-js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { z } from "zod";
import { SchemaForm } from "./SchemaForm";
import { withMeta } from "./introspect";
import {
	alertboxConfigSchema,
	chatConfigSchema,
	timerConfigSchema,
} from "./widget-schemas";

/**
 * SchemaForm automatically generates form UI from Zod schemas.
 * It introspects the schema to determine field types and renders appropriate controls.
 */
const meta = {
	title: "Forms/SchemaForm",
	component: SchemaForm,
	parameters: {
		layout: "padded",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div class="mx-auto max-w-xl rounded-lg bg-white p-6 shadow-sm">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof SchemaForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Simple schema for basic demo
const simpleSchema = z.object({
	name: withMeta(z.string().default(""), {
		label: "Your Name",
		placeholder: "Enter your name",
	}),
	age: withMeta(z.number().min(0).max(120).default(25), {
		label: "Age",
		inputType: "slider",
	}),
	favoriteColor: withMeta(z.string().default("#6366f1"), {
		label: "Favorite Color",
		inputType: "color",
	}),
	newsletter: withMeta(z.boolean().default(false), {
		label: "Subscribe to newsletter",
		description: "Get weekly updates about new features",
	}),
});

/**
 * Basic example showing all field types with auto-detection.
 */
export const Basic: Story = {
	render: () => {
		const [values, setValues] = createSignal({
			name: "",
			age: 25,
			favoriteColor: "#6366f1",
			newsletter: false,
		});

		return (
			<div class="space-y-6">
				<div>
					<h2 class="mb-4 font-semibold text-gray-900 text-lg">Basic Form</h2>
					<SchemaForm
						schema={simpleSchema}
						values={values()}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
					/>
				</div>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h3 class="mb-2 font-medium text-gray-700 text-sm">Current Values:</h3>
					<pre class="text-gray-600 text-xs">
						{JSON.stringify(values(), null, 2)}
					</pre>
				</div>
			</div>
		);
	},
};

/**
 * Timer widget configuration form - demonstrates number sliders, colors, and booleans.
 */
export const TimerConfig: Story = {
	render: () => {
		const [values, setValues] = createSignal({
			label: "TIMER",
			fontSize: 48,
			textColor: "#ffffff",
			backgroundColor: "#3b82f6",
			countdownMinutes: 5,
			autoStart: false,
		});

		return (
			<div class="space-y-6">
				<div>
					<h2 class="mb-1 font-semibold text-gray-900 text-lg">
						Timer Widget Settings
					</h2>
					<p class="mb-4 text-gray-500 text-sm">
						Auto-generated from Zod schema
					</p>
					<SchemaForm
						schema={timerConfigSchema}
						values={values()}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
					/>
				</div>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h3 class="mb-2 font-medium text-gray-700 text-sm">Config JSON:</h3>
					<pre class="text-gray-600 text-xs">
						{JSON.stringify(values(), null, 2)}
					</pre>
				</div>
			</div>
		);
	},
};

/**
 * Chat widget configuration - demonstrates select dropdowns and multiple booleans.
 */
export const ChatConfig: Story = {
	render: () => {
		const [values, setValues] = createSignal({
			fontSize: "medium" as const,
			maxMessages: 25,
			showTimestamps: false,
			showBadges: true,
			showPlatform: true,
			showEmotes: true,
		});

		return (
			<div class="space-y-6">
				<div>
					<h2 class="mb-1 font-semibold text-gray-900 text-lg">
						Chat Widget Settings
					</h2>
					<p class="mb-4 text-gray-500 text-sm">
						Form with select dropdowns and toggles
					</p>
					<SchemaForm
						schema={chatConfigSchema}
						values={values()}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
					/>
				</div>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h3 class="mb-2 font-medium text-gray-700 text-sm">Config JSON:</h3>
					<pre class="text-gray-600 text-xs">
						{JSON.stringify(values(), null, 2)}
					</pre>
				</div>
			</div>
		);
	},
};

/**
 * Alertbox configuration - demonstrates grouped fields organized into sections.
 */
export const AlertboxConfig: Story = {
	render: () => {
		const [values, setValues] = createSignal({
			animationType: "fade" as const,
			alertPosition: "center" as const,
			displayDuration: 5,
			fontSize: "medium" as const,
			showAmount: true,
			showMessage: true,
			soundEnabled: true,
			soundVolume: 80,
		});

		return (
			<div class="space-y-6">
				<div>
					<h2 class="mb-1 font-semibold text-gray-900 text-lg">
						Alertbox Widget Settings
					</h2>
					<p class="mb-4 text-gray-500 text-sm">
						Fields organized into groups (Animation, Appearance, Content, Audio)
					</p>
					<SchemaForm
						schema={alertboxConfigSchema}
						values={values()}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
					/>
				</div>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h3 class="mb-2 font-medium text-gray-700 text-sm">Config JSON:</h3>
					<pre class="text-gray-600 text-xs">
						{JSON.stringify(values(), null, 2)}
					</pre>
				</div>
			</div>
		);
	},
};

/**
 * Disabled form - all fields are read-only.
 */
export const Disabled: Story = {
	render: () => {
		const values = {
			name: "John Doe",
			age: 30,
			favoriteColor: "#10b981",
			newsletter: true,
		};

		return (
			<div>
				<h2 class="mb-1 font-semibold text-gray-900 text-lg">Disabled Form</h2>
				<p class="mb-4 text-gray-500 text-sm">
					All fields are disabled/read-only
				</p>
				<SchemaForm
					schema={simpleSchema}
					values={values}
					onChange={() => {}}
					disabled={true}
				/>
			</div>
		);
	},
};

// Schema demonstrating all field types
const allFieldTypesSchema = z.object({
	textField: withMeta(z.string().default("Hello"), {
		label: "Text Input",
		placeholder: "Type something...",
	}),
	numberField: withMeta(z.number().default(42), {
		label: "Number Input",
		inputType: "number",
	}),
	sliderField: withMeta(z.number().min(0).max(100).default(50), {
		label: "Slider Input",
		inputType: "slider",
		unit: "%",
	}),
	colorField: withMeta(z.string().default("#ff6b6b"), {
		label: "Color Picker",
		inputType: "color",
	}),
	selectField: withMeta(z.enum(["option1", "option2", "option3"]).default("option1"), {
		label: "Select Dropdown",
		inputType: "select",
	}),
	checkboxField: withMeta(z.boolean().default(true), {
		label: "Checkbox Toggle",
		description: "This is a boolean field rendered as a checkbox",
	}),
});

/**
 * Shows all available field types in one form.
 */
export const AllFieldTypes: Story = {
	render: () => {
		const [values, setValues] = createSignal({
			textField: "Hello",
			numberField: 42,
			sliderField: 50,
			colorField: "#ff6b6b",
			selectField: "option1" as const,
			checkboxField: true,
		});

		return (
			<div class="space-y-6">
				<div>
					<h2 class="mb-1 font-semibold text-gray-900 text-lg">
						All Field Types
					</h2>
					<p class="mb-4 text-gray-500 text-sm">
						Demonstrating every supported input type
					</p>
					<SchemaForm
						schema={allFieldTypesSchema}
						values={values()}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
					/>
				</div>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h3 class="mb-2 font-medium text-gray-700 text-sm">Current Values:</h3>
					<pre class="text-gray-600 text-xs">
						{JSON.stringify(values(), null, 2)}
					</pre>
				</div>
			</div>
		);
	},
};
