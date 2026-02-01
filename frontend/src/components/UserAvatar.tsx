import { Show } from "solid-js";
import { cn } from "~/design-system/design-system";

export interface UserAvatarProps {
	name?: string | null;
	avatarUrl?: string | null;
	size?: "sm" | "md" | "lg";
	class?: string;
}

const sizeClasses = {
	sm: "w-8 h-8 text-sm",
	md: "w-10 h-10 text-base",
	lg: "w-20 h-20 text-2xl",
};

export default function UserAvatar(props: UserAvatarProps) {
	const size = () => props.size ?? "md";
	const initial = () => props.name?.[0]?.toUpperCase() || "?";

	return (
		<div
			class={cn(
				"flex items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-primary-light to-secondary",
				sizeClasses[size()],
				props.class,
			)}>
			<Show
				fallback={<span class="font-bold text-white">{initial()}</span>}
				when={props.avatarUrl}>
				<img
					alt={props.name || "User"}
					class="h-full w-full object-cover"
					src={props.avatarUrl ?? ""}
				/>
			</Show>
		</div>
	);
}
