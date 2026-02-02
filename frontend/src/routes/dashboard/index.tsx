import { Title } from "@solidjs/meta";
import { Show, createMemo, createSignal } from "solid-js";
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
import { getLoginUrl, useCurrentUser } from "~/lib/auth";
import { getGreetingKey, sortByInsertedAt } from "~/lib/formatters";
import {
  useDashboardStats,
  useRecentUserLivestreams,
  useRecentUserStreamEvents,
  useUserPreferencesForUser,
  useUserStreamEvents,
} from "~/lib/useElectric";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, isLoading } = useCurrentUser();
  const prefs = useUserPreferencesForUser(() => user()?.id);
  const greetingKey = getGreetingKey();

  // User-scoped data
  const INTERNAL_EVENT_TYPES = ["platform_started", "platform_stopped"];
  const HIDDEN_EVENT_TYPES = [...INTERNAL_EVENT_TYPES, "chat_message"];

  const recentEventsAll = useRecentUserStreamEvents(() => user()?.id, 50);
  const recentMessages = createMemo(() =>
    recentEventsAll()
      .filter((e) => e.type === "chat_message")
      .slice(0, 5),
  );
  const recentEvents = createMemo(() =>
    recentEventsAll()
      .filter((e) => !HIDDEN_EVENT_TYPES.includes(e.type))
      .slice(0, 5),
  );
  const recentStreams = useRecentUserLivestreams(() => user()?.id, 3);
  const stats = useDashboardStats(() => user()?.id);

  const allEventsQuery = useUserStreamEvents(() => user()?.id);
  const allEvents = createMemo(() =>
    sortByInsertedAt(allEventsQuery.data()).filter(
      (e) => !HIDDEN_EVENT_TYPES.includes(e.type),
    ),
  );

  // Alert test handler
  const [showTestAlert, setShowTestAlert] = createSignal(false);
  const handleTestAlert = () => {
    setShowTestAlert(true);
    setTimeout(() => setShowTestAlert(false), 3000);
  };

  return (
    <>
      <Title>Dashboard - Streampai</Title>
      <Show fallback={<DashboardLoadingSkeleton />} when={!isLoading()}>
        <Show
          fallback={
            <div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900">
              <div class="py-12 text-center">
                <h2 class="mb-4 font-bold text-2xl text-white">
                  {t("dashboard.notAuthenticated")}
                </h2>
                <p class="mb-6 text-neutral-300">
                  {t("dashboard.signInToAccess")}
                </p>
                <a
                  class="inline-block rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-3 font-semibold text-white transition-all hover:from-primary hover:to-secondary-hover"
                  href={getLoginUrl()}
                >
                  {t("nav.signIn")}
                </a>
              </div>
            </div>
          }
          when={user()}
        >
          <div class="space-y-6">
            {/* Header with greeting */}
            <div class="rounded-2xl p-8">
              <div>
                <h1 class="mb-2 font-bold text-3xl text-neutral-900">
                  {t(greetingKey)},{" "}
                  {prefs.data()?.name || user()?.name || "Streamer"}!
                </h1>
                <p class="text-neutral-600">{t("dashboard.welcomeMessage")}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <QuickStats
              followCount={stats.followCount()}
              totalDonations={stats.totalDonations()}
              totalMessages={stats.totalMessages()}
              uniqueViewers={stats.uniqueViewers()}
            />

            {/* Features Row: Stream Health, Engagement Score, Goals */}
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

            {/* Main Content Grid */}
            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RecentChat
                messages={recentMessages()}
                streamerAvatarUrl={prefs.data()?.avatar_url}
              />
              <RecentEvents events={recentEvents()} />
            </div>

            {/* Activity Feed with Filters */}
            <ActivityFeed events={allEvents()} />

            {/* Recent Streams */}
            <RecentStreams streams={recentStreams()} />

            {/* Quick Actions */}
            <DashboardQuickActions />
          </div>

          {/* Quick Actions Floating Panel */}
          <QuickActionsPanel onTestAlert={handleTestAlert} />

          {/* Test Alert Notification */}
          <Show when={showTestAlert()}>
            <div
              class="fixed top-4 right-4 z-50 animate-slide-in rounded-xl bg-linear-to-r from-primary to-secondary-hover px-6 py-4 text-white shadow-2xl"
              data-testid="test-alert"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-surface/20">
                  <svg
                    aria-hidden="true"
                    class="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
                  <p class="text-sm opacity-90">
                    {t("dashboard.alertsWorking")}
                  </p>
                </div>
              </div>
            </div>
          </Show>
        </Show>
      </Show>
    </>
  );
}
