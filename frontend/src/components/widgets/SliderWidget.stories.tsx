import type { Meta, StoryObj } from "storybook-solidjs-vite";
import SliderWidget from "./SliderWidget";

const meta = {
	title: "Widgets/Slider",
	component: SliderWidget,
	parameters: {
		layout: "fullscreen",
		backgrounds: { default: "dark" },
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ width: "600px", height: "400px" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof SliderWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleImages = [
	{
		id: "1",
		url: "https://picsum.photos/seed/slide1/800/600",
		alt: "Slide 1",
		index: 0,
	},
	{
		id: "2",
		url: "https://picsum.photos/seed/slide2/800/600",
		alt: "Slide 2",
		index: 1,
	},
	{
		id: "3",
		url: "https://picsum.photos/seed/slide3/800/600",
		alt: "Slide 3",
		index: 2,
	},
];

const defaultConfig = {
	slideDuration: 5,
	transitionDuration: 500,
	transitionType: "fade" as const,
	fitMode: "contain" as const,
	backgroundColor: "#1a1a2e",
	images: sampleImages,
};

export const Default: Story = {
	args: {
		config: defaultConfig,
	},
};

export const SlideTransition: Story = {
	args: {
		config: { ...defaultConfig, transitionType: "slide" as const },
	},
};

export const SlideUpTransition: Story = {
	args: {
		config: { ...defaultConfig, transitionType: "slide-up" as const },
	},
};

export const ZoomTransition: Story = {
	args: {
		config: { ...defaultConfig, transitionType: "zoom" as const },
	},
};

export const FlipTransition: Story = {
	args: {
		config: { ...defaultConfig, transitionType: "flip" as const },
	},
};

export const CoverFit: Story = {
	args: {
		config: { ...defaultConfig, fitMode: "cover" as const },
	},
};

export const FillFit: Story = {
	args: {
		config: { ...defaultConfig, fitMode: "fill" as const },
	},
};

export const FastTransition: Story = {
	args: {
		config: {
			...defaultConfig,
			slideDuration: 2,
			transitionDuration: 200,
		},
	},
};

export const SlowTransition: Story = {
	args: {
		config: {
			...defaultConfig,
			slideDuration: 8,
			transitionDuration: 1500,
		},
	},
};

export const LightBackground: Story = {
	args: {
		config: { ...defaultConfig, backgroundColor: "#f8fafc" },
	},
};

export const SingleImage: Story = {
	args: {
		config: {
			...defaultConfig,
			images: [sampleImages[0]],
		},
	},
};

export const NoImages: Story = {
	args: {
		config: {
			...defaultConfig,
			images: [],
		},
	},
};
