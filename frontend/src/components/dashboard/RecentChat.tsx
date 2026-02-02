import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import Badge from "~/design-system/Badge";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { formatTimeAgo } from "~/lib/formatters";

interface ChatMessage {
	id: string;
	type: string;
	data: {
		type?: string;
		message?: string;
		username?: string;
		sender_channel_id?: string;
		is_moderator?: boolean;
		is_patreon?: boolean;
		is_sent_by_streamer?: boolean;
		delivery_status?: Record<string, string>;
	};
	platform: string | null;
	inserted_at: string;
}

interface RecentChatProps {
	messages: ChatMessage[];
	streamerAvatarUrl?: string | null;
}

export default function RecentChat(props: RecentChatProps) {
	const { t } = useTranslation();

	return (
		<Card padding="none">
			<div class="flex items-center justify-between border-neutral-200 border-b px-6 py-4">
				<h3 class={text.h3}>{t("dashboard.recentChat")}</h3>
				<A
					class="text-primary text-sm hover:text-primary-hover"
					href="/dashboard/chat-history">
					{t("dashboard.viewAll")}
				</A>
			</div>
			<div class="divide-y divide-neutral-100">
				<Show
					fallback={
						<div class="px-6 py-8 text-center">
							<svg
								aria-hidden="true"
								class="mx-auto mb-3 h-12 w-12 text-neutral-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							<p class="text-neutral-500 text-sm">
								{t("dashboard.noChatMessages")}
							</p>
							<p class="mt-1 text-neutral-400 text-xs">
								{t("dashboard.messagesWillAppear")}
							</p>
						</div>
					}
					when={props.messages.length > 0}>
					<For each={props.messages}>
						{(msg) => (
							<div class="px-6 py-3 hover:bg-neutral-50">
								<div class="flex items-start gap-3">
									<Show
										fallback={
											<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100">
												<span class="font-medium text-primary text-sm">
													{msg.data.username?.[0]?.toUpperCase() ?? "?"}
												</span>
											</div>
										}
										when={
											msg.data.is_sent_by_streamer && props.streamerAvatarUrl
										}>
										<img
											alt={msg.data.username ?? "Streamer"}
											class="h-8 w-8 shrink-0 rounded-full object-cover"
											src={props.streamerAvatarUrl!}
										/>
									</Show>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<Show
												fallback={
													<span class="font-medium text-neutral-900 text-sm">
														{msg.data.username}
													</span>
												}
												when={
													msg.data.sender_channel_id &&
													!msg.data.is_sent_by_streamer
												}>
												<A
													class="font-medium text-neutral-900 text-sm hover:text-primary hover:underline"
													href={`/dashboard/viewers/${msg.data.sender_channel_id}`}>
													{msg.data.username}
												</A>
											</Show>
											<Show when={msg.data.is_moderator}>
												<Badge variant="info">Mod</Badge>
											</Show>
											<span class="text-neutral-400 text-xs">
												{formatTimeAgo(msg.inserted_at)}
											</span>
										</div>
										<p class="truncate text-neutral-600 text-sm">
											{msg.data.message}
										</p>
									</div>
								</div>
							</div>
						)}
					</For>
				</Show>
			</div>
		</Card>
	);
}
