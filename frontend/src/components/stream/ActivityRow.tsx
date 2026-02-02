import { A } from "@solidjs/router";
import { For, Show, createEffect, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import PlatformIcon from "~/components/PlatformIcon";
import { formatAmount, formatTimestamp } from "~/lib/formatters";
import {
	ACTIVITY_ROW_HEIGHT,
	type ActivityItem,
	type ModerationCallbacks,
	TIMEOUT_PRESETS,
	getEventColor,
	getEventIcon,
	isImportantEvent,
} from "./types";

interface ActivityRowProps {
	item: ActivityItem;
	isSticky?: boolean;
	moderationCallbacks?: ModerationCallbacks;
	stickyIndex?: number;
}

export function ActivityRow(props: ActivityRowProps) {
	const [isHovered, setIsHovered] = createSignal(false);
	const [showTimeoutMenu, setShowTimeoutMenu] = createSignal(false);

	// Calculate sticky top offset based on index (for stacking multiple sticky items)
	const stickyStyle = () => {
		if (props.isSticky && props.stickyIndex !== undefined) {
			return { top: `${props.stickyIndex * ACTIVITY_ROW_HEIGHT}px` };
		}
		return {};
	};

	// Check if this message is currently highlighted
	const isHighlighted = () =>
		props.moderationCallbacks?.highlightedMessageId === props.item.id;

	// Check if this event is currently playing on the alertbox
	const isCurrentlyPlaying = () =>
		props.moderationCallbacks?.currentAlertEventId === props.item.id;

	// Check if this event is pending (not yet shown on alertbox)
	const isPending = () =>
		isImportantEvent(props.item.type) && props.item.wasDisplayed === false;

	// Determine if this row should show moderation actions
	const showModerationActions = () => {
		if (!props.moderationCallbacks) return false;
		if (props.item.type === "chat") {
			return !!(
				props.moderationCallbacks.onBanUser ||
				props.moderationCallbacks.onTimeoutUser ||
				props.moderationCallbacks.onDeleteMessage ||
				props.moderationCallbacks.onHighlightMessage
			);
		}
		if (isImportantEvent(props.item.type)) {
			return !!props.moderationCallbacks.onReplayEvent;
		}
		return false;
	};

	// Handle replay action
	const handleReplay = (e: MouseEvent) => {
		e.stopPropagation();
		props.moderationCallbacks?.onReplayEvent?.(props.item.id);
	};

	// Handle ban action
	const handleBan = (e: MouseEvent) => {
		e.stopPropagation();
		if (props.item.viewerId && props.item.viewerPlatformId) {
			props.moderationCallbacks?.onBanUser?.(
				props.item.viewerId,
				props.item.platform,
				props.item.viewerPlatformId,
				props.item.username,
			);
		}
	};

	// Handle timeout action
	const handleTimeout = (e: MouseEvent, seconds: number) => {
		e.stopPropagation();
		setShowTimeoutMenu(false);
		setIsHovered(false); // Close hover state so action buttons hide
		if (props.item.viewerId && props.item.viewerPlatformId) {
			props.moderationCallbacks?.onTimeoutUser?.(
				props.item.viewerId,
				props.item.platform,
				props.item.viewerPlatformId,
				props.item.username,
				seconds,
			);
		}
	};

	// Handle delete action
	const handleDelete = (e: MouseEvent) => {
		e.stopPropagation();
		props.moderationCallbacks?.onDeleteMessage?.(props.item.id);
	};

	// Handle highlight action
	const handleHighlight = (e: MouseEvent) => {
		e.stopPropagation();
		if (isHighlighted()) {
			props.moderationCallbacks?.onClearHighlight?.();
		} else {
			props.moderationCallbacks?.onHighlightMessage?.(props.item);
		}
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: Hover effect for moderation UI
		<div
			class={`group relative flex items-start gap-2 rounded px-2 py-2 transition-colors hover:bg-neutral-50 ${
				isHighlighted()
					? "sticky z-20 border-primary border-l-4 bg-primary-50 shadow-md ring-1 ring-primary-200"
					: isCurrentlyPlaying()
						? "border-green-400 border-l-4 bg-green-50 ring-1 ring-green-200"
						: props.isSticky
							? "sticky z-10 border-amber-200 border-b bg-amber-50 shadow-sm"
							: isPending()
								? "border-blue-300 border-l-2 bg-blue-50/40"
								: props.item.isSentByStreamer
									? "border-primary-200 border-l-2 bg-primary-50/40"
									: isImportantEvent(props.item.type)
										? "bg-neutral-50/50"
										: ""
			}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => {
				// Don't close hover state if timeout menu is open (user might be selecting duration)
				if (!showTimeoutMenu()) {
					setIsHovered(false);
				}
			}}
			style={stickyStyle()}>
			{/* Platform icon */}
			<PlatformIcon platform={props.item.platform} size="sm" />

			{/* Content */}
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1.5">
					<Show when={props.item.type !== "chat"}>
						<span class={`text-xs ${getEventColor(props.item.type)}`}>
							{getEventIcon(props.item.type)}
						</span>
					</Show>
					<Show when={props.item.isSentByStreamer}>
						<span class="text-primary-light text-xs" title="Sent by you">
							&#x2191;
						</span>
					</Show>
					<Show
						fallback={
							<span class="font-medium text-primary-hover text-sm">You</span>
						}
						when={!props.item.isSentByStreamer}>
						<Show
							fallback={
								<span
									class={`font-medium text-sm ${props.item.type === "chat" ? "text-neutral-800" : getEventColor(props.item.type)}`}>
									{props.item.username}
								</span>
							}
							when={props.item.viewerId}>
							<A
								class={`font-medium text-sm hover:underline ${props.item.type === "chat" ? "text-neutral-800" : getEventColor(props.item.type)}`}
								href={`/dashboard/viewers/${props.item.viewerId}`}>
								{props.item.username}
							</A>
						</Show>
					</Show>
					<Show when={props.item.amount}>
						<span class="font-bold text-green-600 text-sm">
							{formatAmount(props.item.amount, props.item.currency)}
						</span>
					</Show>
					{/* Delivery status indicators for sent messages */}
					<Show when={props.item.isSentByStreamer && props.item.deliveryStatus}>
						<div class="ml-1 flex items-center gap-0.5">
							<For each={Object.entries(props.item.deliveryStatus ?? {})}>
								{([platform, status]) => (
									<span
										class={`inline-flex items-center gap-0.5 rounded px-1 text-[10px] ${
											status === "delivered"
												? "bg-green-100 text-green-600"
												: status === "failed"
													? "bg-red-100 text-red-500"
													: "bg-neutral-100 text-neutral-400"
										}`}
										title={`${platform}: ${status}`}>
										<PlatformIcon platform={platform} size="sm" />
										{status === "delivered"
											? "✓"
											: status === "failed"
												? "✗"
												: "…"}
									</span>
								)}
							</For>
						</div>
					</Show>
					<Show when={isCurrentlyPlaying()}>
						<span class="ml-auto rounded bg-green-100 px-1 py-0.5 text-[10px] text-green-700">
							&#9654; Playing
						</span>
					</Show>
					<Show when={isPending() && !isCurrentlyPlaying()}>
						<span class="ml-auto rounded bg-blue-100 px-1 py-0.5 text-[10px] text-blue-600">
							Queued
						</span>
					</Show>
					<span
						class={`${!isCurrentlyPlaying() && !isPending() ? "ml-auto" : "ml-1"} text-neutral-400 text-xs`}>
						{formatTimestamp(props.item.timestamp)}
					</span>
				</div>
				<Show when={props.item.message}>
					<div class="mt-0.5 whitespace-pre-wrap text-neutral-700 text-sm">
						{props.item.message}
					</div>
				</Show>
			</div>

			{/* Hover Actions - Icon-only buttons with tooltips */}
			<Show when={isHovered() && showModerationActions()}>
				<div class="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-0.5 rounded bg-surface/95 px-1 py-0.5 shadow-sm ring-1 ring-neutral-200">
					{/* Replay button for important events */}
					<Show
						when={
							isImportantEvent(props.item.type) &&
							props.moderationCallbacks?.onReplayEvent
						}>
						<button
							class="flex h-5 w-5 items-center justify-center rounded text-primary transition-colors hover:bg-primary-50"
							data-testid="replay-button"
							onClick={handleReplay}
							title="Replay alert"
							type="button">
							<span class="text-xs">&#x21bb;</span>
						</button>
					</Show>

					{/* Chat moderation actions */}
					<Show when={props.item.type === "chat"}>
						{/* Highlight message button */}
						<Show when={props.moderationCallbacks?.onHighlightMessage}>
							<button
								class={`flex h-5 w-5 items-center justify-center rounded transition-colors ${
									isHighlighted()
										? "bg-primary text-white hover:bg-primary-hover"
										: "text-primary-light hover:bg-primary-50 hover:text-primary"
								}`}
								data-testid="highlight-button"
								onClick={handleHighlight}
								title={
									isHighlighted() ? "Remove highlight" : "Highlight message"
								}
								type="button">
								<span class="text-xs">{isHighlighted() ? "★" : "☆"}</span>
							</button>
						</Show>

						{/* Delete message button */}
						<Show when={props.moderationCallbacks?.onDeleteMessage}>
							<button
								class="flex h-5 w-5 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
								data-testid="delete-button"
								onClick={handleDelete}
								title="Delete message"
								type="button">
								<span class="text-xs">&#x2715;</span>
							</button>
						</Show>

						{/* Timeout button with dropdown */}
						<Show when={props.moderationCallbacks?.onTimeoutUser}>
							{(() => {
								const [buttonRef, setButtonRef] =
									createSignal<HTMLButtonElement | null>(null);
								const [dropdownPos, setDropdownPos] = createSignal({
									top: 0,
									left: 0,
								});

								// Update dropdown position when menu opens
								createEffect(() => {
									if (showTimeoutMenu() && buttonRef()) {
										const rect = buttonRef()?.getBoundingClientRect();
										if (rect) {
											setDropdownPos({
												top: rect.bottom + 2,
												left: rect.right - 60, // Align right edge with button
											});
										}
									}
								});

								return (
									<>
										<button
											class="flex h-5 w-5 items-center justify-center rounded text-amber-600 transition-colors hover:bg-amber-50"
											data-testid="timeout-button"
											onClick={(e) => {
												e.stopPropagation();
												setShowTimeoutMenu(!showTimeoutMenu());
											}}
											ref={setButtonRef}
											title="Timeout user"
											type="button">
											<span class="text-xs">&#x23F1;</span>
										</button>
										<Show when={showTimeoutMenu()}>
											<Portal>
												<div
													class="fixed z-[9999] min-w-[60px] rounded border border-neutral-200 bg-surface py-0.5 shadow-lg"
													onMouseLeave={() => {
														setShowTimeoutMenu(false);
														setIsHovered(false);
													}}
													role="menu"
													style={{
														top: `${dropdownPos().top}px`,
														left: `${dropdownPos().left}px`,
													}}>
													<For each={TIMEOUT_PRESETS}>
														{(preset) => (
															<button
																class="block w-full px-2 py-0.5 text-left text-neutral-700 text-xs transition-colors hover:bg-amber-50"
																data-testid={`timeout-${preset.label}`}
																onClick={(e) =>
																	handleTimeout(e, preset.seconds)
																}
																role="menuitem"
																type="button">
																{preset.label}
															</button>
														)}
													</For>
												</div>
											</Portal>
										</Show>
									</>
								);
							})()}
						</Show>

						{/* Ban button */}
						<Show when={props.moderationCallbacks?.onBanUser}>
							<button
								class="flex h-5 w-5 items-center justify-center rounded text-red-600 transition-colors hover:bg-red-50"
								data-testid="ban-button"
								onClick={handleBan}
								title="Ban user"
								type="button">
								<span class="text-xs">&#x26D4;</span>
							</button>
						</Show>
					</Show>
				</div>
			</Show>
		</div>
	);
}
