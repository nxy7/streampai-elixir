import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	type MockDB,
	type MockStore,
	createMockIndexedDB,
	deleteGlobalWindow,
	getGlobal,
	setGlobalIndexedDB,
	setGlobalWindow,
} from "./__test__/mock-indexeddb";
import {
	IDBPersister,
	clearAllElectricCache,
	getElectricCacheStats,
	isIndexedDBAvailable,
} from "./idb-persister";

let mockStores: Map<string, MockStore>;
let mockDBs: MockDB[];

describe("isIndexedDBAvailable", () => {
	const originalWindow = getGlobal().window;
	const originalIndexedDB = getGlobal().indexedDB;

	afterEach(() => {
		setGlobalWindow(originalWindow);
		setGlobalIndexedDB(originalIndexedDB);
	});

	it("returns false when window is undefined (SSR)", () => {
		deleteGlobalWindow();
		expect(isIndexedDBAvailable()).toBe(false);
	});

	it("returns false when indexedDB is undefined", () => {
		setGlobalWindow({});
		delete getGlobal().indexedDB;
		expect(isIndexedDBAvailable()).toBe(false);
	});

	it("returns true when indexedDB is available", () => {
		mockStores = new Map();
		mockDBs = [];
		setGlobalWindow({});
		setGlobalIndexedDB(createMockIndexedDB(mockStores, mockDBs));
		expect(isIndexedDBAvailable()).toBe(true);
	});
});

