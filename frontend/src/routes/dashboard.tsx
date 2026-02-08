import { useLocation, useNavigate, useSearchParams } from "@solidjs/router";
import {
	For,
	type JSX,
	type ParentProps,
	Show,
	createEffect,
	createMemo,
	createSignal,
} from "solid-js";
import Header from "~/components/dashboard/Header";
import {
	getCurrentPage,
	pageTitleKeyMap,
} from "~/components/dashboard/navConfig";
import Sidebar, { MobileSidebar } from "~/components/dashboard/Sidebar";
import Badge from "~/design-system/Badge";
import Button from "~/design-system/Button";
import Input, { Textarea } from "~/design-system/Input";
import { useTranslation } from "~/i18n";
import { useCurrentUser } from "~/lib/auth";
import {
	BreadcrumbProvider,
	useBreadcrumbContext,
} from "~/lib/BreadcrumbContext";
import type { SupportMessage, SupportTicket } from "~/lib/electric";
import {
	useStreamActor,
	useTicketMessages,
	useUserPreferencesForUser,
	useUserSupportTickets,
} from "~/lib/useElectric";
import { createSupportTicket, sendSupportMessage } from "~/sdk/ash_rpc";

export default function DashboardLayoutRoute(props: ParentProps) {
	const { user, isLoading } = useCurrentUser();
	const navigate = useNavigate();

	createEffect(() => {
		if (!isLoading() && !user()) {
			navigate("/login", { replace: true });
		}
	});

	return (
		<Show when={!isLoading() && user()}>
			<BreadcrumbProvider>
				<DashboardLayout>{props.children}</DashboardLayout>
			</BreadcrumbProvider>
		</Show>
	);
}

interface DashboardLayoutProps {
	children: JSX.Element;
}

type ChatView = "menu" | "new-ticket" | "ticket-list" | "chat" | "submitted";

