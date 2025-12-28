import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { LocaleSync } from "./components/LocaleSync";
import { ThemeSync } from "./components/ThemeSync";
import { I18nProvider } from "./i18n";
import { AuthProvider } from "./lib/auth";
import { ThemeProvider } from "./lib/theme";

export default function App() {
	return (
		<I18nProvider>
			<ThemeProvider>
				<AuthProvider>
					<LocaleSync />
					<ThemeSync />
					<Router
						root={(props) => (
							<MetaProvider>
								<Suspense>{props.children}</Suspense>
							</MetaProvider>
						)}>
						<FileRoutes />
					</Router>
				</AuthProvider>
			</ThemeProvider>
		</I18nProvider>
	);
}
