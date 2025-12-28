/**
 * Mock IndexedDB implementation for Node.js test environment.
 *
 * Provides a complete mock of IndexedDB APIs for testing persistence code
 * without requiring a real browser environment.
 *
 * @example
 * ```typescript
 * import {
 *   createMockIndexedDB,
 *   setGlobalWindow,
 *   setGlobalIndexedDB,
 *   getGlobal,
 *   type MockDB,
 * } from "./__test__/mock-indexeddb";
 *
 * let mockStores: Map<string, MockStore>;
 * let mockDBs: MockDB[];
 *
 * beforeEach(() => {
 *   mockStores = new Map();
 *   mockDBs = [];
 *   setGlobalWindow({});
 *   setGlobalIndexedDB(createMockIndexedDB(mockStores, mockDBs));
 * });
 * ```
 */

export interface MockStore {
	data: Map<string, unknown>;
	keyPath: string;
}

export interface MockTransaction {
	objectStore: (name: string) => MockObjectStore;
	oncomplete?: () => void;
	onerror?: (error: Error) => void;
	error?: Error | null;
}

export interface MockObjectStore {
	get: (key: string) => MockRequest;
	put: (value: unknown) => MockRequest;
	delete: (key: string) => MockRequest;
	getAll: () => MockRequest;
}

export interface MockRequest {
	result?: unknown;
	error?: Error | null;
	onsuccess?: () => void;
	onerror?: () => void;
}

export interface MockDB {
	objectStoreNames: { contains: (name: string) => boolean };
	createObjectStore: (name: string, options: { keyPath: string }) => void;
	transaction: (stores: string[], mode: IDBTransactionMode) => MockTransaction;
	close: () => void;
	onclose?: () => void;
	onerror?: (event: Event) => void;
}

export interface MockOpenRequest {
	result?: MockDB;
	error?: Error | null;
	onsuccess?: () => void;
	onerror?: () => void;
	onupgradeneeded?: (event: { target: { result: MockDB } }) => void;
}

// biome-ignore lint/suspicious/noExplicitAny: Test utility for mocking globals
export const getGlobal = () => globalThis as any;

// biome-ignore lint/suspicious/noExplicitAny: Test utility for mocking globals
export const setGlobalWindow = (value: any) => {
	getGlobal().window = value;
};

// biome-ignore lint/suspicious/noExplicitAny: Test utility for mocking globals
export const setGlobalIndexedDB = (value: any) => {
	getGlobal().indexedDB = value;
};

// biome-ignore lint/suspicious/noExplicitAny: Test utility for mocking globals
export const setGlobalLocalStorage = (value: any) => {
	getGlobal().localStorage = value;
};

export const deleteGlobalWindow = () => {
	delete getGlobal().window;
};

export const deleteGlobalIndexedDB = () => {
	delete getGlobal().indexedDB;
};

export const deleteGlobalLocalStorage = () => {
	delete getGlobal().localStorage;
};

/**
 * Create a mock IDBDatabase instance.
 */
export function createMockDB(
	mockStores: Map<string, MockStore>,
	mockDBs: MockDB[],
): MockDB {
	const db: MockDB = {
		objectStoreNames: {
			contains: (name: string) => mockStores.has(name),
		},
		createObjectStore: (name: string, options: { keyPath: string }) => {
			mockStores.set(name, { data: new Map(), keyPath: options.keyPath });
		},
		transaction: (_stores: string[], _mode: IDBTransactionMode) => {
			const tx: MockTransaction = {
				objectStore: (name: string): MockObjectStore => {
					const store = mockStores.get(name);
					if (!store) {
						throw new Error(`Store ${name} not found`);
					}

					return {
						get: (key: string): MockRequest => {
							const req: MockRequest = {
								result: store.data.get(key),
							};
							queueMicrotask(() => req.onsuccess?.());
							return req;
						},
						put: (value: unknown): MockRequest => {
							const keyPath = store.keyPath;
							const key = (value as Record<string, string>)[keyPath];
							store.data.set(key, value);
							const req: MockRequest = {};
							queueMicrotask(() => req.onsuccess?.());
							return req;
						},
						delete: (key: string): MockRequest => {
							store.data.delete(key);
							const req: MockRequest = {};
							queueMicrotask(() => req.onsuccess?.());
							return req;
						},
						getAll: (): MockRequest => {
							const req: MockRequest = {
								result: Array.from(store.data.values()),
							};
							queueMicrotask(() => req.onsuccess?.());
							return req;
						},
					};
				},
				error: null,
			};

			// Simulate async transaction completion
			queueMicrotask(() => {
				queueMicrotask(() => {
					tx.oncomplete?.();
				});
			});

			return tx;
		},
		close: () => {
			const idx = mockDBs.indexOf(db);
			if (idx !== -1) {
				mockDBs.splice(idx, 1);
			}
		},
	};

	mockDBs.push(db);
	return db;
}

/**
 * Create a mock indexedDB global object.
 */
export function createMockIndexedDB(
	mockStores: Map<string, MockStore>,
	mockDBs: MockDB[],
) {
	return {
		open: (_name: string, _version: number): MockOpenRequest => {
			const req: MockOpenRequest = {};

			queueMicrotask(() => {
				const needsUpgrade = mockStores.size === 0;

				if (needsUpgrade && req.onupgradeneeded) {
					const db = createMockDB(mockStores, mockDBs);
					req.onupgradeneeded({ target: { result: db } });
					req.result = db;
				} else {
					req.result = createMockDB(mockStores, mockDBs);
				}

				req.onsuccess?.();
			});

			return req;
		},
		deleteDatabase: (_name: string): MockOpenRequest => {
			mockStores.clear();
			const req: MockOpenRequest = {};
			queueMicrotask(() => req.onsuccess?.());
			return req;
		},
	};
}

/**
 * Create a mock localStorage object.
 */
export function createMockLocalStorage(storage: Map<string, string>) {
	return {
		getItem: (key: string) => storage.get(key) ?? null,
		setItem: (key: string, value: string) => storage.set(key, value),
		removeItem: (key: string) => storage.delete(key),
		clear: () => storage.clear(),
	};
}
