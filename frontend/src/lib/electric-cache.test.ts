import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	type MockDB,
	type MockStore,
	createMockIndexedDB,
	createMockLocalStorage,
	deleteGlobalLocalStorage,
	deleteGlobalWindow,
	getGlobal,
	setGlobalIndexedDB,
	setGlobalLocalStorage,
	setGlobalWindow,
} from "./__test__/mock-indexeddb";
import {
	clearAllElectricCaches,
	clearPersistedCache,
	getCacheStats,
	invalidateCacheOnVersionChange,
} from "./electric-cache";
import { IDBPersister } from "./idb-persister";

let mockStores: Map<string, MockStore>;
let mockDBs: MockDB[];
let mockLocalStorage: Map<string, string>;

describe("electric-cache utilities", () => {
	const originalWindow = getGlobal().window;
	const originalIndexedDB = getGlobal().indexedDB;
	const originalLocalStorage = getGlobal().localStorage;

	beforeEach(() => {
		mockStores = new Map();
		mockDBs = [];
		mockLocalStorage = new Map();
		setGlobalWindow({});
		setGlobalIndexedDB(createMockIndexedDB(mockStores, mockDBs));
		setGlobalLocalStorage(createMockLocalStorage(mockLocalStorage));
	});

	afterEach(() => {
		for (const db of [...mockDBs]) {
			db.close();
		}
		setGlobalWindow(originalWindow);
		setGlobalIndexedDB(originalIndexedDB);
		setGlobalLocalStorage(originalLocalStorage);
	});

	describe("clearPersistedCache", () => {
		it("clears all cache when no userId provided", async () => {
			// Setup: save some data
			const persister1 = new IDBPersister<{ id: string }>({
				storageKey: "cache1",
				userId: "user1",
			});
			const persister2 = new IDBPersister<{ id: string }>({
				storageKey: "cache2",
				userId: "user2",
			});

			await persister1.save([{ id: "1" }]);
			await persister2.save([{ id: "2" }]);
			persister1.close();
			persister2.close();

			// Clear all
			await clearPersistedCache();

			// Verify cleared
			const newPersister1 = new IDBPersister<{ id: string }>({
				storageKey: "cache1",
				userId: "user1",
			});
			const newPersister2 = new IDBPersister<{ id: string }>({
				storageKey: "cache2",
				userId: "user2",
			});

			expect(await newPersister1.load()).toEqual([]);
			expect(await newPersister2.load()).toEqual([]);

			newPersister1.close();
			newPersister2.close();
		});

		it("clears only specific user cache when userId provided", async () => {
			// Setup: save data for two users
			const persister1 = new IDBPersister<{ id: string }>({
				storageKey: "cache1",
				userId: "user1",
			});
			const persister2 = new IDBPersister<{ id: string }>({
				storageKey: "cache2",
				userId: "user2",
			});

			await persister1.save([{ id: "1" }]);
			await persister2.save([{ id: "2" }]);
			persister1.close();
			persister2.close();

			// Clear only user1's cache
			await clearPersistedCache("user1");

			// Verify user1's cache is cleared but user2's is not
			const newPersister1 = new IDBPersister<{ id: string }>({
				storageKey: "cache1",
				userId: "user1",
			});
			const newPersister2 = new IDBPersister<{ id: string }>({
				storageKey: "cache2",
				userId: "user2",
			});

			expect(await newPersister1.load()).toEqual([]);
			expect(await newPersister2.load()).toEqual([{ id: "2" }]);

			newPersister1.close();
			newPersister2.close();
		});

		it("handles non-existent user gracefully", async () => {
			// Setup: save data for one user
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "cache",
				userId: "user1",
			});
			await persister.save([{ id: "1" }]);
			persister.close();

			// Try to clear non-existent user
			await expect(
				clearPersistedCache("nonexistent-user"),
			).resolves.toBeUndefined();

			// Verify original data is untouched
			const newPersister = new IDBPersister<{ id: string }>({
				storageKey: "cache",
				userId: "user1",
			});
			expect(await newPersister.load()).toEqual([{ id: "1" }]);
			newPersister.close();
		});

		it("handles IndexedDB unavailable gracefully", async () => {
			deleteGlobalWindow();

			await expect(clearPersistedCache("some-user")).resolves.toBeUndefined();
		});
	});

	describe("getCacheStats", () => {
		it("returns empty stats when no cache exists", async () => {
			const stats = await getCacheStats();

			expect(stats.collections).toBe(0);
			expect(stats.totalSize).toBe("0 B");
			expect(stats.totalSizeBytes).toBe(0);
			expect(stats.oldestEntry).toBeNull();
			expect(stats.newestEntry).toBeNull();
			expect(stats.collectionDetails).toEqual([]);
		});

		it("returns accurate stats for cached collections", async () => {
			// Setup: save data
			const persister1 = new IDBPersister<{ id: string; data: string }>({
				storageKey: "collection1",
				userId: "user1",
				version: 1,
			});
			const persister2 = new IDBPersister<{ id: string; data: string }>({
				storageKey: "collection2",
				userId: "user2",
				version: 2,
			});

			await persister1.save([
				{ id: "1", data: "some data here" },
				{ id: "2", data: "more data" },
			]);
			await persister2.save([{ id: "3", data: "different data" }]);

			persister1.close();
			persister2.close();

			const stats = await getCacheStats();

			expect(stats.collections).toBe(2);
			expect(stats.totalSizeBytes).toBeGreaterThan(0);
			expect(stats.totalSize).toMatch(/^\d+(\.\d+)?\s+(B|KB|MB|GB)$/);
			expect(stats.oldestEntry).toBeInstanceOf(Date);
			expect(stats.newestEntry).toBeInstanceOf(Date);
			expect(stats.collectionDetails).toHaveLength(2);

			// Find specific collections
			const col1 = stats.collectionDetails.find(
				(c) => c.name === "collection1",
			);
			const col2 = stats.collectionDetails.find(
				(c) => c.name === "collection2",
			);

			expect(col1).toBeDefined();
			expect(col1?.itemCount).toBe(2);
			expect(col1?.userId).toBe("user1");
			expect(col1?.version).toBe(1);
			expect(col1?.sizeBytes).toBeGreaterThan(0);
			expect(col1?.lastUpdated).toBeInstanceOf(Date);

			expect(col2).toBeDefined();
			expect(col2?.itemCount).toBe(1);
			expect(col2?.userId).toBe("user2");
			expect(col2?.version).toBe(2);
		});

		it("returns collections sorted by last updated (newest first)", async () => {
			const persister1 = new IDBPersister<{ id: string }>({
				storageKey: "first",
			});
			await persister1.save([{ id: "1" }]);
			persister1.close();

			// Small delay to ensure different timestamps
			await new Promise((r) => setTimeout(r, 10));

			const persister2 = new IDBPersister<{ id: string }>({
				storageKey: "second",
			});
			await persister2.save([{ id: "2" }]);
			persister2.close();

			const stats = await getCacheStats();

			expect(stats.collectionDetails[0].name).toBe("second");
			expect(stats.collectionDetails[1].name).toBe("first");
		});

		it("handles IndexedDB unavailable gracefully", async () => {
			deleteGlobalWindow();

			const stats = await getCacheStats();
			expect(stats.collections).toBe(0);
			expect(stats.collectionDetails).toEqual([]);
		});
	});

	describe("invalidateCacheOnVersionChange", () => {
		it("does not clear cache on first run (no previous version)", async () => {
			// Setup: save some data
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "test",
			});
			await persister.save([{ id: "1" }]);
			persister.close();

			const wasInvalidated = await invalidateCacheOnVersionChange("1.0.0");

			expect(wasInvalidated).toBe(false);
			expect(mockLocalStorage.get("streampai-electric-cache-version")).toBe(
				"1.0.0",
			);

			// Data should still exist
			const newPersister = new IDBPersister<{ id: string }>({
				storageKey: "test",
			});
			expect(await newPersister.load()).toEqual([{ id: "1" }]);
			newPersister.close();
		});

		it("clears cache when version changes", async () => {
			// Setup: save some data and set previous version
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "test",
			});
			await persister.save([{ id: "1" }]);
			persister.close();

			mockLocalStorage.set("streampai-electric-cache-version", "1.0.0");

			const wasInvalidated = await invalidateCacheOnVersionChange("2.0.0");

			expect(wasInvalidated).toBe(true);
			expect(mockLocalStorage.get("streampai-electric-cache-version")).toBe(
				"2.0.0",
			);

			// Data should be cleared
			const newPersister = new IDBPersister<{ id: string }>({
				storageKey: "test",
			});
			expect(await newPersister.load()).toEqual([]);
			newPersister.close();
		});

		it("does not clear cache when version is the same", async () => {
			// Setup: save some data and set same version
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "test",
			});
			await persister.save([{ id: "1" }]);
			persister.close();

			mockLocalStorage.set("streampai-electric-cache-version", "1.0.0");

			const wasInvalidated = await invalidateCacheOnVersionChange("1.0.0");

			expect(wasInvalidated).toBe(false);

			// Data should still exist
			const newPersister = new IDBPersister<{ id: string }>({
				storageKey: "test",
			});
			expect(await newPersister.load()).toEqual([{ id: "1" }]);
			newPersister.close();
		});

		it("handles localStorage unavailable gracefully", async () => {
			deleteGlobalLocalStorage();

			const wasInvalidated = await invalidateCacheOnVersionChange("1.0.0");
			expect(wasInvalidated).toBe(false);
		});
	});

	describe("clearAllElectricCaches", () => {
		it("clears all cache and version tracking", async () => {
			// Setup: save some data and set version
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

			mockLocalStorage.set("streampai-electric-cache-version", "1.0.0");

			await clearAllElectricCaches();

			// Verify all cleared
			const newPersister1 = new IDBPersister<{ id: string }>({
				storageKey: "cache1",
			});
			const newPersister2 = new IDBPersister<{ id: string }>({
				storageKey: "cache2",
			});

			expect(await newPersister1.load()).toEqual([]);
			expect(await newPersister2.load()).toEqual([]);
			expect(
				mockLocalStorage.get("streampai-electric-cache-version"),
			).toBeUndefined();

			newPersister1.close();
			newPersister2.close();
		});

		it("handles missing localStorage gracefully", async () => {
			const persister = new IDBPersister<{ id: string }>({
				storageKey: "cache",
			});
			await persister.save([{ id: "1" }]);
			persister.close();

			deleteGlobalLocalStorage();

			await expect(clearAllElectricCaches()).resolves.toBeUndefined();
		});

		it("handles IndexedDB unavailable gracefully", async () => {
			deleteGlobalWindow();

			await expect(clearAllElectricCaches()).resolves.toBeUndefined();
		});
	});
});
