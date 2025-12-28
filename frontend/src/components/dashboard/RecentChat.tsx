import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import Badge from "~/components/ui/Badge";
import Card from "~/components/ui/Card";
import { useTranslation } from "~/i18n";
import { formatTimeAgo } from "~/lib/formatters";
import { text } from "~/styles/design-system";

interface ChatMessage {
	id: string;
	sender_username: string;
	sender_is_moderator: boolean;
	message: string;
	inserted_at: string;
}

interface RecentChatProps {
	messages: ChatMessage[];
}

export default function RecentChat(props: RecentChatProps) {
	const { t } = useTranslation();

	return (
		<Card padding="none">
			<div class="flex items-center justify-between border-gray-200 border-b px-6 py-4">
				<h3 class={text.h3}>{t("dashboard.recentChat")}</h3>
				<A
					class="text-purple-600 text-sm hover:text-purple-700"
					href="/dashboard/chat-history">
					{t("dashboard.viewAll")}
				</A>
			</div>
			<div class="divide-y divide-gray-100">
				<Show
					fallback={
						<div class="px-6 py-8 text-center">
							<svg
								aria-hidden="true"
								class="mx-auto mb-3 h-12 w-12 text-gray-300"
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
							<p class="text-gray-500 text-sm">
								{t("dashboard.noChatMessages")}
							</p>
							<p class="mt-1 text-gray-400 text-xs">
								{t("dashboard.messagesWillAppear")}
							</p>
						</div>
					}
					when={props.messages.length > 0}>
					<For each={props.messages}>
						{(msg) => (
							<div class="px-6 py-3 hover:bg-gray-50">
								<div class="flex items-start gap-3">
									<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100">
										<span class="font-medium text-purple-600 text-sm">
											{msg.sender_username[0].toUpperCase()}
										</span>
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<span class="font-medium text-gray-900 text-sm">
												{msg.sender_username}
											</span>
											<Show when={msg.sender_is_moderator}>
												<Badge variant="info">Mod</Badge>
											</Show>
											<span class="text-gray-400 text-xs">
												{formatTimeAgo(msg.inserted_at)}
											</span>
										</div>
										<p class="truncate text-gray-600 text-sm">{msg.message}</p>
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
