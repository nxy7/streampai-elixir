import { Title } from "@solidjs/meta";
import { createSignal } from "solid-js";
import PublicFooter from "~/components/PublicFooter";
import PublicHeader from "~/components/PublicHeader";
import { useTranslation } from "~/i18n";

export const route = {
  prerender: true,
};

export default function Contact() {
  const { t } = useTranslation();
  const [name, setName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [subject, setSubject] = createSignal("");
  const [message, setMessage] = createSignal("");
  const [status, setStatus] = createSignal<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = createSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setStatus("loading");

    // TODO: Implement contact form submission via RPC
    setTimeout(() => {
      setStatus("success");
      setStatusMessage(t("contact.successMessage"));
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setTimeout(() => setStatus("idle"), 5000);
    }, 1000);
  };

  return (
    <>
      <Title>{t("contact.title")} - Streampai</Title>
      <div class="flex min-h-screen flex-col bg-surface">
        <PublicHeader />

        <main class="flex-1 py-12">
          <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div class="mb-8 text-center">
              <h2 class="mb-4 font-bold text-3xl text-neutral-900">
                {t("contact.heading")}
              </h2>
              <p class="text-lg text-neutral-600">{t("contact.subheading")}</p>
            </div>

            <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div class="space-y-6 lg:col-span-1">
                <div class="rounded-2xl bg-neutral-50 p-6">
                  <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-primary-light to-secondary">
                    <svg
                      aria-hidden="true"
                      class="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                      />
                    </svg>
                  </div>
                  <h3 class="mb-2 font-semibold text-lg text-neutral-900">
                    {t("contact.emailTitle")}
                  </h3>
                  <p class="text-neutral-600">support@streampai.com</p>
                </div>

                <div class="rounded-2xl bg-neutral-50 p-6">
                  <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-blue-500 to-cyan-500">
                    <svg
                      aria-hidden="true"
                      class="h-6 w-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                      />
                    </svg>
                  </div>
                  <h3 class="mb-2 font-semibold text-lg text-neutral-900">
                    {t("contact.discordTitle")}
                  </h3>
                  <p class="text-neutral-600">
                    {t("contact.discordDescription")}
                  </p>
                  <span class="text-primary-light text-sm">
                    {t("contact.comingSoon")}
                  </span>
                </div>

                <div class="rounded-2xl bg-neutral-50 p-6">
                  <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-green-500 to-emerald-500">
                    <svg
                      aria-hidden="true"
                      class="h-6 w-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </div>
                  <h3 class="mb-2 font-semibold text-lg text-neutral-900">
                    {t("contact.githubTitle")}
                  </h3>
                  <p class="text-neutral-600">
                    {t("contact.githubDescription")}
                  </p>
                  <span class="text-primary-light text-sm">
                    {t("contact.comingSoon")}
                  </span>
                </div>
              </div>

              <div class="lg:col-span-2">
                <div class="rounded-2xl bg-neutral-50 p-8">
                  <h3 class="mb-6 font-semibold text-neutral-900 text-xl">
                    {t("contact.formTitle")}
                  </h3>

                  <form class="space-y-6" onSubmit={handleSubmit}>
                    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div>
                        <label
                          class="mb-2 block font-medium text-neutral-900 text-sm"
                          for="name"
                        >
                          {t("contact.nameLabel")}
                        </label>
                        <input
                          class="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-3 text-neutral-900 placeholder-neutral-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-light"
                          id="name"
                          onInput={(e) => setName(e.currentTarget.value)}
                          placeholder={t("contact.namePlaceholder")}
                          required
                          type="text"
                          value={name()}
                        />
                      </div>
                      <div>
                        <label
                          class="mb-2 block font-medium text-neutral-900 text-sm"
                          for="email"
                        >
                          {t("contact.emailLabel")}
                        </label>
                        <input
                          class="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-3 text-neutral-900 placeholder-neutral-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-light"
                          id="email"
                          onInput={(e) => setEmail(e.currentTarget.value)}
                          placeholder={t("contact.emailPlaceholder")}
                          required
                          type="email"
                          value={email()}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        class="mb-2 block font-medium text-neutral-900 text-sm"
                        for="subject"
                      >
                        {t("contact.subjectLabel")}
                      </label>
                      <select
                        class="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-3 text-neutral-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-light"
                        id="subject"
                        onChange={(e) => setSubject(e.currentTarget.value)}
                        required
                        value={subject()}
                      >
                        <option class="bg-neutral-800" value="">
                          {t("contact.subjectPlaceholder")}
                        </option>
                        <option class="bg-neutral-800" value="general">
                          {t("contact.subjectGeneral")}
                        </option>
                        <option class="bg-neutral-800" value="support">
                          {t("contact.subjectSupport")}
                        </option>
                        <option class="bg-neutral-800" value="billing">
                          {t("contact.subjectBilling")}
                        </option>
                        <option class="bg-neutral-800" value="feature">
                          {t("contact.subjectFeature")}
                        </option>
                        <option class="bg-neutral-800" value="bug">
                          {t("contact.subjectBug")}
                        </option>
                        <option class="bg-neutral-800" value="partnership">
                          {t("contact.subjectPartnership")}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        class="mb-2 block font-medium text-neutral-900 text-sm"
                        for="message"
                      >
                        {t("contact.messageLabel")}
                      </label>
                      <textarea
                        class="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-3 text-neutral-900 placeholder-neutral-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-light"
                        id="message"
                        onInput={(e) => setMessage(e.currentTarget.value)}
                        placeholder={t("contact.messagePlaceholder")}
                        required
                        rows={6}
                        value={message()}
                      />
                    </div>

                    <button
                      class="w-full rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-3 font-semibold text-white transition-all hover:from-primary hover:to-secondary-hover disabled:opacity-50"
                      disabled={status() === "loading"}
                      type="submit"
                    >
                      {status() === "loading"
                        ? t("contact.sending")
                        : t("contact.sendButton")}
                    </button>

                    {status() === "success" && (
                      <div class="rounded-lg bg-green-500/20 p-4 text-center text-green-400">
                        {statusMessage()}
                      </div>
                    )}

                    {status() === "error" && (
                      <div class="rounded-lg bg-red-500/20 p-4 text-center text-red-400">
                        {statusMessage()}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>

        <PublicFooter />
      </div>
    </>
  );
}
