import { Show } from "solid-js";

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
	sm: "text-xl",
	md: "text-2xl",
	lg: "text-3xl",
	xl: "text-4xl",
};

export default function Logo(props: LogoProps) {
	const size = () => props.size ?? "md";

	return (
		<div class={`flex items-center gap-2 ${props.class ?? ""}`}>
			<div
				aria-label="Streampai Logo"
				class={`shrink-0 bg-foreground ${sizeClasses[size()]}`}
				role="img"
				style={{
					"-webkit-mask-image": "url(/images/logo-white.png)",
					"mask-image": "url(/images/logo-white.png)",
					"-webkit-mask-size": "contain",
					"mask-size": "contain",
					"-webkit-mask-repeat": "no-repeat",
					"mask-repeat": "no-repeat",
					"-webkit-mask-position": "center",
					"mask-position": "center",
				}}
			/>
			<Show when={props.showText}>
				<span class={`font-bold text-foreground ${textSizeClasses[size()]}`}>
					Streampai
				</span>
			</Show>
		</div>
	);
}
