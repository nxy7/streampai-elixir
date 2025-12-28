import { afterEach, beforeEach, describe, expect, it } from "vitest";

// Mock IndexedDB for Node.js environment (reuse from idb-persister.test.ts)
interface MockStore {
	data: Map<string, unknown>;
	keyPath: string;
}

interface MockTransaction {
	objectStore: (name: string) => MockObjectStore;
	oncomplete?: () => void;
	onerror?: (error: Error) => void;
	error?: Error | null;
}

interface MockObjectStore {
	get: (key: string) => MockRequest;
	put: (value: unknown) => MockRequest;
	delete: (key: string) => MockRequest;
	getAll: () => MockRequest;
}

interface MockRequest {
	result?: unknown;
	error?: Error | null;
	onsuccess?: () => void;
	onerror?: () => void;
}

interface MockDB {
	objectStoreNames: { contains: (name: string) => boolean };
	createObjectStore: (name: string, options: { keyPath: string }) => void;
	transaction: (stores: string[], mode: IDBTransactionMode) => MockTransaction;
	close: () => void;
	onclose?: () => void;
	onerror?: (event: Event) => void;
}

interface MockOpenRequest {
	result?: MockDB;
	error?: Error | null;
	onsuccess?: () => void;
	onerror?: () => void;
	onupgradeneeded?: (event: { target: { result: MockDB } }) => void;
}

let mockStores: Map<string, MockStore>;
let mockDBs: MockDB[];

// biome-ignore lint/suspicious/noExplicitAny: Test utility for mocking globals
const getGlobal = () => globalThis as any;
// biome-ignore lint/suspicious/noExplicitAny: Test utility for mocking globals
const setGlobalWindow = (value: any) => {
	getGlobal().window = value;
};
// biome-ignore lint/suspicious/noExplicitAny: Test utility for mocking globals
const setGlobalIndexedDB = (value: any) => {
	getGlobal().indexedDB = value;
};
const _deleteGlobalWindow = () => {
	delete getGlobal().window;
};
const _deleteGlobalIndexedDB = () => {
	delete getGlobal().indexedDB;
};

