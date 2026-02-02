interface LiveBadgeProps {
	size?: "sm" | "md";
	class?: string;
}

export default function LiveBadge(props: LiveBadgeProps) {
	const isSmall = () => (props.size ?? "md") === "sm";

	return (
		<span
			class={`inline-flex items-center rounded-full font-semibold ${
				isSmall()
					? "bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400"
					: "bg-red-500/20 px-2.5 py-0.5 text-red-400 text-xs"
			} ${props.class ?? ""}`}>
			<span
				class={`animate-pulse rounded-full bg-red-400 ${
					isSmall() ? "mr-1 h-1.5 w-1.5" : "mr-1.5 h-2 w-2"
				}`}
			/>
			LIVE
		</span>
	);
}
