// @refresh reload
import { StartClient, mount } from "@solidjs/start/client";

// biome-ignore lint/style/noNonNullAssertion: #app element is guaranteed by the HTML template
mount(() => <StartClient />, document.getElementById("app")!);
