import { A, useLocation, useNavigate } from "@solidjs/router";
import {
	createEffect,
	createMemo,
	createSignal,
	For,
	type JSX,
	Show,
} from "solid-js";
import { getLogoutUrl, useCurrentUser } from "~/lib/auth";
import { useUserPreferencesForUser } from "~/lib/useElectric";
import NotificationBell from "./NotificationBell";

interface DashboardLayoutProps {
	children: JSX.Element;
}

export default function DashboardLayout(props: DashboardLayoutProps) {
	const { user, isLoading } = useCurrentUser();
	const location = useLocation();
	const navigate = useNavigate();
	const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);
	const [mobileSidebarOpen, setMobileSidebarOpen] = createSignal(false);

	// Redirect to login if user is not authenticated
	createEffect(() => {
		if (!isLoading() && !user()) {
			navigate("/login", { replace: true });
		}
	});

	// Use Electric-synced preferences for real-time avatar/name updates
	const prefs = useUserPreferencesForUser(() => user()?.id);

	// Auto-detect current page from URL
	const currentPage = createMemo(() => {
		const path = location.pathname;
		if (path === "/dashboard") return "dashboard";
		if (path.startsWith("/dashboard/analytics")) return "analytics";
		if (path.startsWith("/dashboard/stream-history")) return "stream-history";
		if (path.startsWith("/dashboard/stream")) return "stream";
		if (path.startsWith("/dashboard/chat-history")) return "chat-history";
		if (path.startsWith("/dashboard/viewers")) return "viewers";
		if (path.startsWith("/dashboard/widgets")) return "widgets";
		if (path.startsWith("/dashboard/smart-canvas")) return "smart-canvas";
		if (path.startsWith("/dashboard/settings")) return "settings";
		if (path.startsWith("/dashboard/admin/users")) return "users";
		return "";
	});

	// Extract page title from current page
	const pageTitle = createMemo(() => {
		const page = currentPage();
		if (!page) return "Dashboard";
		return page
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	});

	const navSections = [
		{
			title: "Overview",
			items: [
				{
					url: "/dashboard",
					label: "Dashboard",
					icon: (
						<svg
							aria-hidden="true"
							class="sidebar-icon h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
							/>
						</svg>
					),
				},
				{
					url: "/dashboard/analytics",
					label: "Analytics",
					icon: (
						<svg
							aria-hidden="true"
							class="sidebar-icon h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
					),
				},
			],
		},
		{
			title: "Streaming",
			items: [
				{
					url: "/dashboard/stream",
					label: "Stream",
					icon: (
						<svg
							aria-hidden="true"
							class="sidebar-icon h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					),
				},
				{
					url: "/dashboard/chat-history",
					label: "Chat History",
					icon: (
						<svg
							aria-hidden="true"
							class="sidebar-icon h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
							/>
						</svg>
					),
				},
				{
					url: "/dashboard/viewers",
					label: "Viewers",
					icon: (
						<svg
							aria-hidden="true"
							class="sidebar-icon h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
					),
				},
				{
					url: "/dashboard/stream-history",
					label: "Stream History",
					icon: (
						<svg
							aria-hidden="true"
							class="sidebar-icon h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					),
				},
			],
		},
		{
			title: "Widgets",
			items: [
				{
					url: "/dashboard/widgets",
					label: "Widgets",
					icon: (
						<svg
							aria-hidden="true"
							class="sidebar-icon h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
							/>
						</svg>
					),
				},
				{
					url: "/dashboard/smart-canvas",
					label: "Smart Canvas",
					icon: (
						<svg
							aria-hidden="true"
							class="sidebar-icon h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
							/>
						</svg>
					),
				},
			],
		},
		{
			title: "Account",
			items: [
				{
					url: "/dashboard/settings",
					label: "Settings",
					icon: (
						<svg
							aria-hidden="true"
							class="sidebar-icon h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					),
				},
			],
		},
	];

	const adminSections = [
		{
			title: "Admin",
			items: [
				{
					url: "/dashboard/admin/users",
					label: "Users",
					icon: (
						<svg
							aria-hidden="true"
							class="sidebar-icon h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					),
				},
				{
					url: "/dashboard/admin/notifications",
					label: "Notifications",
					icon: (
						<svg
							aria-hidden="true"
							class="sidebar-icon h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
							/>
						</svg>
					),
				},
			],
		},
	];

	// Wait for both auth and Electric sync to complete before rendering
	const isFullyLoaded = () => !isLoading() && user() && prefs.isReady();

	return (
		<Show
			when={isFullyLoaded()}
			fallback={
				<div class="flex h-screen items-center justify-center bg-gray-50">
					<div class="text-center">
						<div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
						<p class="text-gray-600">Loading...</p>
					</div>
				</div>
			}>
			<div class="flex h-screen">
				{/* Mobile sidebar backdrop */}
				<Show when={mobileSidebarOpen()}>
					<button
						type="button"
						class="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
						onClick={() => setMobileSidebarOpen(false)}
						aria-label="Close sidebar"
					/>
				</Show>

				{/* Sidebar */}
				<div
					class={`sidebar fixed inset-y-0 left-0 z-50 flex flex-col overflow-y-auto bg-gray-900 text-white transition-all duration-300 ease-in-out ${
						sidebarCollapsed() ? "w-20" : "w-64"
					} ${
						mobileSidebarOpen() ? "translate-x-0" : "-translate-x-full"
					} md:translate-x-0`}
					style={{
						"scrollbar-width": "none",
						"-ms-overflow-style": "none",
					}}>
					{/* Sidebar Header */}
					<div class="relative flex items-center justify-center border-gray-700 border-b p-4">
						<A
							href="/"
							class="flex items-center space-x-2 transition-opacity hover:opacity-80">
							<img
								src="/images/logo-white.png"
								alt="Streampai Logo"
								class="h-8 w-8"
							/>
							<span
								class={`font-bold text-white text-xl transition-opacity ${
									sidebarCollapsed()
										? "w-0 overflow-hidden opacity-0"
										: "opacity-100"
								}`}>
								Streampai
							</span>
						</A>
						<button
							type="button"
							onClick={() => setSidebarCollapsed(!sidebarCollapsed())}
							class="absolute right-2 hidden rounded-lg p-1.5 transition-colors hover:bg-gray-700 md:block">
							<svg
								aria-hidden="true"
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									class={sidebarCollapsed() ? "block" : "hidden"}
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 5l7 7-7 7M5 5l7 7-7 7"
								/>
								<path
									class={sidebarCollapsed() ? "hidden" : "block"}
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
								/>
							</svg>
						</button>
					</div>

					{/* Main Navigation */}
					<nav class="mt-6 flex-1">
						<For each={navSections}>
							{(section) => (
								<div class="mb-8 px-4">
									<h3
										class={`mb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider transition-opacity ${
											sidebarCollapsed()
												? "h-0 overflow-hidden opacity-0"
												: "opacity-100"
										}`}>
										{section.title}
									</h3>
									<div class="space-y-2">
										<For each={section.items}>
											{(item) => (
												<A
													href={item.url}
													class={`nav-item flex items-center rounded-lg p-3 transition-colors ${
														currentPage() ===
														item.label.toLowerCase().replace(" ", "-")
															? "bg-purple-600 text-white"
															: "text-gray-300 hover:bg-gray-700 hover:text-white"
													} ${sidebarCollapsed() ? "justify-center" : ""}`}
													title={item.label}>
													{item.icon}
													<span
														class={`ml-3 transition-opacity ${
															sidebarCollapsed()
																? "w-0 overflow-hidden opacity-0"
																: "opacity-100"
														}`}>
														{item.label}
													</span>
												</A>
											)}
										</For>
									</div>
								</div>
							)}
						</For>

						<Show when={user()?.role === "admin"}>
							<For each={adminSections}>
								{(section) => (
									<div class="mb-8 px-4">
										<h3
											class={`mb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider transition-opacity ${
												sidebarCollapsed()
													? "h-0 overflow-hidden opacity-0"
													: "opacity-100"
											}`}>
											{section.title}
										</h3>
										<div class="space-y-2">
											<For each={section.items}>
												{(item) => (
													<A
														href={item.url}
														class={`nav-item flex items-center rounded-lg p-3 transition-colors ${
															currentPage() ===
															item.label.toLowerCase().replace(" ", "-")
																? "bg-purple-600 text-white"
																: "text-gray-300 hover:bg-gray-700 hover:text-white"
														} ${sidebarCollapsed() ? "justify-center" : ""}`}
														title={item.label}>
														{item.icon}
														<span
															class={`ml-3 transition-opacity ${
																sidebarCollapsed()
																	? "w-0 overflow-hidden opacity-0"
																	: "opacity-100"
															}`}>
															{item.label}
														</span>
													</A>
												)}
											</For>
										</div>
									</div>
								)}
							</For>
						</Show>
					</nav>

					{/* Bottom Logout Section */}
					<div class="space-y-2 border-gray-700 border-t p-4">
						<Show when={user()?.isModerator}>
							<A
								href="/dashboard/moderate"
								class={`nav-item flex w-full items-center rounded-lg p-3 text-gray-300 transition-colors hover:bg-blue-600 hover:text-white ${
									sidebarCollapsed() ? "justify-center" : ""
								}`}>
								<svg
									aria-hidden="true"
									class="h-5 w-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
									/>
								</svg>
								<span
									class={`ml-3 transition-opacity ${
										sidebarCollapsed()
											? "w-0 overflow-hidden opacity-0"
											: "opacity-100"
									}`}>
									Moderate
								</span>
							</A>
						</Show>

						<a
							href={getLogoutUrl()}
							rel="external"
							class={`nav-item flex w-full items-center rounded-lg p-3 text-gray-300 transition-colors hover:bg-red-600 hover:text-white ${
								sidebarCollapsed() ? "justify-center" : ""
							}`}>
							<svg
								aria-hidden="true"
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							<span
								class={`ml-3 transition-opacity ${
									sidebarCollapsed()
										? "w-0 overflow-hidden opacity-0"
										: "opacity-100"
								}`}>
								Sign Out
							</span>
						</a>
					</div>
				</div>

				{/* Main Content Wrapper */}
				<div
					class={`flex flex-1 flex-col transition-all duration-300 ${
						sidebarCollapsed() ? "md:ml-20" : "md:ml-64"
					}`}>
					{/* Top Header */}
					<header class="sticky top-0 z-30 flex h-16 items-center justify-between border-gray-200 border-b bg-white px-4 shadow-sm md:px-6">
						{/* Mobile menu button */}
						<button
							type="button"
							onClick={() => setMobileSidebarOpen(true)}
							class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden">
							<svg
								aria-hidden="true"
								class="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						</button>

						{/* Page title */}
						<h1 class="hidden font-semibold text-gray-900 text-xl md:block">
							{pageTitle()}
						</h1>

						<div class="flex items-center space-x-4">
							<NotificationBell />
							<Show when={user()}>
								<Show
									when={prefs.data()}
									fallback={
										<div class="flex items-center space-x-3">
											<div class="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
											<div class="hidden md:block">
												<div class="h-4 w-20 animate-pulse rounded bg-gray-200" />
												<div class="mt-1 h-3 w-14 animate-pulse rounded bg-gray-200" />
											</div>
										</div>
									}>
									<div class="flex items-center space-x-3">
										<A
											href="/dashboard/settings"
											class="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-purple-500 transition-colors hover:bg-purple-600"
											title="Go to Settings">
											<Show
												when={prefs.data()?.avatar_url}
												fallback={
													<span class="font-medium text-sm text-white">
														{prefs.data()?.name?.[0]?.toUpperCase() ||
															user()?.email?.[0]?.toUpperCase() ||
															""}
													</span>
												}>
												<img
													src={prefs.data()?.avatar_url ?? ""}
													alt="User Avatar"
													class="h-full w-full object-cover"
												/>
											</Show>
										</A>
										<div class="hidden md:block">
											<p class="font-medium text-gray-900 text-sm">
												{prefs.data()?.name || user()?.email || ""}
											</p>
											<p class="text-gray-500 text-xs">Free Plan</p>
										</div>
									</div>
								</Show>
							</Show>
						</div>
					</header>

					{/* Main Content Area */}
					<main class="flex-1 overflow-y-auto bg-gray-50 p-6">
						{props.children}
					</main>
				</div>
			</div>
		</Show>
	);
}
