import { useLocation, A } from "@solidjs/router";
import { Show } from "solid-js";
import { useCurrentUser, getLoginUrl, getLogoutUrl, getDashboardUrl } from "~/lib/auth";

export default function Nav() {
  const location = useLocation();
  const { user, isLoading } = useCurrentUser();

  const active = (path: string) =>
    path == location.pathname ? "border-sky-600" : "border-transparent hover:border-sky-600";

  return (
    <nav class="bg-sky-800">
      <div class="container flex items-center justify-between p-3 text-gray-200">
        <ul class="flex items-center">
          <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
            <A href="/">Home</A>
          </li>
          <li class={`border-b-2 ${active("/about")} mx-1.5 sm:mx-6`}>
            <A href="/about">About</A>
          </li>
        </ul>

        <div class="flex items-center gap-3">
          <Show when={!isLoading()}>
            <Show
              when={user()}
              fallback={
                <div class="flex gap-2">
                  <a
                    href={getLoginUrl()}
                    class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
                  >
                    Sign In
                  </a>
                  <a
                    href={getLoginUrl("google")}
                    class="px-4 py-2 bg-white hover:bg-gray-100 rounded text-gray-900 transition-colors flex items-center gap-2"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </a>
                  <a
                    href={getLoginUrl("twitch")}
                    class="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded text-white transition-colors flex items-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                    </svg>
                    Twitch
                  </a>
                </div>
              }
            >
              {(currentUser) => (
                <div class="flex items-center gap-3">
                  <span class="text-sm">
                    Welcome, <strong>{currentUser().name || currentUser().email}</strong>!
                  </span>
                  <A
                    href={getDashboardUrl()}
                    class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
                  >
                    Dashboard
                  </A>
                  <a
                    href={getLogoutUrl()}
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white transition-colors"
                  >
                    Sign Out
                  </a>
                </div>
              )}
            </Show>
          </Show>
        </div>
      </div>
    </nav>
  );
}
