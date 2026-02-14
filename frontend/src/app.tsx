import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import type { ParentProps } from "solid-js";
import "./app.css";

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
