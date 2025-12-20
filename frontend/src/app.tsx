import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Match, Suspense, Switch } from "solid-js";
import { MetaProvider } from "@solidjs/meta";
import { Provider as UrqlProvider } from "@urql/solid";
import { client } from "./lib/urql";
import "./app.css";
import { useCurrentUser } from "./lib/auth";
import LoadingIndicator from "./components/LoadingIndicator";

export default function App() {
  const { isLoading } = useCurrentUser();

  return (
    <UrqlProvider value={client}>
      <Switch>
        <Match when={isLoading()}>
          <LoadingIndicator />
        </Match>
        <Match when={true}>
          <Router
            root={(props) => (
              <MetaProvider>
                <Suspense>{props.children}</Suspense>
              </MetaProvider>
            )}
          >
            <FileRoutes />
          </Router>
        </Match>
      </Switch>
    </UrqlProvider>
  );
}
