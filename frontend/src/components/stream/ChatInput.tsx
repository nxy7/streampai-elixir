import {
	For,
	Show,
	createMemo,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js";
import PlatformIcon from "~/components/PlatformIcon";
import { input } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import type { Platform } from "./types";

interface ChatInputProps {
	availablePlatforms: Platform[];
	onSendMessage?: (message: string, platforms: Platform[]) => void;
}

export function ChatInput(props: ChatInputProps) {
	const { t } = useTranslation();
	const [chatMessage, setChatMessage] = createSignal("");
	const [selectedPlatforms, setSelectedPlatforms] = createSignal<Set<Platform>>(
		new Set(props.availablePlatforms),
	);
	const [showPlatformPicker, setShowPlatformPicker] = createSignal(false);
	let pickerRef: HTMLDivElement | undefined;

	onMount(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				showPlatformPicker() &&
				pickerRef &&
				!pickerRef.contains(e.target as Node)
			) {
				setShowPlatformPicker(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		onCleanup(() =>
			document.removeEventListener("mousedown", handleClickOutside),
		);
	});

	const togglePlatform = (platform: Platform) => {
		setSelectedPlatforms((current) => {
			const newSet = new Set(current);
			if (newSet.has(platform)) {
				if (newSet.size > 1) {
					newSet.delete(platform);
				}
			} else {
				newSet.add(platform);
			}
			return newSet;
		});
	};

	const selectAllPlatforms = () => {
		setSelectedPlatforms(new Set(props.availablePlatforms));
	};

	const handleSendMessage = () => {
		const message = chatMessage().trim();
		if (message && props.onSendMessage) {
			props.onSendMessage(message, [...selectedPlatforms()]);
			setChatMessage("");
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const platformSummary = createMemo(() => {
		const selected = selectedPlatforms();
		const available = props.availablePlatforms;
		if (selected.size === available.length) {
			return t("stream.chat.all");
		}
		if (selected.size === 1) {
			const platform = [...selected][0];
			return platform.charAt(0).toUpperCase() + platform.slice(1);
		}
		return t("stream.chat.platformCount", { count: selected.size });
	});

	return (
		<div class="shrink-0 border-gray-200 border-t pt-3">
			{/* Platform Picker */}
			<Show when={props.availablePlatforms.length > 0}>
				<div class="relative mb-2" ref={pickerRef}>
					<button
						class="flex items-center gap-1.5 text-gray-500 text-xs transition-colors hover:text-gray-700"
						onClick={() => setShowPlatformPicker(!showPlatformPicker())}
						type="button">
						<span>{t("stream.chat.sendTo")}</span>
						<span class="font-medium text-gray-700">{platformSummary()}</span>
						<svg
							aria-hidden="true"
							class={`h-3 w-3 transition-transform ${showPlatformPicker() ? "rotate-180" : ""}`}
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							viewBox="0 0 24 24">
							<path
								d="M19 9l-7 7-7-7"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>

					{/* Platform Selection Dropdown */}
					<Show when={showPlatformPicker()}>
						<div class="absolute bottom-full left-0 z-10 mb-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
							<div class="mb-2 flex items-center justify-between gap-3">
								<span class="font-medium text-gray-700 text-xs">
									{t("stream.chat.selectPlatforms")}
								</span>
								<button
									class="text-purple-600 text-xs hover:text-purple-700"
									onClick={selectAllPlatforms}
									type="button">
									{t("stream.chat.selectAll")}
								</button>
							</div>
							<div class="flex flex-wrap gap-1.5">
								<For each={props.availablePlatforms}>
									{(platform) => (
										<button
											class={`relative flex items-center overflow-hidden rounded-full py-1 pr-2.5 pl-9 text-xs transition-all ${
												selectedPlatforms().has(platform)
													? "bg-purple-50 text-purple-700 ring-1 ring-purple-300"
													: "bg-gray-100 text-gray-500 hover:bg-gray-200"
											}`}
											onClick={() => togglePlatform(platform)}
											type="button">
											<div class="absolute top-1/2 left-0 -translate-y-1/2">
												<PlatformIcon platform={platform} size="md" />
											</div>
											<span class="capitalize">{platform}</span>
										</button>
									)}
								</For>
							</div>
						</div>
					</Show>
				</div>
			</Show>

			{/* Message Input */}
			<div class="flex items-stretch">
				<input
					class={`${input.text} flex-1`}
					disabled={props.availablePlatforms.length === 0}
					onInput={(e) => setChatMessage(e.currentTarget.value)}
					onKeyDown={handleKeyDown}
					placeholder={
						props.availablePlatforms.length === 0
							? t("stream.noPlatformsConnected")
							: t("stream.sendMessageToChat")
					}
					type="text"
					value={chatMessage()}
				/>
				<button
					aria-label={t("stream.sendMessageToChat")}
					class="send-btn shrink-0 rounded-r-lg bg-purple-600 px-3 py-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
					disabled={
						!chatMessage().trim() || props.availablePlatforms.length === 0
					}
					onClick={handleSendMessage}
					type="button">
					<svg
						aria-hidden="true"
						class="h-5 w-5"
						fill="currentColor"
						viewBox="0 0 24 24">
						<path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
					</svg>
				</button>
			</div>
		</div>
	);
}
