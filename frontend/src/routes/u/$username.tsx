import { useLiveQuery } from "@tanstack/solid-db";
import { Link, createFileRoute } from "@tanstack/solid-router";
import { For, Show, createEffect, createMemo, createSignal } from "solid-js";
import LoadingIndicator from "~/components/LoadingIndicator";
import Input, { Textarea } from "~/design-system/Input";
import { useTranslation } from "~/i18n";
import { createUserPreferencesCollection } from "~/lib/electric";
import { useTheme } from "~/lib/theme";
import { createLocalStorageStore } from "~/lib/useLocalStorage";
import { getPublicProfile } from "~/sdk/ash_rpc";

type StreamerPrefs = {
	selectedAmount: number | null;
	customAmount: string;
	message: string;
};

function ThemeToggle() {
	const { t } = useTranslation();
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			aria-label={t("header.toggleTheme")}
			class="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
			onClick={(e) => toggleTheme(e)}
			type="button">
			<Show
				fallback={
					<svg
						aria-hidden="true"
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						viewBox="0 0 24 24">
						<path
							d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				}
				when={theme() === "dark"}>
				<svg
					aria-hidden="true"
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					viewBox="0 0 24 24">
					<circle cx="12" cy="12" r="5" />
					<path
						d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</Show>
		</button>
	);
}

export const Route = createFileRoute("/u/$username")({
	component: DonationPage,
	head: () => ({ meta: [{ title: "Donation Page - Streampai" }] }),
});

