import { Show } from "solid-js";
import { useTheme } from "~/lib/theme";

interface LogoProps {
	/** Size of the logo */
	size?: "sm" | "md" | "lg" | "xl";
	/** Whether to show the text alongside the logo */
	showText?: boolean;
	/** Custom class for the container */
	class?: string;
}

const sizeClasses = {
	sm: "h-6 w-6",
	md: "h-8 w-8",
	lg: "h-10 w-10",
	xl: "h-12 w-12",
};

const textSizeClasses = {
	sm: "text-lg",
	md: "text-xl",
	lg: "text-2xl",
	xl: "text-3xl",
};

export default function Logo(props: LogoProps) {
	const { theme } = useTheme();
	const size = () => props.size ?? "md";

	const logoSrc = () =>
		theme() === "dark" ? "/images/logo-white.png" : "/images/logo-black.png";

	return (
		<div class={`flex items-center gap-2 ${props.class ?? ""}`}>
			<img
				alt="Streampai Logo"
				class={`shrink-0 ${sizeClasses[size()]}`}
				src={logoSrc()}
			/>
			<Show when={props.showText}>
				<span class={`font-bold text-foreground ${textSizeClasses[size()]}`}>
					Streampai
				</span>
			</Show>
		</div>
	);
}
