import type { Meta, StoryObj } from "storybook-solidjs-vite";
import ThemeGenerator, {
	generatePalette,
	hexToHsl,
	hslToHex,
} from "./ThemeGenerator";
import { For } from "solid-js";

const meta = {
	title: "Design System/Theme Generator",
	component: ThemeGenerator,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof ThemeGenerator>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default interactive story
export const Interactive: Story = {
	render: () => <ThemeGenerator />,
};

// Compare multiple primary colors side by side
export const ColorComparison: Story = {
	render: () => {
		const colors = [
			{ name: "Purple", hex: "#9333ea" },
			{ name: "Blue", hex: "#3b82f6" },
			{ name: "Green", hex: "#22c55e" },
			{ name: "Red", hex: "#ef4444" },
			{ name: "Orange", hex: "#f97316" },
			{ name: "Teal", hex: "#14b8a6" },
		];

		return (
			<div class="p-8 bg-gray-100 min-h-screen">
				<h1 class="text-2xl font-bold text-gray-900 mb-6">
					Color Comparison - Light Mode
				</h1>
				<div class="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
					<For each={colors}>
						{(color) => {
							const palette = generatePalette(color.hex, "light");
							return (
								<div
									class="rounded-xl overflow-hidden shadow-sm"
									style={{ "background-color": palette.bgSecondary }}>
									<div
										class="h-3"
										style={{ "background-color": palette.primary }}
									/>
									<div class="p-4">
										<div
											class="rounded-lg p-4"
											style={{
												"background-color": palette.surface,
												"border-color": palette.border,
												"border-width": "1px",
												"border-style": "solid",
											}}>
											<div
												class="flex items-center gap-2 mb-3"
												style={{
													"background-color": palette.primary,
													padding: "4px 12px",
													"border-radius": "9999px",
													width: "fit-content",
												}}>
												<span class="text-white text-sm font-medium">
													{color.name}
												</span>
											</div>
											<p
												class="text-sm mb-3"
												style={{ color: palette.textSecondary }}>
												Primary: {color.hex}
											</p>
											<div class="flex gap-2">
												<button
													type="button"
													class="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
													style={{ "background-color": palette.primary }}>
													Button
												</button>
												<button
													type="button"
													class="px-3 py-1.5 rounded-lg text-sm font-medium"
													style={{
														"background-color": palette.bgTertiary,
														color: palette.textPrimary,
													}}>
													Secondary
												</button>
											</div>
										</div>
									</div>
								</div>
							);
						}}
					</For>
				</div>

				<h1 class="text-2xl font-bold text-gray-900 mb-6">
					Color Comparison - Dark Mode
				</h1>
				<div class="grid grid-cols-2 lg:grid-cols-3 gap-6">
					<For each={colors}>
						{(color) => {
							const palette = generatePalette(color.hex, "dark");
							return (
								<div
									class="rounded-xl overflow-hidden shadow-sm"
									style={{ "background-color": palette.bgSecondary }}>
									<div
										class="h-3"
										style={{ "background-color": palette.primary }}
									/>
									<div class="p-4">
										<div
											class="rounded-lg p-4"
											style={{
												"background-color": palette.surface,
												"border-color": palette.border,
												"border-width": "1px",
												"border-style": "solid",
											}}>
											<div
												class="flex items-center gap-2 mb-3"
												style={{
													"background-color": palette.primary,
													padding: "4px 12px",
													"border-radius": "9999px",
													width: "fit-content",
												}}>
												<span class="text-white text-sm font-medium">
													{color.name}
												</span>
											</div>
											<p
												class="text-sm mb-3"
												style={{ color: palette.textSecondary }}>
												Primary: {color.hex}
											</p>
											<div class="flex gap-2">
												<button
													type="button"
													class="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
													style={{ "background-color": palette.primary }}>
													Button
												</button>
												<button
													type="button"
													class="px-3 py-1.5 rounded-lg text-sm font-medium"
													style={{
														"background-color": palette.bgTertiary,
														color: palette.textPrimary,
													}}>
													Secondary
												</button>
											</div>
										</div>
									</div>
								</div>
							);
						}}
					</For>
				</div>
			</div>
		);
	},
};

// Show color theory relationships
export const ColorTheory: Story = {
	render: () => {
		const primaryHex = "#9333ea";
		const primary = hexToHsl(primaryHex);

		// Generate related colors
		const complementary = (primary.h + 180) % 360;
		const analogous1 = (primary.h + 30) % 360;
		const analogous2 = (primary.h + 330) % 360;
		const triadic1 = (primary.h + 120) % 360;
		const triadic2 = (primary.h + 240) % 360;
		const splitComp1 = (primary.h + 150) % 360;
		const splitComp2 = (primary.h + 210) % 360;

		const relationships = [
			{
				name: "Primary",
				hue: primary.h,
				description: "The selected base color",
			},
			{
				name: "Complementary",
				hue: complementary,
				description: "180° opposite on color wheel - high contrast",
			},
			{
				name: "Analogous 1",
				hue: analogous1,
				description: "+30° - harmonious, low contrast",
			},
			{
				name: "Analogous 2",
				hue: analogous2,
				description: "-30° - harmonious, low contrast",
			},
			{
				name: "Triadic 1",
				hue: triadic1,
				description: "+120° - vibrant, balanced",
			},
			{
				name: "Triadic 2",
				hue: triadic2,
				description: "+240° - vibrant, balanced",
			},
			{
				name: "Split Comp 1",
				hue: splitComp1,
				description: "+150° - less harsh than complementary",
			},
			{
				name: "Split Comp 2",
				hue: splitComp2,
				description: "+210° - less harsh than complementary",
			},
		];

		return (
			<div class="p-8 bg-gray-100 min-h-screen">
				<h1 class="text-2xl font-bold text-gray-900 mb-2">
					Color Theory Relationships
				</h1>
				<p class="text-gray-600 mb-8">
					Understanding how secondary colors are derived from the primary using
					color theory.
				</p>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					<For each={relationships}>
						{(rel) => {
							const hex = hslToHex(rel.hue, 70, 50);
							return (
								<div class="bg-white rounded-xl p-4 shadow-sm">
									<div
										class="w-full h-20 rounded-lg mb-3"
										style={{ "background-color": hex }}
									/>
									<h3 class="font-semibold text-gray-900">{rel.name}</h3>
									<p class="text-xs text-gray-500 mb-1">{rel.hue}°</p>
									<p class="text-xs text-gray-600">{rel.description}</p>
									<code class="text-xs text-gray-400 mt-2 block">{hex}</code>
								</div>
							);
						}}
					</For>
				</div>

				<div class="mt-8 bg-white rounded-xl p-6 shadow-sm">
					<h2 class="text-lg font-semibold text-gray-900 mb-4">
						Why Split-Complementary?
					</h2>
					<p class="text-gray-600 mb-4">
						We use split-complementary colors for the secondary/accent color
						because:
					</p>
					<ul class="list-disc pl-5 text-gray-600 space-y-2">
						<li>
							Less jarring than pure complementary colors (which can be harsh
							when used together)
						</li>
						<li>
							Provides visual interest and contrast while maintaining harmony
						</li>
						<li>Creates a more sophisticated and balanced color palette</li>
						<li>Works well for accent buttons and highlights</li>
					</ul>
				</div>
			</div>
		);
	},
};

// Dashboard simulation with generated theme
export const DashboardPreview: Story = {
	render: () => {
		const palette = generatePalette("#9333ea", "light");
		const darkPalette = generatePalette("#9333ea", "dark");

		const Card = (props: {
			title: string;
			value: string;
			change: string;
			palette: ReturnType<typeof generatePalette>;
		}) => (
			<div
				class="rounded-xl p-5"
				style={{
					"background-color": props.palette.surface,
					"border-color": props.palette.border,
					"border-width": "1px",
					"border-style": "solid",
				}}>
				<p
					class="text-sm font-medium mb-1"
					style={{ color: props.palette.textSecondary }}>
					{props.title}
				</p>
				<p
					class="text-2xl font-bold"
					style={{ color: props.palette.textPrimary }}>
					{props.value}
				</p>
				<p class="text-sm" style={{ color: props.palette.success }}>
					{props.change}
				</p>
			</div>
		);

		return (
			<div class="min-h-screen">
				{/* Light Mode Dashboard */}
				<div style={{ "background-color": palette.bgSecondary }} class="p-6">
					<div class="max-w-6xl mx-auto">
						<h1
							class="text-2xl font-bold mb-6"
							style={{ color: palette.textPrimary }}>
							Dashboard - Light Mode
						</h1>
						<div class="grid grid-cols-4 gap-4 mb-6">
							<Card
								title="Total Revenue"
								value="$45,231"
								change="+20.1% from last month"
								palette={palette}
							/>
							<Card
								title="Active Users"
								value="2,350"
								change="+15.3% from last month"
								palette={palette}
							/>
							<Card
								title="Conversion Rate"
								value="3.2%"
								change="+0.4% from last month"
								palette={palette}
							/>
							<Card
								title="Avg. Session"
								value="4m 32s"
								change="+12% from last month"
								palette={palette}
							/>
						</div>

						{/* Table Example */}
						<div
							class="rounded-xl overflow-hidden"
							style={{
								"background-color": palette.surface,
								"border-color": palette.border,
								"border-width": "1px",
								"border-style": "solid",
							}}>
							<div
								class="px-5 py-4 border-b"
								style={{ "border-color": palette.border }}>
								<h2
									class="font-semibold"
									style={{ color: palette.textPrimary }}>
									Recent Transactions
								</h2>
							</div>
							<table class="w-full">
								<thead>
									<tr style={{ "background-color": palette.bgTertiary }}>
										<th
											class="px-5 py-3 text-left text-sm font-medium"
											style={{ color: palette.textSecondary }}>
											Customer
										</th>
										<th
											class="px-5 py-3 text-left text-sm font-medium"
											style={{ color: palette.textSecondary }}>
											Amount
										</th>
										<th
											class="px-5 py-3 text-left text-sm font-medium"
											style={{ color: palette.textSecondary }}>
											Status
										</th>
									</tr>
								</thead>
								<tbody>
									<tr
										style={{
											"border-bottom": `1px solid ${palette.border}`,
										}}>
										<td
											class="px-5 py-3"
											style={{ color: palette.textPrimary }}>
											John Doe
										</td>
										<td
											class="px-5 py-3"
											style={{ color: palette.textPrimary }}>
											$250.00
										</td>
										<td class="px-5 py-3">
											<span
												class="px-2 py-1 rounded-full text-xs font-medium text-white"
												style={{ "background-color": palette.success }}>
												Completed
											</span>
										</td>
									</tr>
									<tr
										style={{
											"border-bottom": `1px solid ${palette.border}`,
										}}>
										<td
											class="px-5 py-3"
											style={{ color: palette.textPrimary }}>
											Jane Smith
										</td>
										<td
											class="px-5 py-3"
											style={{ color: palette.textPrimary }}>
											$125.00
										</td>
										<td class="px-5 py-3">
											<span
												class="px-2 py-1 rounded-full text-xs font-medium text-white"
												style={{ "background-color": palette.warning }}>
												Pending
											</span>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* Dark Mode Dashboard */}
				<div
					style={{ "background-color": darkPalette.bgSecondary }}
					class="p-6">
					<div class="max-w-6xl mx-auto">
						<h1
							class="text-2xl font-bold mb-6"
							style={{ color: darkPalette.textPrimary }}>
							Dashboard - Dark Mode
						</h1>
						<div class="grid grid-cols-4 gap-4 mb-6">
							<Card
								title="Total Revenue"
								value="$45,231"
								change="+20.1% from last month"
								palette={darkPalette}
							/>
							<Card
								title="Active Users"
								value="2,350"
								change="+15.3% from last month"
								palette={darkPalette}
							/>
							<Card
								title="Conversion Rate"
								value="3.2%"
								change="+0.4% from last month"
								palette={darkPalette}
							/>
							<Card
								title="Avg. Session"
								value="4m 32s"
								change="+12% from last month"
								palette={darkPalette}
							/>
						</div>

						{/* Table Example */}
						<div
							class="rounded-xl overflow-hidden"
							style={{
								"background-color": darkPalette.surface,
								"border-color": darkPalette.border,
								"border-width": "1px",
								"border-style": "solid",
							}}>
							<div
								class="px-5 py-4 border-b"
								style={{ "border-color": darkPalette.border }}>
								<h2
									class="font-semibold"
									style={{ color: darkPalette.textPrimary }}>
									Recent Transactions
								</h2>
							</div>
							<table class="w-full">
								<thead>
									<tr style={{ "background-color": darkPalette.bgTertiary }}>
										<th
											class="px-5 py-3 text-left text-sm font-medium"
											style={{ color: darkPalette.textSecondary }}>
											Customer
										</th>
										<th
											class="px-5 py-3 text-left text-sm font-medium"
											style={{ color: darkPalette.textSecondary }}>
											Amount
										</th>
										<th
											class="px-5 py-3 text-left text-sm font-medium"
											style={{ color: darkPalette.textSecondary }}>
											Status
										</th>
									</tr>
								</thead>
								<tbody>
									<tr
										style={{
											"border-bottom": `1px solid ${darkPalette.border}`,
										}}>
										<td
											class="px-5 py-3"
											style={{ color: darkPalette.textPrimary }}>
											John Doe
										</td>
										<td
											class="px-5 py-3"
											style={{ color: darkPalette.textPrimary }}>
											$250.00
										</td>
										<td class="px-5 py-3">
											<span
												class="px-2 py-1 rounded-full text-xs font-medium text-white"
												style={{ "background-color": darkPalette.success }}>
												Completed
											</span>
										</td>
									</tr>
									<tr
										style={{
											"border-bottom": `1px solid ${darkPalette.border}`,
										}}>
										<td
											class="px-5 py-3"
											style={{ color: darkPalette.textPrimary }}>
											Jane Smith
										</td>
										<td
											class="px-5 py-3"
											style={{ color: darkPalette.textPrimary }}>
											$125.00
										</td>
										<td class="px-5 py-3">
											<span
												class="px-2 py-1 rounded-full text-xs font-medium text-white"
												style={{ "background-color": darkPalette.warning }}>
												Pending
											</span>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
		);
	},
};
