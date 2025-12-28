import { useSearchParams } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import { For, Show, createMemo } from "solid-js";
import {
	chatMessagesCollection,
	createUserScopedChatMessagesCollection,
} from "~/lib/electric";

type ChatMessage = {
	id: string;
	username: string;
	message: string;
	timestamp: Date;
	platform: string;
	isModerator?: boolean;
	isSubscriber?: boolean;
};

// Cache for user-scoped chat collections
const chatCollections = new Map<
	string,
	ReturnType<typeof createUserScopedChatMessagesCollection>
>();
function getChatCollection(userId: string) {
	let collection = chatCollections.get(userId);
	if (!collection) {
		collection = createUserScopedChatMessagesCollection(userId);
		chatCollections.set(userId, collection);
	}
	return collection;
}

export default function ChatOBS() {
	const [params] = useSearchParams();
	const rawUserId = params.userId;
	const userId = () => (Array.isArray(rawUserId) ? rawUserId[0] : rawUserId);
	const maxMessages = () =>
		parseInt(
			(Array.isArray(params.maxMessages)
				? params.maxMessages[0]
				: params.maxMessages) || "10",
			10,
		);

	const chatQuery = useLiveQuery(() => {
		const id = userId();
		if (!id) return chatMessagesCollection;
		return getChatCollection(id);
	});

	const messages = createMemo(() => {
		const data = chatQuery.data || [];
		return data
			.map(
				(msg): ChatMessage => ({
					id: msg.id,
					username: msg.sender_username,
					message: msg.message,
					timestamp: new Date(msg.inserted_at),
					platform: msg.platform,
					isModerator: msg.sender_is_moderator || false,
					isSubscriber: msg.sender_is_patreon || false,
				}),
			)
			.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
			.slice(-maxMessages());
	});

	function getPlatformColor(platform: string) {
		switch (platform.toLowerCase()) {
			case "twitch":
				return "#9146FF";
			case "youtube":
				return "#FF0000";
			case "facebook":
				return "#1877F2";
			case "kick":
				return "#53FC18";
			default:
				return "#6B7280";
		}
	}

	return (
		<div class="flex h-screen w-full flex-col justify-end overflow-hidden bg-transparent p-4">
			<Show
				fallback={
					<div class="rounded-lg bg-red-500 p-4 text-2xl text-white">
						Error: No userId provided in URL parameters
					</div>
				}
				when={userId()}>
				<div class="space-y-2">
					<For each={messages()}>
						{(message) => (
							<div class="animate-slide-in-up rounded-lg bg-gray-900/90 p-3 shadow-lg backdrop-blur-sm">
								<div class="mb-1 flex items-center gap-2">
									<div
										class="h-2 w-2 rounded-full"
										style={{
											"background-color": getPlatformColor(message.platform),
										}}
									/>
									<span class="font-bold text-white">{message.username}</span>
									<Show when={message.isModerator}>
										<span class="text-green-400 text-xs">MOD</span>
									</Show>
									<Show when={message.isSubscriber}>
										<span class="text-purple-400 text-xs">SUB</span>
									</Show>
								</div>
								<div class="text-lg text-white">{message.message}</div>
							</div>
						)}
					</For>
				</div>
			</Show>
		</div>
	);
}
