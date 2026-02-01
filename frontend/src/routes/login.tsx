import { Title } from "@solidjs/meta";
import { A, useNavigate } from "@solidjs/router";
import { Show, createSignal } from "solid-js";
import { useTranslation } from "~/i18n";
import { getDashboardUrl, useCurrentUser } from "~/lib/auth";
import { API_PATH, getApiBase } from "~/lib/constants";
import { getCsrfHeaders } from "~/lib/csrf";

function GoogleIcon() {
	return (
		<svg
			aria-hidden="true"
			class="h-5 w-5"
			fill="currentColor"
			viewBox="0 0 24 24">
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
			fill="currentColor"
			viewBox="0 0 24 24">
			<path
				d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"
				fill="#9146FF"
			/>
		</svg>
	);
}

function EmailIcon() {
	return (
		<svg
			aria-hidden="true"
			class="h-5 w-5"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24">
			<path
				d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
			/>
		</svg>
	);
}

export default function LoginPage() {
	const { user, refresh } = useCurrentUser();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [mode, setMode] = createSignal<"signin" | "register">("signin");
	const [email, setEmail] = createSignal("");
	const [password, setPassword] = createSignal("");
	const [passwordConfirmation, setPasswordConfirmation] = createSignal("");
	const [error, setError] = createSignal<string | null>(null);
	const [isSubmitting, setIsSubmitting] = createSignal(false);
	const [successMessage, setSuccessMessage] = createSignal<string | null>(null);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		setError(null);
		setSuccessMessage(null);
		setIsSubmitting(true);

		try {
			const isRegister = mode() === "register";
			const endpoint = `${getApiBase()}${API_PATH}/auth/${isRegister ? "register" : "sign-in"}`;

			const body = {
				email: email(),
				password: password(),
				...(isRegister && { password_confirmation: passwordConfirmation() }),
			};

			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					...getCsrfHeaders(),
				},
				body: JSON.stringify(body),
				credentials: "include",
			});

			const data = await response.json();

			if (response.ok && data.success) {
				if (isRegister) {
					setSuccessMessage(
						data.message ||
							"Account created! Please check your email to confirm your account, then sign in.",
					);
					setMode("signin");
					setPassword("");
					setPasswordConfirmation("");
				} else {
					// Refresh the user context and navigate to dashboard
					await refresh();
					navigate(getDashboardUrl());
				}
			} else {
				setError(
					data.error ||
						(isRegister
							? "Registration failed. Please try again."
							: "Invalid email or password."),
				);
			}
		} catch (err) {
			console.error("Auth error:", err);
			setError("An error occurred. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<Title>{t("auth.pageTitle")}</Title>
			<div class="flex min-h-screen items-center justify-center bg-linear-to-br from-purple-900 via-blue-900 to-indigo-900 px-4">
				<Show
					fallback={
						<div class="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur-lg">
							<h2 class="mb-4 font-bold text-2xl text-white">
								{t("auth.alreadySignedIn")}
							</h2>
							<p class="mb-6 text-neutral-300">{t("auth.alreadyLoggedIn")}</p>
							<A
								class="inline-block w-full rounded-lg bg-linear-to-r from-primary-light to-secondary px-4 py-3 font-semibold text-white transition-all hover:from-primary hover:to-secondary-hover"
								href={getDashboardUrl()}>
								{t("auth.goToDashboard")}
							</A>
						</div>
					}
					when={!user()}>
					<div class="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg">
						<div class="mb-8 text-center">
							<A class="mb-6 inline-flex items-center space-x-2" href="/">
								<img
									alt="Streampai Logo"
									class="h-10 w-10"
									src="/images/logo-white.png"
								/>
								<span class="font-bold text-2xl text-white">Streampai</span>
							</A>
							<h1 class="mb-2 font-bold text-3xl text-white">
								{t("auth.welcomeBack")}
							</h1>
							<p class="text-neutral-300">{t("auth.signInToContinue")}</p>
						</div>

						{/* OAuth Buttons */}
						<div class="space-y-4">
							<a
								class="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 font-semibold text-neutral-800 transition-all hover:bg-neutral-100"
								href={`${getApiBase()}${API_PATH}/auth/user/google`}
								rel="external">
								<GoogleIcon />
								{t("auth.continueWithGoogle")}
							</a>

							<a
								class="flex w-full items-center justify-center gap-3 rounded-lg bg-[#9146FF] px-4 py-3 font-semibold text-white transition-all hover:bg-[#7c3aed]"
								href={`${getApiBase()}${API_PATH}/auth/user/twitch`}
								rel="external">
								<TwitchIcon />
								{t("auth.continueWithTwitch")}
							</a>
						</div>

						<div class="relative my-8">
							<div class="absolute inset-0 flex items-center">
								<div class="w-full border-white/20 border-t" />
							</div>
							<div class="relative flex justify-center text-sm">
								<span class="bg-transparent px-4 text-neutral-400">
									{t("auth.orContinueWithEmail")}
								</span>
							</div>
						</div>

						{/* Success Message */}
						<Show when={successMessage()}>
							<div class="mb-4 rounded-lg bg-green-500/20 p-3 text-center text-green-300 text-sm">
								{successMessage()}
							</div>
						</Show>

						{/* Error Message */}
						<Show when={error()}>
							<div class="mb-4 rounded-lg bg-red-500/20 p-3 text-center text-red-300 text-sm">
								{error()}
							</div>
						</Show>

						{/* Email/Password Form */}
						<form class="space-y-4" onSubmit={handleSubmit}>
							<div>
								<label
									class="mb-1 block font-medium text-neutral-300 text-sm"
									for="email">
									{t("auth.emailLabel")}
								</label>
								<input
									class="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-neutral-500 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light"
									id="email"
									name="email"
									onInput={(e) => setEmail(e.currentTarget.value)}
									placeholder={t("auth.emailPlaceholder")}
									required
									type="email"
									value={email()}
								/>
							</div>

							<div>
								<label
									class="mb-1 block font-medium text-neutral-300 text-sm"
									for="password">
									{t("auth.passwordLabel")}
								</label>
								<input
									class="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-neutral-500 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light"
									id="password"
									minLength={8}
									name="password"
									onInput={(e) => setPassword(e.currentTarget.value)}
									placeholder={t("auth.passwordPlaceholder")}
									required
									type="password"
									value={password()}
								/>
							</div>

							<Show when={mode() === "register"}>
								<div>
									<label
										class="mb-1 block font-medium text-neutral-300 text-sm"
										for="password_confirmation">
										{t("auth.confirmPasswordLabel")}
									</label>
									<input
										class="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-neutral-500 focus:border-primary-light focus:outline-none focus:ring-1 focus:ring-primary-light"
										id="password_confirmation"
										minLength={8}
										name="password_confirmation"
										onInput={(e) =>
											setPasswordConfirmation(e.currentTarget.value)
										}
										placeholder={t("auth.confirmPasswordPlaceholder")}
										required
										type="password"
										value={passwordConfirmation()}
									/>
								</div>
							</Show>

							<button
								class="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary-light to-secondary px-4 py-3 font-semibold text-white transition-all hover:from-primary hover:to-secondary-hover disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isSubmitting()}
								type="submit">
								<EmailIcon />
								{isSubmitting()
									? t("common.pleaseWait")
									: mode() === "signin"
										? t("auth.signInWithEmail")
										: t("auth.signUpWithEmail")}
							</button>
						</form>

						<p class="mt-8 text-center text-neutral-400 text-sm">
							{t("auth.noAccount")}{" "}
							<a
								class="text-primary-light hover:text-primary-200"
								href={`${getApiBase()}${API_PATH}/auth/register`}
								rel="external">
								{t("auth.createOne")}
							</a>
						</p>

						<p class="mt-4 text-center text-neutral-500 text-xs">
							{t("auth.agreeToTerms")}{" "}
							<A class="text-neutral-400 hover:text-white" href="/terms">
								{t("auth.termsOfService")}
							</A>{" "}
							{t("auth.and")}{" "}
							<A class="text-neutral-400 hover:text-white" href="/privacy">
								{t("auth.privacyPolicy")}
							</A>
						</p>
					</div>
				</Show>
			</div>
		</>
	);
}