describe("IDBPersister", () => {
	const originalWindow = getGlobal().window;
	const originalIndexedDB = getGlobal().indexedDB;

	beforeEach(() => {
		mockStores = new Map();
		mockDBs = [];
		setGlobalWindow({});
		setGlobalIndexedDB(createMockIndexedDB(mockStores, mockDBs));
	});

	afterEach(() => {
		// Close all mock DBs
		for (const db of [...mockDBs]) {
			db.close();
		}
		setGlobalWindow(originalWindow);
		setGlobalIndexedDB(originalIndexedDB);
	});

	describe("constructor", () => {
		it("uses default maxAge of null (never expires)", async () => {
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "test",
			});

			// Save some data
			await persister.save([{ id: "1" }]);

			const metadata = await persister.getMetadata();
			expect(metadata).not.toBeNull();

			// Data should still load even after a delay (no expiration)
			await new Promise((resolve) => setTimeout(resolve, 100));
			const loaded = await persister.load();
			expect(loaded).toEqual([{ id: "1" }]);

			persister.close();
		});

		it("accepts custom maxAge", async () => {
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "test",
				maxAge: 1000,
			});

			await persister.save([{ id: "1" }]);

			persister.close();
		});

		it("accepts userId and version", async () => {
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "test",
				userId: "user123",
				version: 2,
			});

			await persister.save([{ id: "1" }]);

			const metadata = await persister.getMetadata();
			expect(metadata?.userId).toBe("user123");
			expect(metadata?.version).toBe(2);

			persister.close();
		});
	});

	describe("save and load", () => {
		it("saves and loads data correctly", async () => {
			type TestItem = { id: string; name: string };
			const persister = new IDBPersister<TestItem>({
				storageKey: "test-items",
			});

			const testData: TestItem[] = [
				{ id: "1", name: "Item 1" },
				{ id: "2", name: "Item 2" },
				{ id: "3", name: "Item 3" },
			];

			await persister.save(testData);
			const loaded = await persister.load();

			expect(loaded).toEqual(testData);

			persister.close();
		});

		it("returns empty array when no data exists", async () => {
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "nonexistent",
			});

			const loaded = await persister.load();
			expect(loaded).toEqual([]);

			persister.close();
		});

		it("handles empty arrays", async () => {
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "empty",
			});

			await persister.save([]);
			const loaded = await persister.load();

			expect(loaded).toEqual([]);

			persister.close();
		});

		it("overwrites existing data on save", async () => {
			type TestItem = { id: string };
			const persister = new IDBPersister<TestItem>({
				storageKey: "overwrite-test",
			});

			await persister.save([{ id: "1" }, { id: "2" }]);
			await persister.save([{ id: "3" }]);

			const loaded = await persister.load();
			expect(loaded).toEqual([{ id: "3" }]);

			persister.close();
		});
	});

	describe("cache validation", () => {
		it("returns empty array when cache is stale", async () => {
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "stale-test",
				maxAge: 100, // 100ms
			});

			await persister.save([{ id: "1" }]);

			// Wait for cache to become stale
			await new Promise((resolve) => setTimeout(resolve, 150));

			const loaded = await persister.load();
			expect(loaded).toEqual([]);

			persister.close();
		});

		it("returns empty array when version mismatch", async () => {
			const persister1 = new IDBPersister<{ id: string }>({
				storageKey: "version-test",
				version: 1,
			});

			await persister1.save([{ id: "1" }]);
			persister1.close();

			// Create new persister with different version
			const persister2 = new IDBPersister<{ id: string }>({
				storageKey: "version-test",
				version: 2,
			});

			const loaded = await persister2.load();
			expect(loaded).toEqual([]);

			persister2.close();
		});

		it("returns empty array when userId mismatch", async () => {
			const persister1 = new IDBPersister<{ id: string }>({
				storageKey: "user-test",
				userId: "user1",
			});

			await persister1.save([{ id: "1" }]);
			persister1.close();

			// Create new persister with different userId
			const persister2 = new IDBPersister<{ id: string }>({
				storageKey: "user-test",
				userId: "user2",
			});

			const loaded = await persister2.load();
			expect(loaded).toEqual([]);

			persister2.close();
		});

		it("loads data when userId matches", async () => {
			const persister1 = new IDBPersister<{ id: string }>({
				storageKey: "user-match-test",
				userId: "user1",
			});

			await persister1.save([{ id: "1" }]);
			persister1.close();

			// Create new persister with same userId
			const persister2 = new IDBPersister<{ id: string }>({
				storageKey: "user-match-test",
				userId: "user1",
			});

			const loaded = await persister2.load();
			expect(loaded).toEqual([{ id: "1" }]);

			persister2.close();
		});
	});

	describe("clear", () => {
		it("removes data and metadata", async () => {
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "clear-test",
			});

			await persister.save([{ id: "1" }]);
			await persister.clear();

			const loaded = await persister.load();
			expect(loaded).toEqual([]);

			const metadata = await persister.getMetadata();
			expect(metadata).toBeNull();

			persister.close();
		});
	});

	describe("getMetadata", () => {
		it("returns null when no cache exists", async () => {
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "no-metadata",
			});

			const metadata = await persister.getMetadata();
			expect(metadata).toBeNull();

			persister.close();
		});

		it("returns correct metadata", async () => {
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "metadata-test",
				userId: "user123",
				version: 3,
			});

			const now = Date.now();
			await persister.save([{ id: "1" }, { id: "2" }]);

			const metadata = await persister.getMetadata();
			expect(metadata).not.toBeNull();
			expect(metadata?.storageKey).toBe("metadata-test");
			expect(metadata?.userId).toBe("user123");
			expect(metadata?.version).toBe(3);
			expect(metadata?.itemCount).toBe(2);
			expect(metadata?.timestamp).toBeGreaterThanOrEqual(now);
			expect(metadata?.timestamp).toBeLessThanOrEqual(Date.now());

			persister.close();
		});
	});

	describe("isAvailable", () => {
		it("returns true when IndexedDB is available", async () => {
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "available-test",
			});

			// Trigger initialization
			await persister.load();

			expect(persister.isAvailable()).toBe(true);

			persister.close();
		});
	});

	describe("graceful fallback", () => {
		it("returns empty array when IndexedDB unavailable", async () => {
			deleteGlobalWindow();

			const persister = new IDBPersister<{ id: string }>({
				storageKey: "fallback-test",
			});

			const loaded = await persister.load();
			expect(loaded).toEqual([]);

			// save should not throw
			await persister.save([{ id: "1" }]);

			// clear should not throw
			await persister.clear();

			// getMetadata should return null
			const metadata = await persister.getMetadata();
			expect(metadata).toBeNull();

			expect(persister.isAvailable()).toBe(false);
		});
	});

	describe("large datasets", () => {
		it("handles 1000+ items efficiently", async () => {
			type LargeItem = { id: string; data: string };
			const persister = new IDBPersister<LargeItem>({
				storageKey: "large-dataset",
			});

			// Create 1000 items
			const largeData: LargeItem[] = Array.from({ length: 1000 }, (_, i) => ({
				id: `item-${i}`,
				data: `Data for item ${i} with some extra content to make it realistic`,
			}));

			const startSave = Date.now();
			await persister.save(largeData);
			const saveTime = Date.now() - startSave;

			const startLoad = Date.now();
			const loaded = await persister.load();
			const loadTime = Date.now() - startLoad;

			expect(loaded.length).toBe(1000);
			expect(loaded[0]).toEqual(largeData[0]);
			expect(loaded[999]).toEqual(largeData[999]);

			// Performance check (should be fast in mock, but validates no N+1 issues)
			expect(saveTime).toBeLessThan(1000); // < 1 second
			expect(loadTime).toBeLessThan(1000); // < 1 second

			persister.close();
		});
	});
});

