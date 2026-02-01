import type { JSX } from "solid-js";

export type PlatformId =
	| "twitch"
	| "youtube"
	| "kick"
	| "facebook"
	| "tiktok"
	| "trovo"
	| "instagram"
	| "rumble";

interface PlatformConfig {
	color: string;
	icon: (props: { class?: string }) => JSX.Element;
}

const PLATFORMS: Record<string, PlatformConfig> = {
	twitch: {
		color: "bg-[#9146FF]",
		icon: (props) => (
			<svg
				aria-hidden="true"
				class={props.class}
				fill="currentColor"
				viewBox="0 0 24 24">
				<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
			</svg>
		),
	},
	youtube: {
		color: "bg-[#FF0000]",
		icon: (props) => (
			<svg
				aria-hidden="true"
				class={props.class}
				fill="currentColor"
				viewBox="0 0 24 24">
				<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
			</svg>
		),
	},
	kick: {
		color: "bg-[#53FC18]",
		icon: (props) => (
			<svg
				aria-hidden="true"
				class={props.class}
				fill="currentColor"
				viewBox="0 0 24 24">
				<path d="M1.333 0h8v5.333H12V2.667h2.667V0h8v8H20v2.667h-2.667v2.666H20V16h2.667v8h-8v-2.667H12v-2.666H9.333V24h-8Z" />
			</svg>
		),
	},
	facebook: {
		color: "bg-[#0866FF]",
		icon: (props) => (
			<svg
				aria-hidden="true"
				class={props.class}
				fill="currentColor"
				viewBox="0 0 24 24">
				<path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
			</svg>
		),
	},
};

const ICON_TEXT_COLOR: Record<string, string> = {
	kick: "text-black",
};

interface PlatformIconProps {
	platform: string;
	size?: "sm" | "md" | "lg";
	class?: string;
}

const SIZE_CLASSES = {
	sm: { container: "h-6 w-6", icon: "h-3 w-3" },
	md: { container: "h-8 w-8", icon: "h-4 w-4" },
	lg: { container: "h-10 w-10", icon: "h-5 w-5" },
};

export default function PlatformIcon(props: PlatformIconProps) {
	const size = () => props.size ?? "md";
	const config = () => PLATFORMS[props.platform];
	const sizeClasses = () => SIZE_CLASSES[size()];
	const textColor = () => ICON_TEXT_COLOR[props.platform] ?? "text-white";

	return (
		<div
			class={`flex items-center justify-center rounded ${sizeClasses().container} ${config()?.color ?? "bg-neutral-500"} ${props.class ?? ""}`}>
			{config() ? (
				config().icon({ class: `${sizeClasses().icon} ${textColor()}` })
			) : (
				<span class={`font-bold text-xs ${textColor()}`}>
					{props.platform[0]?.toUpperCase() ?? "?"}
				</span>
			)}
		</div>
	);
}

export function getPlatformColor(platform: string): string {
	return PLATFORMS[platform]?.color ?? "bg-neutral-500";
}
