import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { MetaProvider } from "@solidjs/meta";
import "./app.css";
import { AuthProvider } from "./lib/auth";

export default function App() {
  return (
    <AuthProvider>
      <Router
        root={(props) => (
          <MetaProvider>
            <Suspense>{props.children}</Suspense>
          </MetaProvider>
        )}
      >
        <FileRoutes />
      </Router>
    </AuthProvider>
  );
}