describe("clearAllElectricCache", () => {
	const originalWindow = getGlobal().window;
	const originalIndexedDB = getGlobal().indexedDB;

	beforeEach(() => {
		mockStores = new Map();
		mockDBs = [];
		setGlobalWindow({});
		setGlobalIndexedDB(createMockIndexedDB(mockStores, mockDBs));
	});

	afterEach(() => {
		for (const db of [...mockDBs]) {
			db.close();
		}
		setGlobalWindow(originalWindow);
		setGlobalIndexedDB(originalIndexedDB);
	});

	it("clears all cached data", async () => {
		// Save some data first
		const persister1 = new IDBPersister<{ id: string }>({
			storageKey: "cache1",
		});
		const persister2 = new IDBPersister<{ id: string }>({
			storageKey: "cache2",
		});

		await persister1.save([{ id: "1" }]);
		await persister2.save([{ id: "2" }]);

		persister1.close();
		persister2.close();

		// Clear all
		await clearAllElectricCache();

		// Verify cleared
		const newPersister1 = new IDBPersister<{ id: string }>({
			storageKey: "cache1",
		});
		const newPersister2 = new IDBPersister<{ id: string }>({
			storageKey: "cache2",
		});

		expect(await newPersister1.load()).toEqual([]);
		expect(await newPersister2.load()).toEqual([]);

		newPersister1.close();
		newPersister2.close();
	});

	it("does not throw when IndexedDB unavailable", async () => {
		deleteGlobalWindow();

		await expect(clearAllElectricCache()).resolves.toBeUndefined();
	});
});

describe("getElectricCacheStats", () => {
	const originalWindow = getGlobal().window;
	const originalIndexedDB = getGlobal().indexedDB;

	beforeEach(() => {
		mockStores = new Map();
		mockDBs = [];
		setGlobalWindow({});
		setGlobalIndexedDB(createMockIndexedDB(mockStores, mockDBs));
	});

	afterEach(() => {
		for (const db of [...mockDBs]) {
			db.close();
		}
		setGlobalWindow(originalWindow);
		setGlobalIndexedDB(originalIndexedDB);
	});

	it("returns empty array when no cache exists", async () => {
		const stats = await getElectricCacheStats();
		expect(stats).toEqual([]);
	});

	it("returns stats for all cached collections", async () => {
		const persister1 = new IDBPersister<{ id: string }>({
			storageKey: "stats1",
			userId: "user1",
			version: 1,
		});
		const persister2 = new IDBPersister<{ id: string }>({
			storageKey: "stats2",
			userId: "user2",
			version: 2,
		});

		await persister1.save([{ id: "1" }]);
		await persister2.save([{ id: "2" }, { id: "3" }]);

		persister1.close();
		persister2.close();

		const stats = await getElectricCacheStats();

		expect(stats.length).toBe(2);

		const stat1 = stats.find((s) => s.storageKey === "stats1");
		const stat2 = stats.find((s) => s.storageKey === "stats2");

		expect(stat1).toBeDefined();
		expect(stat1?.userId).toBe("user1");
		expect(stat1?.version).toBe(1);
		expect(stat1?.itemCount).toBe(1);

		expect(stat2).toBeDefined();
		expect(stat2?.userId).toBe("user2");
		expect(stat2?.version).toBe(2);
		expect(stat2?.itemCount).toBe(2);
	});

	it("returns empty array when IndexedDB unavailable", async () => {
		deleteGlobalWindow();

		const stats = await getElectricCacheStats();
		expect(stats).toEqual([]);
	});
});
