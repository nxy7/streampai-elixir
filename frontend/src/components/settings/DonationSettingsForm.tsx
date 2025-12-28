import { For, Show, createEffect, createSignal } from "solid-js";
import { useTranslation } from "~/i18n";
import { saveDonationSettings } from "~/sdk/ash_rpc";

interface DonationSettingsFormProps {
	userId: string;
	initialMinAmount: number | null | undefined;
	initialMaxAmount: number | null | undefined;
	initialCurrency: string | null | undefined;
	initialDefaultVoice: string | null | undefined;
}

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

export default function DonationSettingsForm(props: DonationSettingsFormProps) {
	const { t } = useTranslation();
	const [minAmount, setMinAmount] = createSignal<number | null>(null);
	const [maxAmount, setMaxAmount] = createSignal<number | null>(null);
	const [currency, setCurrency] = createSignal("USD");
	const [defaultVoice, setDefaultVoice] = createSignal("random");
	const [isSavingSettings, setIsSavingSettings] = createSignal(false);
	const [saveError, setSaveError] = createSignal<string | null>(null);
	const [saveSuccess, setSaveSuccess] = createSignal(false);
	const [formInitialized, setFormInitialized] = createSignal(false);

	createEffect(() => {
		if (!formInitialized()) {
			setMinAmount(props.initialMinAmount ?? null);
			setMaxAmount(props.initialMaxAmount ?? null);
			setCurrency(props.initialCurrency || "USD");
			setDefaultVoice(props.initialDefaultVoice || "random");
			setFormInitialized(true);
		}
	});

	const handleSaveDonationSettings = async (e: Event) => {
		e.preventDefault();

		setIsSavingSettings(true);
		setSaveError(null);
		setSaveSuccess(false);

		try {
			const result = await saveDonationSettings({
				identity: props.userId,
				input: {
					minAmount: minAmount() ?? undefined,
					maxAmount: maxAmount() ?? undefined,
					currency: currency(),
					defaultVoice: defaultVoice(),
				},
				fetchOptions: { credentials: "include" },
			});

			if (!result.success) {
				throw new Error(result.errors[0]?.message || "Failed to save settings");
			}

			setSaveSuccess(true);
			setTimeout(() => setSaveSuccess(false), 3000);
		} catch (error) {
			console.error("Save donation settings error:", error);
			setSaveError(
				error instanceof Error ? error.message : "Failed to save settings",
			);
		} finally {
			setIsSavingSettings(false);
		}
	};

	return (
		<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h3 class="mb-6 font-medium text-gray-900 text-lg">
				{t("settings.donationSettings")}
			</h3>
			<form class="space-y-4" onSubmit={handleSaveDonationSettings}>
				<div class="grid gap-4 md:grid-cols-3">
					<div>
						<label class="block font-medium text-gray-700 text-sm">
							{t("settings.minimumAmount")}
							<div class="relative mt-2">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<span class="text-gray-500 text-sm">{currency()}</span>
								</div>
								<input
									class="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-12 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
									onInput={(e) => {
										const val = e.currentTarget.value;
										setMinAmount(val ? Number.parseInt(val, 10) : null);
									}}
									placeholder={t("settings.noMinimum")}
									type="number"
									value={minAmount() ?? ""}
								/>
							</div>
						</label>
						<p class="mt-1 text-gray-500 text-xs">
							{t("settings.leaveEmptyNoMin")}
						</p>
					</div>

					<div>
						<label class="block font-medium text-gray-700 text-sm">
							{t("settings.maximumAmount")}
							<div class="relative mt-2">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<span class="text-gray-500 text-sm">{currency()}</span>
								</div>
								<input
									class="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-12 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
									onInput={(e) => {
										const val = e.currentTarget.value;
										setMaxAmount(val ? Number.parseInt(val, 10) : null);
									}}
									placeholder={t("settings.noMaximum")}
									type="number"
									value={maxAmount() ?? ""}
								/>
							</div>
						</label>
						<p class="mt-1 text-gray-500 text-xs">
							{t("settings.leaveEmptyNoMax")}
						</p>
					</div>

					<div>
						<label class="block font-medium text-gray-700 text-sm">
							{t("settings.currency")}
							<select
								class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
								onChange={(e) => setCurrency(e.currentTarget.value)}
								value={currency()}>
								<For each={CURRENCIES}>
									{(curr) => <option value={curr}>{curr}</option>}
								</For>
							</select>
						</label>
					</div>
				</div>

				<div>
					<label class="block font-medium text-gray-700 text-sm">
						{t("settings.defaultTtsVoice")}
						<select
							class="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-purple-500"
							onChange={(e) => setDefaultVoice(e.currentTarget.value)}
							value={defaultVoice()}>
							<option value="random">{t("settings.randomVoice")}</option>
							<option value="google_en_us_male">
								Google TTS - English (US) Male
							</option>
							<option value="google_en_us_female">
								Google TTS - English (US) Female
							</option>
						</select>
					</label>
					<p class="mt-1 text-gray-500 text-xs">{t("settings.voiceHelp")}</p>
				</div>

				<div class="flex items-start space-x-3 rounded-lg bg-blue-50 p-3">
					<svg
						aria-hidden="true"
						class="mt-0.5 h-5 w-5 shrink-0 text-blue-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						/>
					</svg>
					<div class="text-blue-800 text-sm">
						<p class="mb-1 font-medium">{t("settings.donationLimitsInfo")}</p>
						<ul class="space-y-1 text-blue-700">
							<li>• {t("settings.donationLimitsItem1")}</li>
							<li>• {t("settings.donationLimitsItem2")}</li>
							<li>• {t("settings.donationLimitsItem3")}</li>
							<li>• {t("settings.donationLimitsItem4")}</li>
						</ul>
					</div>
				</div>

				<div class="flex items-center gap-4 pt-4">
					<button
						class={`rounded-lg bg-purple-600 px-4 py-2 font-medium text-sm text-white transition-colors ${
							isSavingSettings()
								? "cursor-not-allowed opacity-50"
								: "hover:bg-purple-700"
						}`}
						disabled={isSavingSettings()}
						type="submit">
						{isSavingSettings()
							? t("settings.saving")
							: t("settings.saveDonationSettings")}
					</button>
					<Show when={saveSuccess()}>
						<span class="text-green-600 text-sm">
							{t("settings.settingsSaved")}
						</span>
					</Show>
					<Show when={saveError()}>
						<span class="text-red-600 text-sm">{saveError()}</span>
					</Show>
				</div>
			</form>
		</div>
	);
}
