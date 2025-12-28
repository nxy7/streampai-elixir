import { createSignal } from "solid-js";
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { z } from "zod";
import { SchemaForm } from "./SchemaForm";
import type { FormMeta } from "./types";
import {
	alertboxConfigMeta,
	alertboxConfigSchema,
	allFieldTypesMeta,
	allFieldTypesSchema,
	chatConfigMeta,
	chatConfigSchema,
	customOptionsMeta,
	customOptionsSchema,
	i18nDemoMeta,
	i18nDemoSchema,
	timerConfigMeta,
	timerConfigSchema,
} from "./widget-schemas";
import type { TranslationFunction } from "./types";

/**
 * SchemaForm automatically generates form UI from Zod schemas.
 *
 * Design: Schema and metadata are SEPARATE.
 * - Schema: Plain Zod schema (can be auto-generated from Ash TypeScript)
 * - Metadata: Optional UI hints for field rendering
 *
 * This allows schemas to be auto-generated while metadata is hand-written.
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

// Simple schema - plain Zod, could be auto-generated
const simpleSchema = z.object({
	name: z.string().default(""),
	age: z.number().min(0).max(120).default(25),
	favoriteColor: z.string().default("#6366f1"),
	newsletter: z.boolean().default(false),
});

// Metadata for simple schema - UI hints
const simpleMeta: FormMeta<typeof simpleSchema.shape> = {
	name: { label: "Your Name", placeholder: "Enter your name" },
	age: { label: "Age" },
	favoriteColor: { label: "Favorite Color", inputType: "color" },
	newsletter: {
		label: "Subscribe to newsletter",
		description: "Get weekly updates about new features",
	},
};

/**
 * Basic example showing separate schema and metadata.
 * Note how the schema is plain Zod - it could be auto-generated from Ash.
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
						meta={simpleMeta}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
						schema={simpleSchema}
						values={values()}
					/>
				</div>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h3 class="mb-2 font-medium text-gray-700 text-sm">
						Current Values:
					</h3>
					<pre class="text-gray-600 text-xs">
						{JSON.stringify(values(), null, 2)}
					</pre>
				</div>
			</div>
		);
	},
};

/**
 * Timer widget configuration form.
 * Schema is plain Zod, metadata provides labels, units, and input types.
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
						Schema and metadata are separate (schema could be auto-generated)
					</p>
					<SchemaForm
						meta={timerConfigMeta}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
						schema={timerConfigSchema}
						values={values()}
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
 * Chat widget configuration - select dropdowns and multiple booleans.
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
						meta={chatConfigMeta}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
						schema={chatConfigSchema}
						values={values()}
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
 * Alertbox configuration - grouped fields organized into sections.
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
						meta={alertboxConfigMeta}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
						schema={alertboxConfigSchema}
						values={values()}
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
					disabled={true}
					meta={simpleMeta}
					onChange={() => {}}
					schema={simpleSchema}
					values={values}
				/>
			</div>
		);
	},
};

/**
 * Shows all available field types in one form.
 */
