import { createEffect, createSignal } from "solid-js";
import { type SetStoreFunction, createStore, reconcile } from "solid-js/store";

function readFromStorage<T>(key: string, defaultValue: T): T {
	if (typeof window === "undefined") return defaultValue;
	const stored = localStorage.getItem(key);
	if (stored === null) return defaultValue;
	try {
		return JSON.parse(stored) as T;
	} catch {
		return defaultValue;
	}
}

export function createLocalStorageSignal<T>(
	key: string,
	defaultValue: T,
): [() => T, (value: T | ((prev: T) => T)) => void] {
	const initial = readFromStorage(key, defaultValue);
	const [value, setValue] = createSignal<T>(initial);

	createEffect(() => {
		localStorage.setItem(key, JSON.stringify(value()));
	});

	return [value, setValue];
}

export function createLocalStorageStore<T extends object>(
	key: string,
	defaultValue: T,
): [T, SetStoreFunction<T>, () => void] {
	const initial = readFromStorage(key, defaultValue);
	const [store, setStore] = createStore<T>({ ...defaultValue, ...initial });

	createEffect(() => {
		localStorage.setItem(key, JSON.stringify(store));
	});

	const clear = () => {
		localStorage.removeItem(key);
		setStore(reconcile(defaultValue));
	};

	return [store, setStore, clear];
}
