import { createEffect, createSignal, onMount } from "solid-js";
import { createStore, reconcile, type SetStoreFunction } from "solid-js/store";

export function createLocalStorageSignal<T>(
	key: string,
	defaultValue: T,
): [() => T, (value: T | ((prev: T) => T)) => void] {
	const [value, setValue] = createSignal<T>(defaultValue);
	const [mounted, setMounted] = createSignal(false);

	onMount(() => {
		const stored = localStorage.getItem(key);
		if (stored !== null) {
			try {
				setValue(() => JSON.parse(stored) as T);
			} catch {
				setValue(() => defaultValue);
			}
		}
		setMounted(true);
	});

	createEffect(() => {
		if (mounted()) {
			const current = value();
			if (current === defaultValue && localStorage.getItem(key) === null) {
				return;
			}
			localStorage.setItem(key, JSON.stringify(current));
		}
	});

	return [value, setValue];
}

export function createLocalStorageStore<T extends object>(
	key: string,
	defaultValue: T,
): [T, SetStoreFunction<T>, () => void] {
	const [store, setStore] = createStore<T>(defaultValue);
	const [mounted, setMounted] = createSignal(false);

	onMount(() => {
		const stored = localStorage.getItem(key);
		if (stored !== null) {
			try {
				const parsed = JSON.parse(stored) as T;
				setStore(reconcile({ ...defaultValue, ...parsed }));
			} catch {
				// Keep default value
			}
		}
		setMounted(true);
	});

	createEffect(() => {
		if (mounted()) {
			localStorage.setItem(key, JSON.stringify(store));
		}
	});

	const clear = () => {
		localStorage.removeItem(key);
		setStore(reconcile(defaultValue));
	};

	return [store, setStore, clear];
}
