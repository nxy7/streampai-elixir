import { MetaProvider } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { ImpersonationBanner } from "./components/ImpersonationBanner";
import { LocaleSync } from "./components/LocaleSync";
import { I18nProvider } from "./i18n";
import { AuthProvider } from "./lib/auth";
import { ImpersonationProvider } from "./lib/impersonation";
import { ThemeProvider } from "./lib/theme";

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <ImpersonationProvider>
            <LocaleSync />
            <ImpersonationBanner />
            <Router
              root={(props) => (
                <MetaProvider>
                  <Suspense>{props.children}</Suspense>
                </MetaProvider>
              )}
            >
              <FileRoutes />
            </Router>
          </ImpersonationProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