export const AllFieldTypes: Story = {
	render: () => {
		const [values, setValues] = createSignal({
			name: "",
			description: "",
			count: 0,
			opacity: 100,
			color: "#3b82f6",
			enabled: true,
			size: "medium" as const,
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
						meta={allFieldTypesMeta}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
						schema={allFieldTypesSchema}
						values={values()}
					/>
				</div>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h3 class="mb-2 font-medium text-gray-700 text-sm">
						Current Values:
					</h3>
					<pre class="text-gray-600 text-xs">
						{JSON.stringify(values(), null, 2)}
					</pre>
				</div>
			</div>
		);
	},
};

/**
 * Demonstrates that forms work WITHOUT metadata - using auto-inference.
 * Input types are inferred from Zod types:
 * - z.string() -> text input
 * - z.number() with min/max -> slider
 * - z.boolean() -> checkbox
 * - z.enum() -> select
 */
export const NoMetadata: Story = {
	render: () => {
		// Plain schema without any metadata - fully auto-inferred
		const autoSchema = z.object({
			userName: z.string().default(""),
			userAge: z.number().min(0).max(100).default(25),
			isActive: z.boolean().default(true),
			priority: z.enum(["low", "medium", "high"]).default("medium"),
		});

		const [values, setValues] = createSignal({
			userName: "",
			userAge: 25,
			isActive: true,
			priority: "medium" as const,
		});

		return (
			<div class="space-y-6">
				<div>
					<h2 class="mb-1 font-semibold text-gray-900 text-lg">
						No Metadata (Auto-Inference)
					</h2>
					<p class="mb-4 text-gray-500 text-sm">
						Labels and input types are auto-inferred from field names and Zod
						types
					</p>
					<SchemaForm
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
						schema={autoSchema}
						values={values()}
					/>
				</div>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h3 class="mb-2 font-medium text-gray-700 text-sm">
						Current Values:
					</h3>
					<pre class="text-gray-600 text-xs">
						{JSON.stringify(values(), null, 2)}
					</pre>
				</div>
			</div>
		);
	},
};

/**
 * Demonstrates custom option labels for select fields.
 * This is useful when enum values don't match desired display labels,
 * such as numeric duration values that should display as "7 days", "30 days", etc.
 */
export const CustomSelectOptions: Story = {
	render: () => {
		const [values, setValues] = createSignal({
			duration: "30" as const,
			priority: "medium" as const,
		});

		return (
			<div class="space-y-6">
				<div>
					<h2 class="mb-1 font-semibold text-gray-900 text-lg">
						Custom Select Options
					</h2>
					<p class="mb-4 text-gray-500 text-sm">
						Select fields with custom option labels via the{" "}
						<code class="rounded bg-gray-100 px-1">options</code> metadata
					</p>
					<SchemaForm
						schema={customOptionsSchema}
						meta={customOptionsMeta}
						values={values()}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
					/>
				</div>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h3 class="mb-2 font-medium text-gray-700 text-sm">
						Current Values (raw enum values):
					</h3>
					<pre class="text-gray-600 text-xs">
						{JSON.stringify(values(), null, 2)}
					</pre>
				</div>
			</div>
		);
	},
};

// Mock translations for demo purposes
const mockTranslations: Record<string, Record<string, string>> = {
	en: {
		"demo.displayName": "Display Name",
		"demo.displayNamePlaceholder": "Enter your display name",
		"demo.displayNameDescription": "This name will be shown to other users",
		"demo.theme": "Theme",
		"demo.themeDescription": "Choose your preferred color theme",
		"demo.themeLight": "Light Mode",
		"demo.themeDark": "Dark Mode",
		"demo.themeSystem": "System Default",
		"demo.emailNotifications": "Email Notifications",
		"demo.emailNotificationsDescription":
			"Receive email updates about your account",
	},
	de: {
		"demo.displayName": "Anzeigename",
		"demo.displayNamePlaceholder": "Gib deinen Anzeigenamen ein",
		"demo.displayNameDescription":
			"Dieser Name wird anderen Benutzern angezeigt",
		"demo.theme": "Design",
		"demo.themeDescription": "Wähle dein bevorzugtes Farbschema",
		"demo.themeLight": "Hell",
		"demo.themeDark": "Dunkel",
		"demo.themeSystem": "Systemstandard",
		"demo.emailNotifications": "E-Mail-Benachrichtigungen",
		"demo.emailNotificationsDescription":
			"E-Mail-Updates zu deinem Konto erhalten",
	},
	pl: {
		"demo.displayName": "Nazwa wyświetlana",
		"demo.displayNamePlaceholder": "Wprowadź swoją nazwę",
		"demo.displayNameDescription":
			"Ta nazwa będzie widoczna dla innych użytkowników",
		"demo.theme": "Motyw",
		"demo.themeDescription": "Wybierz preferowany motyw kolorystyczny",
		"demo.themeLight": "Jasny",
		"demo.themeDark": "Ciemny",
		"demo.themeSystem": "Systemowy",
		"demo.emailNotifications": "Powiadomienia e-mail",
		"demo.emailNotificationsDescription":
			"Otrzymuj aktualizacje e-mail o swoim koncie",
	},
	es: {
		"demo.displayName": "Nombre para mostrar",
		"demo.displayNamePlaceholder": "Ingresa tu nombre para mostrar",
		"demo.displayNameDescription":
			"Este nombre se mostrará a otros usuarios",
		"demo.theme": "Tema",
		"demo.themeDescription": "Elige tu tema de colores preferido",
		"demo.themeLight": "Claro",
		"demo.themeDark": "Oscuro",
		"demo.themeSystem": "Sistema",
		"demo.emailNotifications": "Notificaciones por email",
		"demo.emailNotificationsDescription":
			"Recibe actualizaciones por email sobre tu cuenta",
	},
};

/**
 * Demonstrates i18n (internationalization) support.
 * Pass a translation function to SchemaForm to localize labels, descriptions, and options.
 * The metadata uses i18n keys (labelKey, descriptionKey, optionKeys) instead of static strings.
 */
export const I18nLocalization: Story = {
	render: () => {
		const [values, setValues] = createSignal({
			displayName: "",
			theme: "system" as const,
			emailNotifications: true,
		});

		const [locale, setLocale] = createSignal<"en" | "de" | "pl" | "es">("en");

		// Mock translation function that looks up keys in our mock translations
		const t: TranslationFunction = (key) => {
			return mockTranslations[locale()]?.[key] ?? key;
		};

		return (
			<div class="space-y-6">
				<div>
					<h2 class="mb-1 font-semibold text-gray-900 text-lg">
						i18n Localization
					</h2>
					<p class="mb-4 text-gray-500 text-sm">
						Form with localized labels via the{" "}
						<code class="rounded bg-gray-100 px-1">t</code> translation function
					</p>

					{/* Language Switcher */}
					<div class="mb-4 flex gap-2">
						<button
							type="button"
							onClick={() => setLocale("en")}
							class={`rounded px-3 py-1 text-sm ${locale() === "en" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
							English
						</button>
						<button
							type="button"
							onClick={() => setLocale("de")}
							class={`rounded px-3 py-1 text-sm ${locale() === "de" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
							Deutsch
						</button>
						<button
							type="button"
							onClick={() => setLocale("pl")}
							class={`rounded px-3 py-1 text-sm ${locale() === "pl" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
							Polski
						</button>
						<button
							type="button"
							onClick={() => setLocale("es")}
							class={`rounded px-3 py-1 text-sm ${locale() === "es" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
							Español
						</button>
					</div>

					<SchemaForm
						schema={i18nDemoSchema}
						meta={i18nDemoMeta}
						values={values()}
						onChange={(field, value) => {
							setValues((prev) => ({ ...prev, [field]: value }));
						}}
						t={t}
					/>
				</div>
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<h3 class="mb-2 font-medium text-gray-700 text-sm">
						Current Values:
					</h3>
					<pre class="text-gray-600 text-xs">
						{JSON.stringify(values(), null, 2)}
					</pre>
				</div>
			</div>
		);
	},
};