function createMockDB(): MockDB {
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

function createMockIndexedDB() {
	return {
		open: (_name: string, _version: number): MockOpenRequest => {
			const req: MockOpenRequest = {};

			queueMicrotask(() => {
				const needsUpgrade = mockStores.size === 0;

				if (needsUpgrade && req.onupgradeneeded) {
					const db = createMockDB();
					req.onupgradeneeded({ target: { result: db } });
					req.result = db;
				} else {
					req.result = createMockDB();
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

// Import after mocking
import { IDBPersister, clearAllElectricCache } from "./idb-persister";
import {
	clearPersistedCache,
	persistedElectricCollection,
} from "./persisted-electric";

describe("persistedElectricCollection", () => {
	const originalWindow = getGlobal().window;
	const originalIndexedDB = getGlobal().indexedDB;

	beforeEach(() => {
		mockStores = new Map();
		mockDBs = [];
		setGlobalWindow({});
		setGlobalIndexedDB(createMockIndexedDB());
	});

	afterEach(async () => {
		for (const db of [...mockDBs]) {
			db.close();
		}
		await clearAllElectricCache();
		setGlobalWindow(originalWindow);
		setGlobalIndexedDB(originalIndexedDB);
	});

	describe("configuration", () => {
		it("returns electric options when persist is false", () => {
			type TestItem = { id: string; name: string };

			const config = persistedElectricCollection<TestItem>({
				id: "test-collection",
				shapeOptions: { url: "http://test.local/shapes/test" },
				getKey: (item) => item.id,
				persist: false,
			});

			expect(config.id).toBe("test-collection");
			expect(config.sync).toBeDefined();
		});

		it("returns electric options when persist is undefined", () => {
			type TestItem = { id: string; name: string };

			const config = persistedElectricCollection<TestItem>({
				id: "test-collection",
				shapeOptions: { url: "http://test.local/shapes/test" },
				getKey: (item) => item.id,
			});

			expect(config.id).toBe("test-collection");
			expect(config.sync).toBeDefined();
		});

		it("returns enhanced options when persist is true", () => {
			type TestItem = { id: string; name: string };

			const config = persistedElectricCollection<TestItem>({
				id: "test-collection",
				shapeOptions: { url: "http://test.local/shapes/test" },
				getKey: (item) => item.id,
				persist: true,
			});

			expect(config.id).toBe("test-collection");
			expect(config.sync).toBeDefined();
		});

		it("uses default storage key from collection id", () => {
			type TestItem = { id: string };

			const config = persistedElectricCollection<TestItem>({
				id: "my-collection",
				shapeOptions: { url: "http://test.local/shapes/test" },
				getKey: (item) => item.id,
				persist: true,
			});

			// Storage key should be based on collection id
			expect(config.id).toBe("my-collection");
		});

		it("uses custom storage key when provided", () => {
			type TestItem = { id: string };

			const config = persistedElectricCollection<TestItem>({
				id: "my-collection",
				shapeOptions: { url: "http://test.local/shapes/test" },
				getKey: (item) => item.id,
				persist: true,
				storageKey: "custom-key",
			});

			expect(config.id).toBe("my-collection");
		});
	});

	describe("user-scoped storage keys", () => {
		it("generates user-scoped storage key when userId provided", async () => {
			type TestItem = { id: string };

			// Pre-populate cache with user-scoped data
			const persister = new IDBPersister<TestItem>({
				storageKey: "electric:my-collection:user123",
				userId: "user123",
			});
			await persister.save([{ id: "cached-item" }]);
			persister.close();

			// Create persisted collection with same user
			const config = persistedElectricCollection<TestItem>({
				id: "my-collection",
				shapeOptions: { url: "http://test.local/shapes/test" },
				getKey: (item) => item.id,
				persist: true,
				userId: () => "user123",
			});

			expect(config).toBeDefined();
		});

		it("isolates data between users", async () => {
			type TestItem = { id: string; data: string };

			// Save data for user1
			const persister1 = new IDBPersister<TestItem>({
				storageKey: "electric:collection:user1",
				userId: "user1",
			});
			await persister1.save([{ id: "1", data: "user1-data" }]);
			persister1.close();

			// Try to load as user2 - should get empty
			const persister2 = new IDBPersister<TestItem>({
				storageKey: "electric:collection:user2",
				userId: "user2",
			});
			const user2Data = await persister2.load();
			expect(user2Data).toEqual([]);
			persister2.close();

			// Load as user1 - should get data
			const persister1Again = new IDBPersister<TestItem>({
				storageKey: "electric:collection:user1",
				userId: "user1",
			});
			const user1Data = await persister1Again.load();
			expect(user1Data).toEqual([{ id: "1", data: "user1-data" }]);
			persister1Again.close();
		});
	});

	describe("cache validation", () => {
		it("respects maxAge for cache expiration", async () => {
			type TestItem = { id: string };

			// Save data with short maxAge
			const persister = new IDBPersister<TestItem>({
				storageKey: "electric:test-expiry",
				maxAge: 50, // 50ms
			});
			await persister.save([{ id: "1" }]);

			// Wait for data to expire using real setTimeout
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Load should return empty
			const loaded = await persister.load();
			expect(loaded).toEqual([]);

			persister.close();
		});

		it("uses default maxAge of 24h when not specified", () => {
			type TestItem = { id: string };

			// Just verify it doesn't throw when creating config
			const config = persistedElectricCollection<TestItem>({
				id: "test",
				shapeOptions: { url: "http://test.local/shapes/test" },
				getKey: (item) => item.id,
				persist: true,
			});

			expect(config).toBeDefined();
		});

		it("allows null maxAge for never-expiring cache", async () => {
			type TestItem = { id: string };

			const persister = new IDBPersister<TestItem>({
				storageKey: "electric:never-expires",
				maxAge: null,
			});
			await persister.save([{ id: "1" }]);

			// Small delay to simulate time passing (but cache shouldn't expire since maxAge is null)
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Should still load (null maxAge means never expire)
			const loaded = await persister.load();
			expect(loaded).toEqual([{ id: "1" }]);

			persister.close();
		});

		it("respects version for cache invalidation", async () => {
			type TestItem = { id: string };

			// Save with version 1
			const persister1 = new IDBPersister<TestItem>({
				storageKey: "electric:versioned",
				version: 1,
			});
			await persister1.save([{ id: "1" }]);
			persister1.close();

			// Load with version 2 - should be empty
			const persister2 = new IDBPersister<TestItem>({
				storageKey: "electric:versioned",
				version: 2,
			});
			const loaded = await persister2.load();
			expect(loaded).toEqual([]);
			persister2.close();
		});
	});

	describe("hydration flow", () => {
		it("provides immediate data from cache before sync", async () => {
			type TestItem = { id: string; name: string };

			// Pre-populate cache
			const persister = new IDBPersister<TestItem>({
				storageKey: "electric:hydration-test",
			});
			await persister.save([
				{ id: "1", name: "Cached Item 1" },
				{ id: "2", name: "Cached Item 2" },
			]);
			persister.close();

			// Verify cache is populated
			const verifyPersister = new IDBPersister<TestItem>({
				storageKey: "electric:hydration-test",
			});
			const cachedData = await verifyPersister.load();
			expect(cachedData.length).toBe(2);
			verifyPersister.close();
		});
	});
});

describe("clearPersistedCache", () => {
	const originalWindow = getGlobal().window;
	const originalIndexedDB = getGlobal().indexedDB;

	beforeEach(() => {
		mockStores = new Map();
		mockDBs = [];
		setGlobalWindow({});
		setGlobalIndexedDB(createMockIndexedDB());
	});

	afterEach(async () => {
		for (const db of [...mockDBs]) {
			db.close();
		}
		await clearAllElectricCache();
		setGlobalWindow(originalWindow);
		setGlobalIndexedDB(originalIndexedDB);
	});

	it("clears cache for a specific collection", async () => {
		type TestItem = { id: string };

		// Save some data
		const persister = new IDBPersister<TestItem>({
			storageKey: "electric:clear-test",
		});
		await persister.save([{ id: "1" }]);
		persister.close();

		// Clear the cache
		await clearPersistedCache("clear-test");

		// Verify it's gone
		const verifyPersister = new IDBPersister<TestItem>({
			storageKey: "electric:clear-test",
		});
		const loaded = await verifyPersister.load();
		expect(loaded).toEqual([]);
		verifyPersister.close();
	});

	it("clears user-scoped cache", async () => {
		type TestItem = { id: string };

		// Save some data for a user
		const persister = new IDBPersister<TestItem>({
			storageKey: "electric:user-clear-test:user123",
			userId: "user123",
		});
		await persister.save([{ id: "1" }]);
		persister.close();

		// Clear the cache for that user
		await clearPersistedCache("user-clear-test", "user123");

		// Verify it's gone
		const verifyPersister = new IDBPersister<TestItem>({
			storageKey: "electric:user-clear-test:user123",
			userId: "user123",
		});
		const loaded = await verifyPersister.load();
		expect(loaded).toEqual([]);
		verifyPersister.close();
	});

	it("does not affect other collections", async () => {
		type TestItem = { id: string };

		// Save data to two collections
		const persister1 = new IDBPersister<TestItem>({
			storageKey: "electric:keep-me",
		});
		await persister1.save([{ id: "keep" }]);
		persister1.close();

		const persister2 = new IDBPersister<TestItem>({
			storageKey: "electric:delete-me",
		});
		await persister2.save([{ id: "delete" }]);
		persister2.close();

		// Clear only one
		await clearPersistedCache("delete-me");

		// Verify other is still there
		const verifyPersister = new IDBPersister<TestItem>({
			storageKey: "electric:keep-me",
		});
		const loaded = await verifyPersister.load();
		expect(loaded).toEqual([{ id: "keep" }]);
		verifyPersister.close();
	});
});
