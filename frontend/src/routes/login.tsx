import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { Show } from "solid-js";
import { getDashboardUrl, useCurrentUser } from "~/lib/auth";
import { API_PATH } from "~/lib/constants";

function GoogleIcon() {
	return (
		<svg
			aria-hidden="true"
			class="h-5 w-5"
			viewBox="0 0 24 24"
			fill="currentColor">
			<path
				d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				fill="#4285F4"
			/>
			<path
				d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				fill="#34A853"
			/>
			<path
				d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
				fill="#FBBC05"
			/>
			<path
				d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				fill="#EA4335"
			/>
		</svg>
	);
}

function TwitchIcon() {
	return (
		<svg
			aria-hidden="true"
			class="h-5 w-5"
			viewBox="0 0 24 24"
			fill="currentColor">
			<path
				d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"
				fill="#9146FF"
			/>
		</svg>
	);
}

export default function LoginPage() {
	const { user } = useCurrentUser();

	return (
		<>
			<Title>Sign In - Streampai</Title>
			<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 px-4">
				<Show
					when={!user()}
					fallback={
						<div class="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur-lg">
							<h2 class="mb-4 font-bold text-2xl text-white">
								Already signed in!
							</h2>
							<p class="mb-6 text-gray-300">You're already logged in.</p>
							<A
								href={getDashboardUrl()}
								class="inline-block w-full rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-4 py-3 font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600">
								Go to Dashboard
							</A>
						</div>
					}>
					<div class="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg">
						<div class="mb-8 text-center">
							<A href="/" class="mb-6 inline-flex items-center space-x-2">
								<img
									src="/images/logo-white.png"
									alt="Streampai Logo"
									class="h-10 w-10"
								/>
								<span class="font-bold text-2xl text-white">Streampai</span>
							</A>
							<h1 class="mb-2 font-bold text-3xl text-white">Welcome back</h1>
							<p class="text-gray-300">Sign in to your account to continue</p>
						</div>

						<div class="space-y-4">
							<a
								href={`${API_PATH}/auth/user/google`}
								rel="external"
								class="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 font-semibold text-gray-800 transition-all hover:bg-gray-100">
								<GoogleIcon />
								Continue with Google
							</a>

							<a
								href={`${API_PATH}/auth/user/twitch`}
								rel="external"
								class="flex w-full items-center justify-center gap-3 rounded-lg bg-[#9146FF] px-4 py-3 font-semibold text-white transition-all hover:bg-[#7c3aed]">
								<TwitchIcon />
								Continue with Twitch
							</a>
						</div>

						<div class="relative my-8">
							<div class="absolute inset-0 flex items-center">
								<div class="w-full border-white/20 border-t"></div>
							</div>
							<div class="relative flex justify-center text-sm">
								<span class="bg-transparent px-4 text-gray-400">
									Or continue with email
								</span>
							</div>
						</div>

						<a
							href={`${API_PATH}/auth/sign-in`}
							rel="external"
							class="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-3 font-semibold text-white transition-all hover:bg-white/10">
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
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
							Sign in with Email
						</a>

						<p class="mt-8 text-center text-gray-400 text-sm">
							Don't have an account?{" "}
							<a
								href={`${API_PATH}/auth/register`}
								rel="external"
								class="text-purple-400 hover:text-purple-300">
								Create one
							</a>
						</p>

						<p class="mt-4 text-center text-gray-500 text-xs">
							By signing in, you agree to our{" "}
							<A href="/terms" class="text-gray-400 hover:text-white">
								Terms of Service
							</A>{" "}
							and{" "}
							<A href="/privacy" class="text-gray-400 hover:text-white">
								Privacy Policy
							</A>
						</p>
					</div>
				</Show>
			</div>
		</>
	);
}
