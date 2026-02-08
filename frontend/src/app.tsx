import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { type ParentProps, Suspense } from "solid-js";
import "./app.css";
import { ImpersonationBanner } from "~/components/ImpersonationBanner";
import { LocaleSync } from "~/components/LocaleSync";
import { I18nProvider } from "~/i18n";
import { AuthProvider } from "~/lib/auth";
import { ThemeProvider } from "~/lib/theme";

function RootLayout(props: ParentProps) {
	return (
		<MetaProvider>
			<Title>Streampai</Title>
			<ThemeProvider>
				<I18nProvider>
					<AuthProvider>
						<Suspense>
							<LocaleSync />
							<ImpersonationBanner />
						</Suspense>
						{props.children}
					</AuthProvider>
				</I18nProvider>
			</ThemeProvider>
		</MetaProvider>
	);
}

export default function App() {
	return (
		<Router root={RootLayout}>
			<FileRoutes />
		</Router>
	);
}
