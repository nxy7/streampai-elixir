import { useNavigate } from "@solidjs/router";
import { useLiveQuery } from "@tanstack/solid-db";
import {
	For,
	Show,
	Suspense,
	createEffect,
	createMemo,
	createSignal,
	onMount,
} from "solid-js";
import Badge, { type BadgeVariant } from "~/design-system/Badge";
import Button from "~/design-system/Button";
import Card from "~/design-system/Card";
import { cn, text } from "~/design-system/design-system";
import Input from "~/design-system/Input";
import { useTranslation } from "~/i18n";
import { useAuthenticatedUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import {
	type SupportMessage,
	type SupportTicket,
	getAdminSupportMessagesCollection,
	getAdminSupportTicketsCollection,
} from "~/lib/electric";
import { resolveSupportTicket, sendSupportMessage } from "~/sdk/ash_rpc";

type TicketStatus = "all" | "open" | "resolved";

export default function AdminSupport() {
	return (
		<Suspense fallback={<div />}>
			<AdminSupportContent />
		</Suspense>
	);
}

function AdminSupportContent() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { user: currentUser } = useAuthenticatedUser();

	useBreadcrumbs(() => [
		{ label: t("sidebar.admin"), href: "/dashboard/admin/users" },
		{ label: t("dashboardNav.support") },
	]);

	const [selectedTicketId, setSelectedTicketId] = createSignal<string | null>(
		null,
	);
	const [statusFilter, setStatusFilter] = createSignal<TicketStatus>("all");
	const [messageInput, setMessageInput] = createSignal("");
	const [isSending, setIsSending] = createSignal(false);
	const [isResolving, setIsResolving] = createSignal(false);

	let messagesEndRef: HTMLDivElement | undefined;

	createEffect(() => {
		const user = currentUser();
		if (user.role !== "admin") {
			navigate("/dashboard");
		}
	});

	const isAdmin = () => currentUser().role === "admin";

	const ticketsCollection = createMemo(() =>
		isAdmin() ? getAdminSupportTicketsCollection() : null,
	);
	const ticketsQuery = useLiveQuery(
		() =>
			ticketsCollection() as ReturnType<
				typeof getAdminSupportTicketsCollection
			>,
	);
	const messagesCollection = createMemo(() =>
		isAdmin() ? getAdminSupportMessagesCollection() : null,
	);
	const messagesQuery = useLiveQuery(
		() =>
			messagesCollection() as ReturnType<
				typeof getAdminSupportMessagesCollection
			>,
	);

	const tickets = createMemo(() => {
		const allTickets = (ticketsQuery.data ?? []) as SupportTicket[];
		const filter = statusFilter();

		const filtered =
			filter === "all"
				? allTickets
				: allTickets.filter(
						(ticket: SupportTicket) => ticket.status === filter,
					);

		return filtered.sort(
			(a: SupportTicket, b: SupportTicket) =>
				new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
		);
	});

	const selectedTicket = createMemo(() => {
		const ticketId = selectedTicketId();
		if (!ticketId) return null;
		return tickets().find((t: SupportTicket) => t.id === ticketId) || null;
	});

	const messages = createMemo(() => {
		const ticketId = selectedTicketId();
		if (!ticketId) return [];

		const allMessages = (messagesQuery.data ?? []) as SupportMessage[];
		return allMessages
			.filter((msg: SupportMessage) => msg.ticket_id === ticketId)
			.sort(
				(a: SupportMessage, b: SupportMessage) =>
					new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime(),
			);
	});

	onMount(() => {
		const firstTicket = tickets()[0];
		if (firstTicket) {
			setSelectedTicketId(firstTicket.id);
		}
	});

	createEffect(() => {
		messages();
		setTimeout(() => {
			messagesEndRef?.scrollIntoView({ behavior: "smooth" });
		}, 100);
	});

	const handleSendMessage = async () => {
		const content = messageInput().trim();
		const ticketId = selectedTicketId();
		const user = currentUser();

		if (!content || !ticketId || !user) return;

		setIsSending(true);
		try {
			const result = await sendSupportMessage({
				input: {
					content,
					ticketId,
					userId: user.id,
				},
			});

			if (result.success) {
				setMessageInput("");
			}
		} finally {
			setIsSending(false);
		}
	};

	const handleResolveTicket = async () => {
		const ticketId = selectedTicketId();
		if (!ticketId) return;

		setIsResolving(true);
		try {
			const result = await resolveSupportTicket({
				identity: ticketId,
			});

			if (result.success) {
				const remainingTickets = tickets().filter(
					(t: SupportTicket) => t.id !== ticketId,
				);
				setSelectedTicketId(remainingTickets[0]?.id || null);
			}
		} finally {
			setIsResolving(false);
		}
	};

	const getTicketTypeBadge = (
		type: SupportTicket["ticket_type"],
	): BadgeVariant => {
		switch (type) {
			case "support":
				return "info";
			case "feature_request":
				return "purple";
			case "bug_report":
				return "warning";
			default:
				return "neutral";
		}
	};

	const formatTime = (timestamp: string) => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMins < 1) return t("admin.justNow");
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffHours < 24) return `${diffHours}h ago`;
		if (diffDays < 7) return `${diffDays}d ago`;
		return date.toLocaleDateString();
	};

	return (
		<Show when={currentUser().role === "admin"}>
			<div class="mx-auto max-w-6xl">
				<div class="flex gap-4" style="height: calc(100vh - 12rem)">
					{/* Left panel: Ticket list */}
					<Card
						class="flex w-80 shrink-0 flex-col overflow-hidden"
						padding="none"
						variant="ghost">
						{/* Header */}
						<div class="border-current/5 border-b px-4 py-3">
							<h3 class={text.h3}>{t("admin.supportChat")}</h3>
							<p class={text.muted}>{t("admin.supportChatDescription")}</p>
						</div>

						{/* Filter tabs */}
						<div class="flex border-current/5 border-b">
							<button
								class={cn(
									"flex-1 px-4 py-2 font-medium text-sm transition-colors",
									statusFilter() === "all"
										? "border-primary border-b-2 text-primary"
										: "text-neutral-600 hover:text-neutral-900",
								)}
								onClick={() => setStatusFilter("all")}
								type="button">
								{t("admin.allTickets")}
							</button>
							<button
								class={cn(
									"flex-1 px-4 py-2 font-medium text-sm transition-colors",
									statusFilter() === "open"
										? "border-primary border-b-2 text-primary"
										: "text-neutral-600 hover:text-neutral-900",
								)}
								onClick={() => setStatusFilter("open")}
								type="button">
								{t("admin.openTickets")}
							</button>
							<button
								class={cn(
									"flex-1 px-4 py-2 font-medium text-sm transition-colors",
									statusFilter() === "resolved"
										? "border-primary border-b-2 text-primary"
										: "text-neutral-600 hover:text-neutral-900",
								)}
								onClick={() => setStatusFilter("resolved")}
								type="button">
								{t("admin.resolvedTickets")}
							</button>
						</div>

						{/* Ticket list */}
						<div class="flex-1 overflow-y-auto">
							<Show
								fallback={
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
								}
								when={tickets().length > 0}>
								<For each={tickets()}>
									{(ticket) => (
										<button
											class={cn(
												"w-full border-current/5 border-b px-4 py-3 text-left transition-colors",
												selectedTicketId() === ticket.id
													? "bg-surface-inset"
													: "hover:bg-surface-inset/50",
											)}
											onClick={() => setSelectedTicketId(ticket.id)}
											type="button">
											<div class="flex items-start justify-between gap-2">
												<h4 class="line-clamp-1 font-medium text-neutral-900 text-sm">
													{ticket.subject}
												</h4>
												<span class="shrink-0 text-neutral-500 text-xs">
													{formatTime(ticket.updated_at)}
												</span>
											</div>
											<div class="mt-2 flex gap-2">
												<Badge
													size="sm"
													variant={getTicketTypeBadge(ticket.ticket_type)}>
													{ticket.ticket_type.replace("_", " ")}
												</Badge>
												<Badge
													size="sm"
													variant={
														ticket.status === "open" ? "success" : "neutral"
													}>
													{ticket.status}
												</Badge>
											</div>
										</button>
									)}
								</For>
							</Show>
						</div>
					</Card>

					{/* Right panel: Chat area */}
					<Card
						class="flex flex-1 flex-col overflow-hidden"
						padding="none"
						variant="ghost">
						<Show
							fallback={
								<div class="flex h-full items-center justify-center">
									<div class="text-center">
										<svg
											aria-hidden="true"
											class="mx-auto h-16 w-16 text-neutral-400"
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
										<p class="mt-4 text-neutral-600 text-sm">
											{t("admin.selectConversation")}
										</p>
									</div>
								</div>
							}
							when={selectedTicket()}>
							{(ticket) => (
								<>
									{/* Header */}
									<div class="flex items-center justify-between border-current/5 border-b px-6 py-4">
										<div>
											<h3 class={text.h3}>{ticket().subject}</h3>
											<div class="mt-1 flex gap-2">
												<Badge
													size="sm"
													variant={getTicketTypeBadge(ticket().ticket_type)}>
													{ticket().ticket_type.replace("_", " ")}
												</Badge>
												<Badge
													size="sm"
													variant={
														ticket().status === "open" ? "success" : "neutral"
													}>
													{ticket().status}
												</Badge>
											</div>
										</div>
										<Show when={ticket().status === "open"}>
											<Button
												disabled={isResolving()}
												onClick={handleResolveTicket}
												size="sm"
												variant="success">
												{isResolving()
													? t("admin.resolving")
													: t("admin.resolve")}
											</Button>
										</Show>
									</div>

									{/* Messages */}
									<div class="flex-1 space-y-4 overflow-y-auto px-6 py-4">
										<For each={messages()}>
											{(message) => {
												const isAdmin = message.user_id === currentUser().id;
												return (
													<div
														class={cn(
															"flex",
															isAdmin ? "justify-end" : "justify-start",
														)}>
														<div
															class={cn(
																"max-w-[70%] rounded-lg px-4 py-2",
																isAdmin
																	? "bg-primary/10 text-primary"
																	: "bg-surface-inset",
															)}>
															<p class="text-sm">{message.content}</p>
															<p
																class={cn(
																	"mt-1 text-xs",
																	isAdmin
																		? "text-primary/70"
																		: "text-neutral-500",
																)}>
																{formatTime(message.inserted_at)}
															</p>
														</div>
													</div>
												);
											}}
										</For>
										<div ref={messagesEndRef} />
									</div>

									{/* Input area */}
									<Show when={ticket().status === "open"}>
										<div class="border-current/5 border-t px-6 py-4">
											<form
												class="flex gap-2"
												onSubmit={(e) => {
													e.preventDefault();
													handleSendMessage();
												}}>
												<Input
													class="flex-1 bg-surface-inset"
													disabled={isSending()}
													onInput={(e) =>
														setMessageInput(e.currentTarget.value)
													}
													placeholder={t("admin.typeMessage")}
													type="text"
													value={messageInput()}
												/>
												<Button
													disabled={!messageInput().trim() || isSending()}
													size="sm"
													type="submit"
													variant="primary">
													{isSending() ? t("admin.sending") : t("admin.send")}
												</Button>
											</form>
										</div>
									</Show>
								</>
							)}
						</Show>
					</Card>
				</div>
			</div>
		</Show>
	);
}
