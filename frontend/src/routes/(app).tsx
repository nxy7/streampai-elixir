import {
	type ParentProps,
	Show,
	Suspense,
	createSignal,
	onCleanup,
} from "solid-js";
import { ImpersonationBanner } from "~/components/ImpersonationBanner";
import { LocaleSync } from "~/components/LocaleSync";
import Alert from "~/design-system/Alert";
import { I18nProvider, useTranslation } from "~/i18n";
import { AuthProvider } from "~/lib/auth";
import { onServiceError } from "~/lib/rpcHooks";
import { ThemeProvider } from "~/lib/theme";

function ServiceAlert() {
	const { t } = useTranslation();
	const [visible, setVisible] = createSignal(false);

	const unsubscribe = onServiceError(() => {
		setVisible(true);
	});
	onCleanup(unsubscribe);

	return (
		<Show when={visible()}>
			<div class="px-4 pt-2">
				<Alert onClose={() => setVisible(false)} variant="warning">
					{t("errors.serviceUnavailable")}
				</Alert>
			</div>
		</Show>
	);
}

export default function AppLayout(props: ParentProps) {
	return (
		<ThemeProvider>
			<I18nProvider>
				<AuthProvider>
					<Suspense>
						<LocaleSync />
						<ImpersonationBanner />
					</Suspense>
					<ServiceAlert />
					{props.children}
				</AuthProvider>
			</I18nProvider>
		</ThemeProvider>
	);
}
