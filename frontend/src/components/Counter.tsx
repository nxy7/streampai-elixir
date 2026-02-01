import { createSignal } from "solid-js";

export default function Counter() {
	const [count, setCount] = createSignal(0);
	return (
		<button
			class="w-[200px] rounded-full border-2 border-neutral-300 bg-neutral-100 px-[2rem] py-[1rem] focus:border-neutral-400 active:border-neutral-400"
			onClick={() => setCount(count() + 1)}
			type="button">
			Clicks: {count()}
		</button>
	);
}