function SupportChatButton() {
	const { t } = useTranslation();
	const { user } = useCurrentUser();
	const [open, setOpen] = createSignal(false);
	const [view, setView] = createSignal<ChatView>("menu");
	const [ticketType, setTicketType] = createSignal<
		"support" | "feature_request" | "bug_report"
	>("support");
	const [subject, setSubject] = createSignal("");
	const [message, setMessage] = createSignal("");
	const [isSubmitting, setIsSubmitting] = createSignal(false);
	const [selectedTicketId, setSelectedTicketId] = createSignal<string | null>(
		null,
	);
	const [chatInput, setChatInput] = createSignal("");
	const [isSending, setIsSending] = createSignal(false);
	let messagesEndRef: HTMLDivElement | undefined;

	const userId = () => user()?.id;
	const ticketsQuery = useUserSupportTickets(userId);
	const messagesQuery = useTicketMessages(
		() => selectedTicketId() ?? undefined,
	);

	const tickets = createMemo(() => {
		const data = (ticketsQuery.data() ?? []) as SupportTicket[];
		return [...data].sort(
			(a, b) =>
				new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
		);
	});

	const chatMessages = createMemo(() => {
		const data = (messagesQuery.data() ?? []) as SupportMessage[];
		return [...data].sort(
			(a, b) =>
				new Date(a.inserted_at).getTime() - new Date(b.inserted_at).getTime(),
		);
	});

	const selectedTicket = createMemo(() => {
		const tid = selectedTicketId();
		if (!tid) return null;
		return tickets().find((tk) => tk.id === tid) || null;
	});

	createEffect(() => {
		chatMessages();
		setTimeout(
			() => messagesEndRef?.scrollIntoView({ behavior: "smooth" }),
			100,
		);
	});

	const handleCreateTicket = async () => {
		const uid = userId();
		if (!uid || !subject().trim()) return;
		setIsSubmitting(true);
		try {
			const result = await createSupportTicket({
				input: {
					subject: subject().trim(),
					userId: uid,
					ticketType: ticketType(),
				},
				fields: ["id"],
			});
			if (result.success && result.data) {
				const newId = result.data.id;
				if (message().trim()) {
					await sendSupportMessage({
						input: {
							content: message().trim(),
							ticketId: newId,
							userId: uid,
						},
					});
				}
				setSubject("");
				setMessage("");
				if (ticketType() === "support") {
					setSelectedTicketId(newId);
					setView("chat");
				} else {
					setView("submitted");
				}
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSendChat = async () => {
		const uid = userId();
		const tid = selectedTicketId();
		if (!uid || !tid || !chatInput().trim()) return;
		setIsSending(true);
		try {
			await sendSupportMessage({
				input: { content: chatInput().trim(), ticketId: tid, userId: uid },
			});
			setChatInput("");
		} finally {
			setIsSending(false);
		}
	};

	const openNewTicket = (
		type: "support" | "feature_request" | "bug_report",
	) => {
		setTicketType(type);
		setSubject("");
		setMessage("");
		setView("new-ticket");
	};

	const openChat = (ticketId: string) => {
		setSelectedTicketId(ticketId);
		setView("chat");
	};

	const ticketTypeLabel = (type: string) => {
		if (type === "feature_request") return t("support.chat.featureRequest");
		if (type === "bug_report") return t("support.chat.bugReport");
		return t("support.chat.supportChat");
	};

	return (
		<>
			{/* Panel */}
			<div
				class={`absolute right-0 bottom-14 w-80 origin-bottom-right rounded-xl border border-current/10 bg-surface shadow-xl transition-all duration-200 ease-out ${
					open()
						? "scale-100 opacity-100"
						: "pointer-events-none scale-95 opacity-0"
				}`}>
				{/* Header */}
				<div class="flex items-center justify-between border-current/10 border-b px-4 py-3">
					<Show
						fallback={
							<span class="font-medium text-sm">{t("support.title")}</span>
						}
						when={view() !== "menu"}>
						<button
							class="flex items-center gap-1 text-primary text-sm hover:underline"
							onClick={() => setView("menu")}
							type="button">
							<svg
								aria-hidden="true"
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M15 19l-7-7 7-7"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							{t("common.back")}
						</button>
					</Show>
					<button
						class="text-neutral-400 transition-colors hover:text-neutral-600"
						onClick={() => {
							setOpen(false);
							setView("menu");
						}}
						type="button">
						<svg
							aria-hidden="true"
							class="h-4 w-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M6 18L18 6M6 6l12 12"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
					</button>
				</div>

				{/* Menu view */}
				<Show when={view() === "menu"}>
					<div class="space-y-1 p-3">
						<button
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-inset"
							onClick={() => openNewTicket("support")}
							type="button">
							<svg
								aria-hidden="true"
								class="h-5 w-5 shrink-0 text-blue-500"
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
							{t("support.chat.supportChat")}
						</button>
						<button
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-inset"
							onClick={() => openNewTicket("feature_request")}
							type="button">
							<svg
								aria-hidden="true"
								class="h-5 w-5 shrink-0 text-primary"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							{t("support.chat.featureRequest")}
						</button>
						<button
							class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-inset"
							onClick={() => openNewTicket("bug_report")}
							type="button">
							<svg
								aria-hidden="true"
								class="h-5 w-5 shrink-0 text-red-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
							{t("support.chat.bugReport")}
						</button>

						<Show when={tickets().length > 0}>
							<div class="mt-2 border-current/5 border-t pt-2">
								<button
									class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-inset"
									onClick={() => setView("ticket-list")}
									type="button">
									<svg
										aria-hidden="true"
										class="h-5 w-5 shrink-0 text-neutral-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
										/>
									</svg>
									{t("support.chat.backToTickets")} (
									{tickets().filter((t) => t.status !== "resolved").length})
								</button>
							</div>
						</Show>
					</div>
				</Show>

				{/* New ticket form */}
				<Show when={view() === "new-ticket"}>
					<div class="space-y-3 p-4">
						<Badge
							size="sm"
							variant={
								ticketType() === "support"
									? "info"
									: ticketType() === "feature_request"
										? "purple"
										: "warning"
							}>
							{ticketTypeLabel(ticketType())}
						</Badge>
						<Input
							class="bg-surface-inset"
							onInput={(e) => setSubject(e.currentTarget.value)}
							placeholder={t("support.chat.subjectPlaceholder")}
							type="text"
							value={subject()}
						/>
						<Textarea
							class="bg-surface-inset"
							onInput={(e) => setMessage(e.currentTarget.value)}
							placeholder={t("support.chat.messagePlaceholder")}
							rows={3}
							value={message()}
						/>
						<Button
							class="w-full"
							disabled={
								!subject().trim() ||
								(ticketType() !== "support" && !message().trim()) ||
								isSubmitting()
							}
							onClick={handleCreateTicket}
							size="sm"
							variant="primary">
							{isSubmitting()
								? t("support.chat.submitting")
								: t("support.chat.submit")}
						</Button>
					</div>
				</Show>

				{/* Ticket list */}
				<Show when={view() === "ticket-list"}>
					<div class="max-h-80 overflow-y-auto">
						<Show
							fallback={
								<div class="py-8 text-center text-neutral-400 text-sm">
									{t("support.chat.noMessages")}
								</div>
							}
							when={tickets().length > 0}>
							<For each={tickets()}>
								{(ticket) => {
									const isChat = ticket.ticket_type === "support";
									return (
										// biome-ignore lint/a11y/noStaticElementInteractions: Conditional interactivity based on ticket type
										<div
											class={`w-full border-current/5 border-b px-4 py-3 text-left ${isChat ? "cursor-pointer transition-colors hover:bg-surface-inset/50" : ""}`}
											onClick={() => isChat && openChat(ticket.id)}
											onKeyDown={(e) => {
												if (isChat && (e.key === "Enter" || e.key === " ")) {
													e.preventDefault();
													openChat(ticket.id);
												}
											}}
											role={isChat ? "button" : undefined}
											tabIndex={isChat ? 0 : undefined}>
											<div class="flex items-center justify-between gap-2">
												<span class="line-clamp-1 font-medium text-sm">
													{ticket.subject}
												</span>
												<Badge
													size="sm"
													variant={
														ticket.status === "open" ? "success" : "neutral"
													}>
													{ticket.status === "open"
														? t("support.chat.open")
														: t("support.chat.resolved")}
												</Badge>
											</div>
											<div class="mt-1">
												<Badge
													size="sm"
													variant={
														ticket.ticket_type === "support"
															? "info"
															: ticket.ticket_type === "feature_request"
																? "purple"
																: "warning"
													}>
													{ticketTypeLabel(ticket.ticket_type)}
												</Badge>
											</div>
										</div>
									);
								}}
							</For>
						</Show>
					</div>
				</Show>

				{/* Submitted confirmation */}
				<Show when={view() === "submitted"}>
					<div class="flex flex-col items-center gap-3 px-4 py-10 text-center">
						<svg
							aria-hidden="true"
							class="h-10 w-10 text-green-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						</svg>
						<p class="font-medium text-sm">{t("support.chat.ticketCreated")}</p>
						<Button onClick={() => setView("menu")} size="sm" variant="ghost">
							{t("common.back")}
						</Button>
					</div>
				</Show>

				{/* Chat view */}
				<Show when={view() === "chat" && selectedTicket()}>
					<div class="flex flex-col" style="height: 20rem">
						<div class="flex-1 space-y-2 overflow-y-auto px-4 py-3">
							<Show
								fallback={
									<div class="flex h-full items-center justify-center text-neutral-400 text-sm">
										{t("support.chat.noMessages")}
									</div>
								}
								when={chatMessages().length > 0}>
								<For each={chatMessages()}>
									{(msg) => {
										const isMe = msg.user_id === userId();
										return (
											<div
												class={`flex ${isMe ? "justify-end" : "justify-start"}`}>
												<div
													class={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
														isMe
															? "bg-primary/10 text-primary"
															: "bg-surface-inset"
													}`}>
													{msg.content}
												</div>
											</div>
										);
									}}
								</For>
							</Show>
							<div ref={messagesEndRef} />
						</div>

						<Show when={selectedTicket()?.status === "open"}>
							<div class="border-current/5 border-t px-3 py-2">
								<form
									class="flex gap-2"
									onSubmit={(e) => {
										e.preventDefault();
										handleSendChat();
									}}>
									<Input
										class="flex-1 bg-surface-inset"
										disabled={isSending()}
										onInput={(e) => setChatInput(e.currentTarget.value)}
										placeholder={t("support.chat.messagePlaceholder")}
										type="text"
										value={chatInput()}
									/>
									<Button
										disabled={!chatInput().trim() || isSending()}
										size="sm"
										type="submit"
										variant="primary">
										{t("admin.send")}
									</Button>
								</form>
							</div>
						</Show>
					</div>
				</Show>
			</div>

			{/* FAB Button */}
			<button
				aria-label={t("support.title")}
				class={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-200 ${
					open()
						? "bg-neutral-300 text-neutral-700"
						: "bg-surface-secondary text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700"
				}`}
				onClick={() => setOpen(!open())}
				title={t("support.title")}
				type="button">
				<svg
					aria-hidden="true"
					class={`h-5 w-5 transition-transform duration-200 ${open() ? "rotate-90" : ""}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<Show
						fallback={
							<path
								d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
							/>
						}
						when={open()}>
						<path
							d="M6 18L18 6M6 6l12 12"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						/>
					</Show>
				</svg>
			</button>
		</>
	);
}

function DashboardLayout(props: DashboardLayoutProps) {
	const { t } = useTranslation();
	const { user } = useCurrentUser();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const isFullscreen = () => searchParams.fullscreen === "true";
	const [mobileSidebarOpen, setMobileSidebarOpen] = createSignal(false);
	const { items: breadcrumbItems } = useBreadcrumbContext();

	// Use Electric-synced preferences for real-time avatar/name updates
	const prefs = useUserPreferencesForUser(() => user()?.id);

	// Stream status for sidebar LIVE badge
	const streamActor = useStreamActor(() => user()?.id);
	const isLive = () => streamActor.streamStatus() === "streaming";

	// Auto-detect current page from URL
	const currentPage = createMemo(() => getCurrentPage(location.pathname));

	// Extract page title from current page (translated)
	const pageTitle = createMemo(() => {
		const page = currentPage();
		const key = pageTitleKeyMap[page] || "dashboardNav.dashboard";
		return t(key);
	});

	return (
		<div class="flex h-screen">
			{/* Mobile sidebar backdrop */}
			<Show when={mobileSidebarOpen()}>
				<button
					aria-label={t("dashboard.closeSidebar")}
					class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
					onClick={() => setMobileSidebarOpen(false)}
					type="button"
				/>
			</Show>

			{/* Desktop Sidebar */}
			<Sidebar
				isAdmin={user()?.role === "admin"}
				isLive={isLive}
				isModerator={user()?.isModerator ?? false}
			/>

			{/* Mobile Sidebar */}
			<MobileSidebar
				isAdmin={user()?.role === "admin"}
				isLive={isLive}
				isModerator={user()?.isModerator ?? false}
				onClose={() => setMobileSidebarOpen(false)}
				open={mobileSidebarOpen}
			/>

			{/* Main area — header + content, shifted right by sidebar */}
			<div class="flex min-w-0 flex-1 flex-col md:ml-72">
				<Header
					breadcrumbItems={breadcrumbItems}
					onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
					pageTitle={pageTitle}
					prefs={prefs}
					user={user()}
				/>

				<main
					class={`flex-1 bg-neutral-50 px-4 py-6 ${isFullscreen() ? "" : "overflow-y-auto overflow-x-hidden"}`}>
					{props.children}
				</main>
			</div>

			{/* FAB container — bottom right */}
			<div class="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3">
				<SupportChatButton />
			</div>
		</div>
	);
}
