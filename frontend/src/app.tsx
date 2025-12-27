import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { LocaleSync } from "./components/LocaleSync";
import { I18nProvider } from "./i18n";
import { AuthProvider } from "./lib/auth";

export default function App() {
	return (
		<I18nProvider>
			<AuthProvider>
				<LocaleSync />
				<Router
					root={(props) => (
						<MetaProvider>
							<Suspense>{props.children}</Suspense>
						</MetaProvider>
					)}>
					<FileRoutes />
				</Router>
			</AuthProvider>
		</I18nProvider>
	);
}