function DonationPage() {
	const { t } = useTranslation();
	const params = Route.useParams();
	const [userId, setUserId] = createSignal<string | null>(null);
	const [error, setError] = createSignal<string | null>(null);
	const [fetchDone, setFetchDone] = createSignal(false);

	const [preferencesCollection, setPreferencesCollection] =
		createSignal<ReturnType<typeof createUserPreferencesCollection> | null>(
			null,
		);

	// Global donor info (same across all streamers)
	const [donorInfo, setDonorInfo] = createLocalStorageStore("donor_info", {
		name: "",
		email: "",
	});

	// Per-streamer preferences (amount, message)
	const [streamerPrefs, setStreamerPrefs] = createLocalStorageStore<
		Record<string, StreamerPrefs>
	>("donation_streamer_prefs", {});

	createEffect(async () => {
		const username = params().username;
		if (!username) {
			setError(t("errors.invalidUsername"));
			setFetchDone(true);
			return;
		}

		try {
			const result = await getPublicProfile({
				input: { username },
				fields: ["id", "name", "displayAvatar"],
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				setError(t("errors.userNotFound"));
				setFetchDone(true);
				return;
			}

			const user = result.data;
			setUserId(user.id);
			setPreferencesCollection(createUserPreferencesCollection(user.id));
			setFetchDone(true);
		} catch (e) {
			console.error("Error fetching user:", e);
			setError(t("errors.failedToLoadUser"));
			setFetchDone(true);
		}
	});

	const prefsQuery = () => {
		const collection = preferencesCollection();
		if (!collection) return null;
		return useLiveQuery(() => collection);
	};

	const prefs = () => {
		const query = prefsQuery();
		if (!query) return null;
		const data = query.data;
		return data?.[0] ?? null;
	};

	const isReady = () => {
		if (!fetchDone()) return false;
		if (error()) return true;
		const query = prefsQuery();
		if (!query) return false;
		return !query.isLoading || prefs() !== null;
	};

	const userName = () => prefs()?.name ?? null;
	const userAvatar = () => prefs()?.avatar_url ?? null;

	const currentStreamerPrefs = createMemo(() => {
		const id = userId();
		if (!id) return { selectedAmount: null, customAmount: "", message: "" };
		return (
			streamerPrefs[id] ?? {
				selectedAmount: null,
				customAmount: "",
				message: "",
			}
		);
	});

	const updateStreamerPrefs = (updates: Partial<StreamerPrefs>) => {
		const id = userId();
		if (!id) return;
		const current = streamerPrefs[id] ?? {
			selectedAmount: null,
			customAmount: "",
			message: "",
		};
		setStreamerPrefs(id, { ...current, ...updates });
	};

	const presetAmounts = () => {
		const userPrefs = prefs();
		const min = userPrefs?.min_donation_amount ?? 1;
		const max = userPrefs?.max_donation_amount ?? 1000;

		const amounts = [5, 10, 25, 50, 100, 250];
		return amounts.filter((a) => a >= min && a <= max);
	};

	const currency = () => prefs()?.donation_currency ?? "USD";

	const getCurrencySymbol = (curr: string) => {
		const symbols: Record<string, string> = {
			USD: "$",
			EUR: "€",
			GBP: "£",
			CAD: "C$",
			AUD: "A$",
		};
		return symbols[curr] ?? curr;
	};

	const finalAmount = () => {
		const streamerPref = currentStreamerPrefs();
		if (
			streamerPref.selectedAmount !== null &&
			streamerPref.selectedAmount > 0
		) {
			return streamerPref.selectedAmount;
		}
		const custom = parseFloat(streamerPref.customAmount);
		return Number.isNaN(custom) || custom <= 0 ? null : custom;
	};

	const isValidAmount = () => {
		const amount = finalAmount();
		if (amount === null || amount <= 0) return false;

		const userPrefs = prefs();
		const min = userPrefs?.min_donation_amount ?? 1;
		const max = userPrefs?.max_donation_amount;

		if (amount < min) return false;
		if (max !== null && max !== undefined && amount > max) return false;
		return true;
	};

	const handleDonate = () => {
		if (!isValidAmount()) return;
		alert(
			`Donation of ${getCurrencySymbol(currency())}${finalAmount()} will be processed. Payment integration coming soon!`,
		);
	};

	return (
		<Show fallback={<LoadingIndicator />} when={isReady()}>
			<div class="min-h-screen bg-surface">
				<Show
					fallback={
						<div class="flex min-h-screen items-center justify-center">
							<div class="text-center">
								<div class="mb-4 text-6xl">😕</div>
								<h1 class="mb-2 font-bold text-2xl text-neutral-900">
									User Not Found
								</h1>
								<p class="text-neutral-500">
									The user "{params().username}" doesn't exist or has been
									removed.
								</p>
								<Link
									class="mt-6 inline-block rounded-lg bg-linear-to-r from-primary-light to-secondary px-6 py-3 font-semibold text-white transition-all hover:from-primary hover:to-secondary-hover"
									to="/">
									Go Home
								</Link>
							</div>
						</div>
					}
					when={!error()}>
					{/* Top bar */}
					<div class="flex items-center justify-between px-4 py-3">
						<Link
							class="font-semibold text-neutral-500 text-sm transition-colors hover:text-neutral-700"
							to="/">
							Streampai
						</Link>
						<ThemeToggle />
					</div>

					<div class="mx-auto max-w-lg px-4 pt-4 pb-12">
						{/* User Header */}
						<div class="mb-8 text-center">
							<div class="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-primary-light to-secondary shadow-lg ring-4 ring-surface">
								<Show
									fallback={
										<span class="font-bold text-2xl text-white">
											{userName()?.[0]?.toUpperCase() || "?"}
										</span>
									}
									when={userAvatar()}>
									<img
										alt={userName() ?? "User"}
										class="h-full w-full object-cover"
										src={userAvatar() ?? ""}
									/>
								</Show>
							</div>
							<h1 class="mb-1 font-bold text-2xl text-neutral-900">
								Support {userName()}
							</h1>
							<p class="text-neutral-500 text-sm">
								Send a donation to show your appreciation!
							</p>
						</div>

						{/* Donation Card */}
						<div class="rounded-2xl bg-surface-secondary p-6 shadow-sm">
							{/* Amount Selection */}
							<div class="mb-6">
								<p class="mb-3 font-medium text-neutral-700 text-sm">
									Select Amount ({currency()})
								</p>
								<div class="mb-3 grid grid-cols-3 gap-2">
									<For each={presetAmounts()}>
										{(amount) => (
											<button
												class={`rounded-lg px-4 py-2.5 font-semibold text-sm transition-all ${
													currentStreamerPrefs().selectedAmount === amount
														? "bg-primary text-white shadow-md"
														: "bg-surface text-neutral-700 hover:bg-neutral-100"
												}`}
												onClick={() => {
													updateStreamerPrefs({
														selectedAmount: amount,
														customAmount: "",
													});
												}}
												type="button">
												{getCurrencySymbol(currency())}
												{amount}
											</button>
										)}
									</For>
								</div>

								{/* Custom Amount */}
								<div class="relative">
									<span class="absolute top-1/2 left-3 z-10 -translate-y-1/2 text-neutral-400 text-sm">
										{getCurrencySymbol(currency())}
									</span>
									<Input
										class="bg-surface-inset pl-8"
										inputMode="decimal"
										onBeforeInput={(e) => {
											const data = e.data;
											if (data && !/^[\d.]$/.test(data)) {
												e.preventDefault();
											}
											if (
												data === "." &&
												currentStreamerPrefs().customAmount.includes(".")
											) {
												e.preventDefault();
											}
										}}
										onInput={(e) => {
											const value = e.currentTarget.value;
											const filtered = value
												.replace(/[^\d.]/g, "")
												.replace(/(\..*)\./g, "$1");
											if (filtered !== value) {
												e.currentTarget.value = filtered;
											}
											updateStreamerPrefs({
												customAmount: filtered,
												selectedAmount: null,
											});
										}}
										placeholder={t("donation.customAmountPlaceholder")}
										type="text"
										value={currentStreamerPrefs().customAmount}
									/>
								</div>

								<Show
									when={
										prefs()?.min_donation_amount || prefs()?.max_donation_amount
									}>
									<p class="mt-2 text-neutral-400 text-xs">
										<Show when={prefs()?.min_donation_amount}>
											Min: {getCurrencySymbol(currency())}
											{prefs()?.min_donation_amount}
										</Show>
										<Show
											when={
												prefs()?.min_donation_amount &&
												prefs()?.max_donation_amount
											}>
											{" · "}
										</Show>
										<Show when={prefs()?.max_donation_amount}>
											Max: {getCurrencySymbol(currency())}
											{prefs()?.max_donation_amount}
										</Show>
									</p>
								</Show>

								<Show when={finalAmount() !== null && !isValidAmount()}>
									<p class="mt-2 text-red-500 text-xs">
										Amount must be between {getCurrencySymbol(currency())}
										{prefs()?.min_donation_amount ?? 1}
										{prefs()?.max_donation_amount
											? ` and ${getCurrencySymbol(currency())}${prefs()?.max_donation_amount}`
											: ""}
									</p>
								</Show>
							</div>

							{/* Donor Name */}
							<Input
								class="mb-4 bg-surface-inset"
								label={t("donation.yourName")}
								onInput={(e) => setDonorInfo("name", e.currentTarget.value)}
								placeholder={t("donation.anonymousPlaceholder")}
								type="text"
								value={donorInfo.name}
							/>

							{/* Donor Email */}
							<Input
								class="mb-4 bg-surface-inset"
								label={t("donation.yourEmail")}
								onInput={(e) => setDonorInfo("email", e.currentTarget.value)}
								placeholder={t("donation.emailPlaceholder")}
								type="email"
								value={donorInfo.email}
							/>

							{/* Message */}
							<Textarea
								class="mb-6 bg-surface-inset"
								label={t("donation.message")}
								onInput={(e) =>
									updateStreamerPrefs({
										message: e.currentTarget.value,
									})
								}
								placeholder={t("donation.messagePlaceholder")}
								rows={3}
								value={currentStreamerPrefs().message}
							/>

							{/* Donate Button */}
							<button
								class={`w-full rounded-lg py-3 font-semibold transition-all ${
									isValidAmount()
										? "bg-linear-to-r from-primary-light to-secondary text-white shadow-md hover:from-primary hover:to-secondary-hover hover:shadow-lg"
										: "cursor-not-allowed bg-neutral-200 text-neutral-400"
								}`}
								disabled={!isValidAmount()}
								onClick={handleDonate}
								type="button">
								<Show fallback="Select an amount" when={finalAmount()}>
									Donate {getCurrencySymbol(currency())}
									{finalAmount()}
								</Show>
							</button>
						</div>

						<p class="mt-6 text-center text-neutral-400 text-xs">
							Powered by Streampai
						</p>
					</div>
				</Show>
			</div>
		</Show>
	);
}
