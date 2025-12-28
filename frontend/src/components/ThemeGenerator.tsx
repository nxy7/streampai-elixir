import { createSignal, createEffect, For, type JSX } from "solid-js";

/**
 * Color utility functions for HSL manipulation
 */

// Convert hex to HSL
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
	// Remove # if present
	hex = hex.replace(/^#/, "");

	// Parse RGB values
	const r = parseInt(hex.slice(0, 2), 16) / 255;
	const g = parseInt(hex.slice(2, 4), 16) / 255;
	const b = parseInt(hex.slice(4, 6), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;

	let h = 0;
	let s = 0;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r:
				h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
				break;
			case g:
				h = ((b - r) / d + 2) / 6;
				break;
			case b:
				h = ((r - g) / d + 4) / 6;
				break;
		}
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
	};
}

// Convert HSL to hex
export function hslToHex(h: number, s: number, l: number): string {
	s /= 100;
	l /= 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;

	let r = 0,
		g = 0,
		b = 0;

	if (h >= 0 && h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (h >= 60 && h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (h >= 120 && h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (h >= 180 && h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (h >= 240 && h < 300) {
		r = x;
		g = 0;
		b = c;
	} else if (h >= 300 && h < 360) {
		r = c;
		g = 0;
		b = x;
	}

	const toHex = (n: number) => {
		const hex = Math.round((n + m) * 255).toString(16);
		return hex.length === 1 ? "0" + hex : hex;
	};

	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Get complementary color (180 degrees)
export function getComplementary(h: number): number {
	return (h + 180) % 360;
}

// Get analogous colors (+/- 30 degrees)
export function getAnalogous(h: number): [number, number] {
	return [(h + 30) % 360, (h + 330) % 360];
}

// Get triadic colors (120 degrees apart)
export function getTriadic(h: number): [number, number] {
	return [(h + 120) % 360, (h + 240) % 360];
}

// Get split complementary (150 and 210 degrees)
export function getSplitComplementary(h: number): [number, number] {
	return [(h + 150) % 360, (h + 210) % 360];
}

/**
 * Generate a complete theme palette from a single primary color
 * Uses color theory to derive harmonious colors
 */
export interface ThemePalette {
	// Primary brand color
	primary: string;
	primaryHover: string;
	primaryLight: string;

	// Secondary/accent color (complementary or split-complementary)
	secondary: string;
	secondaryHover: string;

	// Background colors
	bgPrimary: string;
	bgSecondary: string;
	bgTertiary: string;
	bgElevated: string;

	// Surface colors (cards, modals)
	surface: string;
	surfaceHover: string;

	// Text colors
	textPrimary: string;
	textSecondary: string;
	textTertiary: string;
	textMuted: string;

	// Border colors
	border: string;
	borderHover: string;
	borderFocus: string;

	// Input colors
	inputBg: string;
	inputBorder: string;

	// Status colors (slightly adjusted to work with the primary)
	success: string;
	warning: string;
	error: string;
	info: string;
}

export type ThemeMode = "light" | "dark";

export function generatePalette(
	primaryHex: string,
	mode: ThemeMode = "light"
): ThemePalette {
	const primary = hexToHsl(primaryHex);

	// Get split-complementary for secondary color (more harmonious than pure complementary)
	const [splitComp1] = getSplitComplementary(primary.h);

	// Adjust saturation based on mode - dark mode needs slightly desaturated colors
	const satAdjust = mode === "dark" ? -10 : 0;
	const primarySat = Math.min(100, Math.max(30, primary.s + satAdjust));

	if (mode === "light") {
		return {
			// Primary variations
			primary: hslToHex(primary.h, primarySat, 45),
			primaryHover: hslToHex(primary.h, primarySat, 38),
			primaryLight: hslToHex(primary.h, primarySat, 52),

			// Secondary (split-complementary)
			secondary: hslToHex(splitComp1, Math.max(40, primarySat - 10), 50),
			secondaryHover: hslToHex(splitComp1, Math.max(40, primarySat - 10), 42),

			// Backgrounds - very subtle tint of primary
			bgPrimary: "#ffffff",
			bgSecondary: hslToHex(primary.h, 10, 98),
			bgTertiary: hslToHex(primary.h, 8, 96),
			bgElevated: "#ffffff",

			// Surfaces
			surface: "#ffffff",
			surfaceHover: hslToHex(primary.h, 10, 98),

			// Text - neutral with very slight warmth/coolness from primary
			textPrimary: hslToHex(primary.h, 5, 12),
			textSecondary: hslToHex(primary.h, 3, 40),
			textTertiary: hslToHex(primary.h, 2, 55),
			textMuted: hslToHex(primary.h, 2, 70),

			// Borders
			border: hslToHex(primary.h, 6, 88),
			borderHover: hslToHex(primary.h, 6, 80),
			borderFocus: hslToHex(primary.h, primarySat, 45),

			// Inputs
			inputBg: "#ffffff",
			inputBorder: hslToHex(primary.h, 6, 82),

			// Status colors - slightly tinted towards primary
			success: hslToHex(145, 65, 42),
			warning: hslToHex(38, 90, 50),
			error: hslToHex(0, 72, 51),
			info: hslToHex(210, 75, 52),
		};
	} else {
		// Dark mode
		return {
			// Primary variations - lighter for dark backgrounds
			primary: hslToHex(primary.h, primarySat, 55),
			primaryHover: hslToHex(primary.h, primarySat, 48),
			primaryLight: hslToHex(primary.h, primarySat, 62),

			// Secondary
			secondary: hslToHex(splitComp1, Math.max(40, primarySat - 10), 55),
			secondaryHover: hslToHex(splitComp1, Math.max(40, primarySat - 10), 48),

			// Backgrounds - dark with subtle primary tint
			bgPrimary: hslToHex(primary.h, 8, 7),
			bgSecondary: hslToHex(primary.h, 6, 10),
			bgTertiary: hslToHex(primary.h, 5, 14),
			bgElevated: hslToHex(primary.h, 6, 12),

			// Surfaces
			surface: hslToHex(primary.h, 6, 10),
			surfaceHover: hslToHex(primary.h, 5, 14),

			// Text
			textPrimary: hslToHex(primary.h, 5, 95),
			textSecondary: hslToHex(primary.h, 3, 65),
			textTertiary: hslToHex(primary.h, 2, 50),
			textMuted: hslToHex(primary.h, 2, 35),

			// Borders
			border: hslToHex(primary.h, 5, 18),
			borderHover: hslToHex(primary.h, 5, 25),
			borderFocus: hslToHex(primary.h, primarySat, 55),

			// Inputs
			inputBg: hslToHex(primary.h, 5, 14),
			inputBorder: hslToHex(primary.h, 5, 22),

			// Status colors
			success: hslToHex(145, 60, 50),
			warning: hslToHex(38, 85, 55),
			error: hslToHex(0, 68, 55),
			info: hslToHex(210, 70, 58),
		};
	}
}

/**
 * Apply a theme palette to CSS variables on an element
 */
export function applyPaletteToElement(
	element: HTMLElement,
	palette: ThemePalette
) {
	element.style.setProperty("--theme-primary", palette.primary);
	element.style.setProperty("--theme-primary-hover", palette.primaryHover);
	element.style.setProperty("--theme-primary-light", palette.primaryLight);
	element.style.setProperty("--theme-secondary", palette.secondary);
	element.style.setProperty("--theme-secondary-hover", palette.secondaryHover);
	element.style.setProperty("--theme-bg-primary", palette.bgPrimary);
	element.style.setProperty("--theme-bg-secondary", palette.bgSecondary);
	element.style.setProperty("--theme-bg-tertiary", palette.bgTertiary);
	element.style.setProperty("--theme-bg-elevated", palette.bgElevated);
	element.style.setProperty("--theme-surface", palette.surface);
	element.style.setProperty("--theme-surface-hover", palette.surfaceHover);
	element.style.setProperty("--theme-text-primary", palette.textPrimary);
	element.style.setProperty("--theme-text-secondary", palette.textSecondary);
	element.style.setProperty("--theme-text-tertiary", palette.textTertiary);
	element.style.setProperty("--theme-text-muted", palette.textMuted);
	element.style.setProperty("--theme-border", palette.border);
	element.style.setProperty("--theme-border-hover", palette.borderHover);
	element.style.setProperty("--theme-border-focus", palette.borderFocus);
	element.style.setProperty("--theme-input-bg", palette.inputBg);
	element.style.setProperty("--theme-input-border", palette.inputBorder);
	element.style.setProperty("--color-success", palette.success);
	element.style.setProperty("--color-warning", palette.warning);
	element.style.setProperty("--color-error", palette.error);
	element.style.setProperty("--color-info", palette.info);
}

// Preset colors for quick selection
const PRESET_COLORS = [
	{ name: "Purple (Default)", hex: "#9333ea" },
	{ name: "Blue", hex: "#3b82f6" },
	{ name: "Green", hex: "#22c55e" },
	{ name: "Red", hex: "#ef4444" },
	{ name: "Orange", hex: "#f97316" },
	{ name: "Pink", hex: "#ec4899" },
	{ name: "Teal", hex: "#14b8a6" },
	{ name: "Indigo", hex: "#6366f1" },
	{ name: "Amber", hex: "#f59e0b" },
	{ name: "Cyan", hex: "#06b6d4" },
];

/**
 * ThemeGenerator component - demonstrates color derivation from primary color
 */
export default function ThemeGenerator() {
	const [primaryColor, setPrimaryColor] = createSignal("#9333ea");
	const [mode, setMode] = createSignal<ThemeMode>("light");
	const [palette, setPalette] = createSignal<ThemePalette>(
		generatePalette("#9333ea", "light")
	);

	let previewRef: HTMLDivElement | undefined;

	// Regenerate palette when color or mode changes
	createEffect(() => {
		const newPalette = generatePalette(primaryColor(), mode());
		setPalette(newPalette);

		// Apply to preview element
		if (previewRef) {
			applyPaletteToElement(previewRef, newPalette);
		}
	});

	const handleColorChange: JSX.EventHandler<HTMLInputElement, InputEvent> = (
		e
	) => {
		setPrimaryColor(e.currentTarget.value);
	};

	return (
		<div class="p-8 bg-gray-100 min-h-screen">
			<div class="max-w-6xl mx-auto">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">
					Theme Color Generator
				</h1>
				<p class="text-gray-600 mb-8">
					Pick a primary color and see how all other colors are derived using
					color theory.
				</p>

				{/* Controls */}
				<div class="bg-white rounded-xl p-6 shadow-sm mb-8">
					<div class="flex flex-wrap gap-8 items-start">
						{/* Color Picker */}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Primary Color
							</label>
							<div class="flex items-center gap-3">
								<input
									type="color"
									value={primaryColor()}
									onInput={handleColorChange}
									class="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-200"
								/>
								<div>
									<input
										type="text"
										value={primaryColor()}
										onInput={handleColorChange}
										class="font-mono text-sm px-3 py-2 border border-gray-300 rounded-lg w-28"
									/>
									<p class="text-xs text-gray-500 mt-1">
										HSL: {hexToHsl(primaryColor()).h}°,{" "}
										{hexToHsl(primaryColor()).s}%,{" "}
										{hexToHsl(primaryColor()).l}%
									</p>
								</div>
							</div>
						</div>

						{/* Mode Toggle */}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Theme Mode
							</label>
							<div class="flex gap-2">
								<button
									type="button"
									class={`px-4 py-2 rounded-lg font-medium transition-colors ${
										mode() === "light"
											? "bg-gray-900 text-white"
											: "bg-gray-200 text-gray-700 hover:bg-gray-300"
									}`}
									onClick={() => setMode("light")}>
									Light
								</button>
								<button
									type="button"
									class={`px-4 py-2 rounded-lg font-medium transition-colors ${
										mode() === "dark"
											? "bg-gray-900 text-white"
											: "bg-gray-200 text-gray-700 hover:bg-gray-300"
									}`}
									onClick={() => setMode("dark")}>
									Dark
								</button>
							</div>
						</div>

						{/* Preset Colors */}
						<div class="flex-1">
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Preset Colors
							</label>
							<div class="flex flex-wrap gap-2">
								<For each={PRESET_COLORS}>
									{(preset) => (
										<button
											type="button"
											class={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
												primaryColor() === preset.hex
													? "border-gray-900 ring-2 ring-gray-400 ring-offset-2"
													: "border-gray-300"
											}`}
											style={{ "background-color": preset.hex }}
											onClick={() => setPrimaryColor(preset.hex)}
											title={preset.name}
										/>
									)}
								</For>
							</div>
						</div>
					</div>
				</div>

				{/* Generated Palette */}
				<div class="bg-white rounded-xl p-6 shadow-sm mb-8">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">
						Generated Palette
					</h2>
					<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
						<ColorSwatch label="Primary" color={palette().primary} />
						<ColorSwatch label="Primary Hover" color={palette().primaryHover} />
						<ColorSwatch label="Primary Light" color={palette().primaryLight} />
						<ColorSwatch label="Secondary" color={palette().secondary} />
						<ColorSwatch label="Background" color={palette().bgPrimary} />
						<ColorSwatch label="Bg Secondary" color={palette().bgSecondary} />
						<ColorSwatch label="Bg Tertiary" color={palette().bgTertiary} />
						<ColorSwatch label="Surface" color={palette().surface} />
						<ColorSwatch label="Text Primary" color={palette().textPrimary} />
						<ColorSwatch
							label="Text Secondary"
							color={palette().textSecondary}
						/>
						<ColorSwatch label="Text Tertiary" color={palette().textTertiary} />
						<ColorSwatch label="Border" color={palette().border} />
						<ColorSwatch label="Success" color={palette().success} />
						<ColorSwatch label="Warning" color={palette().warning} />
						<ColorSwatch label="Error" color={palette().error} />
						<ColorSwatch label="Info" color={palette().info} />
					</div>
				</div>

				{/* UI Preview */}
				<div class="bg-white rounded-xl p-6 shadow-sm">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">
						UI Preview with Generated Theme
					</h2>

					{/* Preview container with generated CSS variables */}
					<div
						ref={previewRef}
						class="rounded-xl overflow-hidden"
						style={{
							"background-color": palette().bgSecondary,
							padding: "24px",
						}}>
						{/* Card Example */}
						<div
							class="rounded-xl p-6 mb-6"
							style={{
								"background-color": palette().surface,
								"border-color": palette().border,
								"border-width": "1px",
								"border-style": "solid",
							}}>
							<h3
								class="text-lg font-semibold mb-2"
								style={{ color: palette().textPrimary }}>
								Card Title
							</h3>
							<p class="mb-4" style={{ color: palette().textSecondary }}>
								This is a sample card component showing how text and surfaces
								work together with the generated theme.
							</p>

							{/* Buttons */}
							<div class="flex flex-wrap gap-3 mb-4">
								<button
									type="button"
									class="px-4 py-2 rounded-lg font-medium text-white transition-colors"
									style={{ "background-color": palette().primary }}>
									Primary Button
								</button>
								<button
									type="button"
									class="px-4 py-2 rounded-lg font-medium transition-colors"
									style={{
										"background-color": palette().bgTertiary,
										color: palette().textPrimary,
									}}>
									Secondary Button
								</button>
								<button
									type="button"
									class="px-4 py-2 rounded-lg font-medium text-white transition-colors"
									style={{ "background-color": palette().secondary }}>
									Accent Button
								</button>
							</div>

							{/* Form Elements */}
							<div class="flex flex-wrap gap-4 mb-4">
								<input
									type="text"
									placeholder="Text input..."
									class="px-3 py-2 rounded-lg border"
									style={{
										"background-color": palette().inputBg,
										"border-color": palette().inputBorder,
										color: palette().textPrimary,
									}}
								/>
								<select
									class="px-3 py-2 rounded-lg border"
									style={{
										"background-color": palette().inputBg,
										"border-color": palette().inputBorder,
										color: palette().textPrimary,
									}}>
									<option>Select option</option>
									<option>Option 1</option>
									<option>Option 2</option>
								</select>
							</div>

							{/* Status Badges */}
							<div class="flex flex-wrap gap-2">
								<span
									class="px-2.5 py-0.5 rounded-full text-sm font-medium text-white"
									style={{ "background-color": palette().success }}>
									Success
								</span>
								<span
									class="px-2.5 py-0.5 rounded-full text-sm font-medium text-white"
									style={{ "background-color": palette().warning }}>
									Warning
								</span>
								<span
									class="px-2.5 py-0.5 rounded-full text-sm font-medium text-white"
									style={{ "background-color": palette().error }}>
									Error
								</span>
								<span
									class="px-2.5 py-0.5 rounded-full text-sm font-medium text-white"
									style={{ "background-color": palette().info }}>
									Info
								</span>
							</div>
						</div>

						{/* Stats Example */}
						<div class="grid grid-cols-3 gap-4">
							<div
								class="rounded-xl p-4 text-center"
								style={{
									"background-color": palette().surface,
									"border-color": palette().border,
									"border-width": "1px",
									"border-style": "solid",
								}}>
								<div
									class="text-2xl font-bold"
									style={{ color: palette().primary }}>
									1,234
								</div>
								<div
									class="text-sm"
									style={{ color: palette().textSecondary }}>
									Total Users
								</div>
							</div>
							<div
								class="rounded-xl p-4 text-center"
								style={{
									"background-color": palette().surface,
									"border-color": palette().border,
									"border-width": "1px",
									"border-style": "solid",
								}}>
								<div
									class="text-2xl font-bold"
									style={{ color: palette().secondary }}>
									$5,678
								</div>
								<div
									class="text-sm"
									style={{ color: palette().textSecondary }}>
									Revenue
								</div>
							</div>
							<div
								class="rounded-xl p-4 text-center"
								style={{
									"background-color": palette().surface,
									"border-color": palette().border,
									"border-width": "1px",
									"border-style": "solid",
								}}>
								<div
									class="text-2xl font-bold"
									style={{ color: palette().success }}>
									98.5%
								</div>
								<div
									class="text-sm"
									style={{ color: palette().textSecondary }}>
									Uptime
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

// Color swatch component
function ColorSwatch(props: { label: string; color: string }) {
	return (
		<div class="flex flex-col">
			<div
				class="w-full h-12 rounded-lg border border-gray-200 mb-1"
				style={{ "background-color": props.color }}
			/>
			<span class="text-xs font-medium text-gray-700">{props.label}</span>
			<span class="text-xs text-gray-500 font-mono">{props.color}</span>
		</div>
	);
}
