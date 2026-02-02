import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { Show, createEffect } from "solid-js";
import Card from "~/design-system/Card";
import { text } from "~/design-system/design-system";
import { useTranslation } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";

export default function AdminSupport() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { user: currentUser, isLoading: authLoading } = useCurrentUser();

	createEffect(() => {
		const user = currentUser();
		if (!authLoading() && (!user || user.role !== "admin")) {
			navigate("/dashboard");
		}
	});

	return (
		<>
			<Title>Support - Admin - Streampai</Title>
			<Show
				fallback={
					<div class="flex min-h-screen items-center justify-center">
						<div class="text-neutral-500">{t("common.loading")}</div>
					</div>
				}
				when={!authLoading()}>
				<Show when={currentUser()?.role === "admin"}>
					<div class="mx-auto max-w-6xl space-y-6">
						<Card variant="ghost">
							<div class="border-neutral-200 border-b px-6 py-4">
								<h3 class={text.h3}>{t("admin.supportChat")}</h3>
								<p class={text.muted}>{t("admin.supportChatDescription")}</p>
							</div>

							<div class="py-12 text-center">
								<svg
									aria-hidden="true"
									class="mx-auto h-12 w-12 text-neutral-400"
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
								<p class="mt-4 text-neutral-500 text-sm">
									{t("admin.noSupportConversations")}
								</p>
							</div>
						</Card>
					</div>
				</Show>
			</Show>
		</>
	);
}
