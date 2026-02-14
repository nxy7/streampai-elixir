import { Show, createSignal } from "solid-js";
import { Alert, Button, Card, Input, Select } from "~/design-system";
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
		<Card padding="lg" variant="ghost">
			<h3 class="mb-6 font-medium text-lg text-neutral-900">
				{t("settings.donationSettings")}
			</h3>
			<form class="space-y-4" onSubmit={handleSaveDonationSettings}>
				<div class="grid gap-4 md:grid-cols-3">
					<div class="relative">
						<span class="pointer-events-none absolute top-8 left-3 z-10 text-neutral-500 text-sm">
							{currency()}
						</span>
						<Input
							class="pl-12"
							helperText={t("settings.leaveEmptyNoMin")}
							label={t("settings.minimumAmount")}
							onInput={(e) => {
								const val = e.currentTarget.value;
								setMinAmount(val ? Number.parseInt(val, 10) : null);
							}}
							placeholder={t("settings.noMinimum")}
							type="number"
							value={minAmount() ?? ""}
						/>
					</div>

					<div class="relative">
						<span class="pointer-events-none absolute top-8 left-3 z-10 text-neutral-500 text-sm">
							{currency()}
						</span>
						<Input
							class="pl-12"
							helperText={t("settings.leaveEmptyNoMax")}
							label={t("settings.maximumAmount")}
							onInput={(e) => {
								const val = e.currentTarget.value;
								setMaxAmount(val ? Number.parseInt(val, 10) : null);
							}}
							placeholder={t("settings.noMaximum")}
							type="number"
							value={maxAmount() ?? ""}
						/>
					</div>

					<Select
						label={t("settings.currency")}
						onChange={setCurrency}
						options={CURRENCIES.map((curr) => ({
							value: curr,
							label: curr,
						}))}
						value={currency()}
					/>
				</div>

				<Select
					helperText={t("settings.voiceHelp")}
					label={t("settings.defaultTtsVoice")}
					onChange={setDefaultVoice}
					options={[
						{ value: "random", label: t("settings.randomVoice") },
						{
							value: "google_en_us_male",
							label: "Google TTS - English (US) Male",
						},
						{
							value: "google_en_us_female",
							label: "Google TTS - English (US) Female",
						},
					]}
					value={defaultVoice()}
				/>

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
