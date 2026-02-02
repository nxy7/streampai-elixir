import { For, Show, createSignal, onCleanup } from "solid-js";
import PlatformIcon from "~/components/PlatformIcon";
import { formatDuration } from "~/lib/formatters";

interface PlatformStatus {
	status?: string;
	viewer_count?: number;
	url?: string;
}

interface LiveStatusBadgeProps {
	platforms: Record<string, PlatformStatus>;
	duration: number;
	class?: string;
	onStopStream?: () => void;
	isStopping?: boolean;
	stopLabel?: string;
	stoppingLabel?: string;
}

function ViewerIcon() {
	return (
		<svg
			aria-hidden="true"
			class="h-3 w-3 shrink-0 text-neutral-400"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			viewBox="0 0 24 24">
			<path
				d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	);
}

export default function LiveStatusBadge(props: LiveStatusBadgeProps) {
	const [isOpen, setIsOpen] = createSignal(false);
	let closeTimeout: ReturnType<typeof setTimeout> | undefined;

	const totalViewers = () =>
		Object.values(props.platforms).reduce(
			(sum, info) => sum + (info?.viewer_count ?? 0),
			0,
		);

	const viewerPercent = (count: number) => {
		const total = totalViewers();
		if (total === 0) return 0;
		return Math.round((count / total) * 100);
	};

	const handleMouseEnter = () => {
		clearTimeout(closeTimeout);
		setIsOpen(true);
	};

	const handleMouseLeave = () => {
		closeTimeout = setTimeout(() => setIsOpen(false), 150);
	};

	onCleanup(() => clearTimeout(closeTimeout));

	const rowContent = (platform: string, info: PlatformStatus) => {
		const count = info?.viewer_count ?? 0;
		return (
			<>
				<PlatformIcon platform={platform} size="sm" />
				<span class="flex-1 font-medium text-neutral-700 capitalize">
					{platform}
				</span>
				<span class="flex items-center gap-1.5 text-neutral-500">
					<span class="font-medium text-neutral-600 tabular-nums">{count}</span>
					<span class="text-neutral-400">({viewerPercent(count)}%)</span>
					<ViewerIcon />
				</span>
			</>
		);
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: tooltip container with mouse hover tracking
		<div
			class={`relative ${props.class ?? ""}`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}>
			{/* Trigger badge — sized to match Stop Stream button */}
			<button
				class="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1 font-medium text-red-400 text-xs transition-all duration-200 hover:bg-red-500/30"
				type="button">
				<span class="h-2 w-2 animate-pulse rounded-full bg-red-400" />
				<span>LIVE</span>
				<span class="text-red-400/60">·</span>
				<span>{totalViewers()}</span>
				{/* Duration reveal — grid trick for smooth width animation */}
				<div
					class="grid transition-[grid-template-columns] duration-300 ease-out"
					style={{
						"grid-template-columns": isOpen() ? "1fr" : "0fr",
					}}>
					<div class="flex items-center gap-1.5 overflow-hidden">
						<span class="text-red-400/60">·</span>
						<span class="whitespace-nowrap font-mono">
							{formatDuration(props.duration)}
						</span>
					</div>
				</div>
			</button>

			{/* Hover dropdown — slides in from right */}
			<div
				class="absolute top-full right-0 z-30 mt-1.5 min-w-[220px] rounded-lg border border-neutral-200 bg-surface p-1.5 shadow-lg transition-all duration-200 ease-out"
				style={{
					opacity: isOpen() ? "1" : "0",
					transform: isOpen() ? "translateX(0)" : "translateX(-12px)",
					"pointer-events": isOpen() ? "auto" : "none",
				}}>
				<For each={Object.entries(props.platforms)}>
					{([platform, info]) => (
						<Show
							fallback={
								<div class="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs">
									{rowContent(platform, info)}
								</div>
							}
							when={info?.url}>
							<a
								class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors duration-150 hover:bg-neutral-100"
								href={info?.url}
								rel="noopener noreferrer"
								target="_blank">
								{rowContent(platform, info)}
							</a>
						</Show>
					)}
				</For>
				<Show when={props.onStopStream}>
					<div class="mt-1 border-neutral-200 border-t pt-1">
						<button
							class="w-full rounded-md bg-red-600 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-red-700 disabled:opacity-50"
							disabled={props.isStopping}
							onClick={props.onStopStream}
							type="button">
							{props.isStopping
								? (props.stoppingLabel ?? "Stopping...")
								: (props.stopLabel ?? "Stop Stream")}
						</button>
					</div>
				</Show>
			</div>
		</div>
	);
}
