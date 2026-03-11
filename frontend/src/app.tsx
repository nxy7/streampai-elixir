import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import type { ParentProps } from "solid-js";
import "./app.css";
import { initErrorReporter } from "./lib/errorReporter";
import { initTracing } from "./lib/tracing";

initTracing();
initErrorReporter();

function RootLayout(props: ParentProps) {
	return (
		<MetaProvider>
			<Title>Streampai</Title>
			{props.children}
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
