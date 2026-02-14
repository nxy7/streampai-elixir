import { Show, Suspense, createMemo, createSignal } from "solid-js";
import {
	ActivityFeed,
	DashboardLoadingSkeleton,
	DashboardQuickActions,
	QuickActionsPanel,
	QuickStats,
	RecentChat,
	RecentEvents,
	RecentStreams,
	StreamGoalsTracker,
	StreamHealthMonitor,
	ViewerEngagementScore,
} from "~/components/dashboard";
import { useTranslation } from "~/i18n";
import { useAuthenticatedUser } from "~/lib/auth";
import { useBreadcrumbs } from "~/lib/BreadcrumbContext";
import { getGreetingKey, sortByInsertedAt } from "~/lib/formatters";
import {
	useDashboardStats,
	useRecentUserLivestreams,
	useRecentUserStreamEvents,
	useUserPreferencesForUser,
	useUserStreamEvents,
} from "~/lib/useElectric";

const INTERNAL_EVENT_TYPES = ["platform_started", "platform_stopped"];
const HIDDEN_EVENT_TYPES = [...INTERNAL_EVENT_TYPES, "chat_message"];

export default function Dashboard() {
	const { t } = useTranslation();
	const { user } = useAuthenticatedUser();
	const greetingKey = getGreetingKey();

	useBreadcrumbs(() => [
		{ label: t("sidebar.overview"), href: "/dashboard" },
		{ label: t("dashboardNav.dashboard") },
	]);

	// Alert test handler
	const [showTestAlert, setShowTestAlert] = createSignal(false);
	const handleTestAlert = () => {
		setShowTestAlert(true);
		setTimeout(() => setShowTestAlert(false), 3000);
	};

	return (
		<div class="space-y-6">
			{/* Header with greeting */}
			<DashboardGreeting
				greetingKey={greetingKey}
				userId={() => user().id}
				userName={user().name}
			/>

			<Suspense fallback={<DashboardLoadingSkeleton />}>
				{/* Quick Stats */}
				<DashboardStats userId={() => user().id} />

				{/* Main Content Grid */}
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<DashboardRecentChat userId={() => user().id} />
					<DashboardRecentEvents userId={() => user().id} />
				</div>

				{/* Activity Feed with Filters */}
				<DashboardActivityFeed userId={() => user().id} />

				{/* Recent Streams */}
				<DashboardRecentStreams userId={() => user().id} />
			</Suspense>

			{/* Quick Actions */}
			<DashboardQuickActions />

			{/* Quick Actions Floating Panel */}
			<QuickActionsPanel onTestAlert={handleTestAlert} />

			{/* Test Alert Notification */}
			<Show when={showTestAlert()}>
				<div
					class="fixed top-4 right-4 z-50 animate-slide-in rounded-xl bg-linear-to-r from-primary to-secondary-hover px-6 py-4 text-white shadow-2xl"
					data-testid="test-alert">
					<div class="flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-surface/20">
							<svg
								aria-hidden="true"
								class="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
								/>
							</svg>
						</div>
						<div>
							<p class="font-bold">{t("dashboard.testAlertTitle")}</p>
							<p class="text-sm opacity-90">{t("dashboard.alertsWorking")}</p>
						</div>
					</div>
				</div>
			</Show>
		</div>
	);
}

// --- Isolated data components (each has its own Suspense boundary) ---

function DashboardGreeting(props: {
	userId: () => string;
	userName: string | null;
	greetingKey: string;
}) {
	const { t } = useTranslation();
	const prefs = useUserPreferencesForUser(props.userId);

	return (
		<div class="rounded-2xl p-8">
			<div>
				<h1 class="mb-2 font-bold text-3xl text-neutral-900">
					{t(props.greetingKey)},{" "}
					{prefs.data()?.name || props.userName || "Streamer"}!
				</h1>
				<p class="text-neutral-600">{t("dashboard.welcomeMessage")}</p>
			</div>
		</div>
	);
}

function DashboardStats(props: { userId: () => string }) {
	const stats = useDashboardStats(props.userId);

	return (
		<>
			<QuickStats
				followCount={stats.followCount()}
				totalDonations={stats.totalDonations()}
				totalMessages={stats.totalMessages()}
				uniqueViewers={stats.uniqueViewers()}
			/>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<StreamHealthMonitor />
				<ViewerEngagementScore
					chatMessages={stats.totalMessages()}
					donations={stats.donationCount()}
					follows={stats.followCount()}
					totalDonationAmount={stats.totalDonations()}
				/>
				<StreamGoalsTracker
					currentDonations={stats.totalDonations()}
					currentFollowers={stats.followCount()}
					currentMessages={stats.totalMessages()}
				/>
			</div>
		</>
	);
}

function DashboardRecentChat(props: { userId: () => string }) {
	const recentEventsAll = useRecentUserStreamEvents(props.userId, 50);
	const prefs = useUserPreferencesForUser(props.userId);
	const recentMessages = createMemo(() =>
		recentEventsAll()
			.filter((e) => e.type === "chat_message")
			.slice(0, 5),
	);

	return (
		<RecentChat
			messages={recentMessages()}
			streamerAvatarUrl={prefs.data()?.avatar_url}
		/>
	);
}

function DashboardRecentEvents(props: { userId: () => string }) {
	const recentEventsAll = useRecentUserStreamEvents(props.userId, 50);
	const recentEvents = createMemo(() =>
		recentEventsAll()
			.filter((e) => !HIDDEN_EVENT_TYPES.includes(e.type))
			.slice(0, 5),
	);

	return <RecentEvents events={recentEvents()} />;
}

function DashboardActivityFeed(props: { userId: () => string }) {
	const allEventsQuery = useUserStreamEvents(props.userId);
	const allEvents = createMemo(() =>
		sortByInsertedAt(allEventsQuery.data() ?? []).filter(
			(e) => !HIDDEN_EVENT_TYPES.includes(e.type),
		),
	);

	return <ActivityFeed events={allEvents()} />;
}

function DashboardRecentStreams(props: { userId: () => string }) {
	const recentStreams = useRecentUserLivestreams(props.userId, 3);

	return <RecentStreams streams={recentStreams()} />;
}
