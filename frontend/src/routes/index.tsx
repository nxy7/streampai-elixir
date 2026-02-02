import { Title } from "@solidjs/meta";
import { Show, createSignal } from "solid-js";
import PlatformIcon from "~/components/PlatformIcon";
import PublicFooter from "~/components/PublicFooter";
import PublicHeader from "~/components/PublicHeader";
import { useTranslation } from "~/i18n";

const LANDING_NAV_ITEMS = [
  { url: "#features", labelKey: "landing.features" },
  { url: "#about", labelKey: "landing.about" },
];

function LandingHero() {
  const { t } = useTranslation();
  const [email, setEmail] = createSignal("");
  const [message, setMessage] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const handleNewsletterSignup = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    // TODO: Implement newsletter signup via RPC
    setTimeout(() => {
      setMessage(t("landing.newsletterSuccess"));
      setLoading(false);
      setEmail("");
      setTimeout(() => setMessage(null), 7000);
    }, 1000);
  };

  return (
    <section class="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface">
      <div class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div class="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div class="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-primary-light/10 blur-3xl" />
      </div>
      <div class="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="mb-8 font-bold text-5xl text-neutral-900 md:text-7xl">
            {t("landing.heroTitle1")}{" "}
            <span class="bg-linear-to-r from-primary-light to-secondary bg-clip-text text-transparent">
              {t("landing.heroTitle2")}
            </span>
            <br />
            {t("landing.heroTitle3")}
          </h1>

          <div class="mx-auto mb-8 max-w-2xl rounded-2xl bg-neutral-50 p-6">
            <div class="mb-4 flex items-center justify-center">
              <svg
                aria-hidden="true"
                class="mr-3 h-8 w-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
              <h2 class="font-bold text-2xl text-primary">
                {t("landing.underConstruction")}
              </h2>
            </div>
            <p class="mb-6 text-center text-lg text-neutral-600">
              {t("landing.underConstructionText")}
            </p>

            <form
              class="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
              onSubmit={handleNewsletterSignup}
            >
              <input
                class="flex-1 rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-3 text-neutral-900 placeholder-neutral-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-light"
                onInput={(e) => setEmail(e.currentTarget.value)}
                placeholder={t("landing.emailPlaceholder")}
                required
                type="email"
                value={email()}
              />
              <button
                class="transform rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-3 font-semibold text-white shadow-xl transition-all hover:scale-105 hover:from-primary hover:to-secondary-hover disabled:opacity-50"
                disabled={loading()}
                type="submit"
              >
                {loading() ? t("landing.submitting") : t("landing.notifyMe")}
              </button>
            </form>

            {message() && (
              <div class="mt-3 text-center">
                <p class="font-medium text-green-600 text-sm">✓ {message()}</p>
              </div>
            )}

            {error() && (
              <div class="mt-3 text-center">
                <p class="font-medium text-red-600 text-sm">✗ {error()}</p>
              </div>
            )}
          </div>

          <p class="mx-auto mb-12 max-w-3xl text-neutral-600 text-xl leading-relaxed">
            {t("landing.heroDescription")}
          </p>

          <div class="flex flex-wrap items-center justify-center gap-8">
            <div class="flex items-center space-x-3">
              <PlatformIcon platform="twitch" />
              <span class="font-medium text-neutral-600">Twitch</span>
            </div>
            <div class="flex items-center space-x-3">
              <PlatformIcon platform="youtube" />
              <span class="font-medium text-neutral-600">YouTube</span>
            </div>
            <div class="flex items-center space-x-3">
              <PlatformIcon platform="kick" />
              <span class="font-medium text-neutral-600">Kick</span>
            </div>
            <div class="flex items-center space-x-3">
              <PlatformIcon platform="facebook" />
              <span class="font-medium text-neutral-600">Facebook</span>
            </div>
            <div class="flex items-center space-x-3">
              <div class="flex h-8 w-8 items-center justify-center rounded bg-linear-to-r from-primary-light to-secondary">
                <svg
                  aria-hidden="true"
                  class="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                  />
                </svg>
              </div>
              <span class="font-medium text-neutral-600">
                {t("landing.more")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFeatures() {
  const { t } = useTranslation();

  return (
    <>
      <section
        class="relative bg-neutral-50 py-24"
        id="features"
        style="background-image: radial-gradient(circle, var(--color-neutral-300) 1px, transparent 1px); background-size: 24px 24px"
      >
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="mb-20 text-center">
            <h2 class="mb-6 font-bold text-4xl text-neutral-900 md:text-5xl">
              {t("landing.featuresTitle1")}{" "}
              <span class="bg-linear-to-r from-primary-light to-secondary bg-clip-text text-transparent">
                {t("landing.featuresTitle2")}
              </span>
            </h2>
            <p class="mx-auto max-w-3xl text-neutral-600 text-xl">
              {t("landing.featuresSubtitle")}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div class="group rounded-2xl bg-neutral-50 p-8 transition-all hover:bg-neutral-100">
              <div class="mb-4 flex items-start space-x-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-primary-light to-secondary">
                  <svg
                    aria-hidden="true"
                    class="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                  </svg>
                </div>
                <h3 class="grow font-bold text-neutral-900 text-xl">
                  {t("landing.multiPlatformTitle")}
                </h3>
              </div>
              <p class="text-neutral-600 leading-relaxed">
                {t("landing.multiPlatformDescription")}
              </p>
            </div>

            <div class="group rounded-2xl bg-neutral-50 p-8 transition-all hover:bg-neutral-100">
              <div class="mb-4 flex items-start space-x-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-blue-500 to-cyan-500">
                  <svg
                    aria-hidden="true"
                    class="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                  </svg>
                </div>
                <h3 class="grow font-bold text-neutral-900 text-xl">
                  {t("landing.unifiedChatTitle")}
                </h3>
              </div>
              <p class="text-neutral-600 leading-relaxed">
                {t("landing.unifiedChatDescription")}
              </p>
            </div>

            <div class="group rounded-2xl bg-neutral-50 p-8 transition-all hover:bg-neutral-100">
              <div class="mb-4 flex items-start space-x-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-green-500 to-emerald-500">
                  <svg
                    aria-hidden="true"
                    class="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                  </svg>
                </div>
                <h3 class="grow font-bold text-neutral-900 text-xl">
                  {t("landing.analyticsTitle")}
                </h3>
              </div>
              <p class="text-neutral-600 leading-relaxed">
                {t("landing.analyticsDescription")}
              </p>
            </div>

            <div class="group rounded-2xl bg-neutral-50 p-8 transition-all hover:bg-neutral-100">
              <div class="mb-4 flex items-start space-x-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-orange-500 to-red-500">
                  <svg
                    aria-hidden="true"
                    class="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                  </svg>
                </div>
                <h3 class="grow font-bold text-neutral-900 text-xl">
                  {t("landing.moderationTitle")}
                </h3>
              </div>
              <p class="text-neutral-600 leading-relaxed">
                {t("landing.moderationDescription")}
              </p>
            </div>

            <div class="group rounded-2xl bg-neutral-50 p-8 transition-all hover:bg-neutral-100">
              <div class="mb-4 flex items-start space-x-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-indigo-500 to-primary-light">
                  <svg
                    aria-hidden="true"
                    class="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                  </svg>
                </div>
                <h3 class="grow font-bold text-neutral-900 text-xl">
                  {t("landing.widgetsTitle")}
                </h3>
              </div>
              <p class="text-neutral-600 leading-relaxed">
                {t("landing.widgetsDescription")}
              </p>
            </div>

            <div class="group rounded-2xl bg-neutral-50 p-8 transition-all hover:bg-neutral-100">
              <div class="mb-4 flex items-start space-x-4">
                <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-pink-500 to-rose-500">
                  <svg
                    aria-hidden="true"
                    class="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                    />
                  </svg>
                </div>
                <h3 class="grow font-bold text-neutral-900 text-xl">
                  {t("landing.teamTitle")}
                </h3>
              </div>
              <p class="text-neutral-600 leading-relaxed">
                {t("landing.teamDescription")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="relative overflow-hidden bg-surface py-24" id="about">
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div class="absolute -top-20 right-0 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div class="absolute bottom-0 -left-20 h-64 w-64 rounded-full bg-secondary/5 blur-3xl" />
        </div>
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 class="mb-8 font-bold text-4xl text-neutral-900 md:text-5xl">
                {t("landing.aboutTitle1")}{" "}
                <span class="bg-linear-to-r from-primary-light to-secondary bg-clip-text text-transparent">
                  {t("landing.aboutTitle2")}
                </span>
              </h2>
              <div class="space-y-6 text-lg text-neutral-600">
                <p>{t("landing.aboutParagraph1")}</p>
                <p>{t("landing.aboutParagraph2")}</p>
                <p>{t("landing.aboutParagraph3")}</p>
              </div>

              <div class="mt-12 grid grid-cols-2 gap-8">
                <div class="text-center">
                  <div class="mb-2 font-bold text-3xl text-primary-light">
                    5+
                  </div>
                  <div class="text-neutral-600">
                    {t("landing.platformIntegrations")}
                  </div>
                </div>
                <div class="text-center">
                  <div class="mb-2 font-bold text-3xl text-secondary">
                    99.9%
                  </div>
                  <div class="text-neutral-600">{t("landing.uptime")}</div>
                </div>
              </div>
            </div>

            <div class="relative">
              <div class="rounded-2xl bg-neutral-50 p-8">
                <div class="space-y-6">
                  <div class="flex items-center space-x-4">
                    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-green-500 to-emerald-500">
                      <svg
                        aria-hidden="true"
                        class="h-6 w-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-semibold text-neutral-900">
                        {t("landing.realTimeSync")}
                      </h4>
                      <p class="text-neutral-600">
                        {t("landing.realTimeSyncDescription")}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-4">
                    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-blue-500 to-cyan-500">
                      <svg
                        aria-hidden="true"
                        class="h-6 w-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-semibold text-neutral-900">
                        {t("landing.advancedAnalytics")}
                      </h4>
                      <p class="text-neutral-600">
                        {t("landing.advancedAnalyticsDescription")}
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center space-x-4">
                    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-primary-light to-secondary">
                      <svg
                        aria-hidden="true"
                        class="h-6 w-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 class="font-semibold text-neutral-900">
                        {t("landing.aiPoweredGrowth")}
                      </h4>
                      <p class="text-neutral-600">
                        {t("landing.aiPoweredGrowthDescription")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function LandingCTA() {
  const { t } = useTranslation();

  return (
    <section class="bg-neutral-50 py-24">
      <div class="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 class="mb-6 font-bold text-4xl text-neutral-900 md:text-5xl">
          {t("landing.ctaTitle")}
        </h2>
        <p class="text-neutral-600 text-xl">{t("landing.ctaSubtitle")}</p>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Title>Streampai - Multi-Platform Streaming Solution</Title>
      <div class="min-h-screen bg-surface">
        <PublicHeader navItems={LANDING_NAV_ITEMS} />
        <LandingHero />
        <LandingFeatures />
        <LandingCTA />
        <PublicFooter showTagline />
      </div>
    </>
  );
}
