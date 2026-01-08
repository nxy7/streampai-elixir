import { For, Show, createSignal } from "solid-js";
import { Alert, Button, Card } from "~/design-system";
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
	const [minAmount, setMinAmount] = createSignal<number | null>(
		props.initialMinAmount ?? null,
	);
	const [maxAmount, setMaxAmount] = createSignal<number | null>(
		props.initialMaxAmount ?? null,
	);
	const [currency, setCurrency] = createSignal(props.initialCurrency || "USD");
	const [defaultVoice, setDefaultVoice] = createSignal(
		props.initialDefaultVoice || "random",
	);
	const [isSavingSettings, setIsSavingSettings] = createSignal(false);
	const [saveError, setSaveError] = createSignal<string | null>(null);
	const [saveSuccess, setSaveSuccess] = createSignal(false);

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
		<Card padding="lg">
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

				<Alert title={t("settings.donationLimitsInfo")} variant="info">
					<ul class="space-y-1">
						<li>• {t("settings.donationLimitsItem1")}</li>
						<li>• {t("settings.donationLimitsItem2")}</li>
						<li>• {t("settings.donationLimitsItem3")}</li>
						<li>• {t("settings.donationLimitsItem4")}</li>
					</ul>
				</Alert>

				<div class="flex items-center gap-4 pt-4">
					<Button disabled={isSavingSettings()} type="submit" variant="primary">
						{isSavingSettings()
							? t("settings.saving")
							: t("settings.saveDonationSettings")}
					</Button>
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
		</Card>
	);
}
