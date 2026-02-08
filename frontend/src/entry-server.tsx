// @refresh reload

import { StartServer, createHandler } from "@solidjs/start/server";
import type { JSX } from "solid-js";

const DARK_MODE_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;

const ANTI_FLASH_STYLE = `html.dark{background:#111827;color:#f9fafb}`;

function Document(props: {
	assets: JSX.Element;
	children?: JSX.Element;
	scripts: JSX.Element;
}) {
	return (
		<html lang="en">
			<head>
				<meta charset="utf-8" />
				<meta content="width=device-width, initial-scale=1" name="viewport" />
				<link href="/images/favicon.png" rel="icon" type="image/png" />
				<script innerHTML={DARK_MODE_SCRIPT} />
				<style innerHTML={ANTI_FLASH_STYLE} />
				{props.assets}
			</head>
			<body>
				<div id="app">{props.children}</div>
				{props.scripts}
			</body>
		</html>
	);
}

export default createHandler(() => <StartServer document={Document} />);
