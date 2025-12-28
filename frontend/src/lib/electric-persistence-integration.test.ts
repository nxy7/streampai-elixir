/**
 * Integration Tests: Electric SQL Persistence - Instant Load Simulation
 *
 * These tests simulate the instant data loading behavior on page refresh
 * by leveraging IndexedDB caching. They use mocked IndexedDB to verify
 * the caching logic without requiring a real browser environment.
 *
 * ## What these tests verify
 * - Data is correctly cached after Electric sync
 * - Cached data is available immediately on "refresh" (new persister instance)
 * - Cache invalidation scenarios (maxAge, version changes, user switching)
 * - Data integrity through cache cycle (including nested structures)
 *
 * ## Manual E2E Testing
 * For true end-to-end verification in a browser, see the instructions at
 * the bottom of this file.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	type MockDB,
	type MockStore,
	createMockIndexedDB,
	getGlobal,
	setGlobalIndexedDB,
	setGlobalWindow,
} from "./__test__/mock-indexeddb";
import { IDBPersister } from "./idb-persister";

let mockStores: Map<string, MockStore>;
let mockDBs: MockDB[];

describe("Integration: Electric SQL Persistence - Instant Load", () => {
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

	describe("simulated instant load flow", () => {
		it("provides cached data immediately on page load simulation", async () => {
			const userId = "test-user-123";
			type TestItem = { id: string; title: string };

			// Step 1: Simulate first page load - Electric syncs and saves to cache
			const firstLoadCache = new IDBPersister<TestItem>({
				storageKey: `electric:livestreams_${userId}:${userId}`,
				userId: userId,
			});

			// Simulate Electric sync populating the cache
			const syncedData: TestItem[] = [
				{ id: "stream-1", title: "My First Stream" },
				{ id: "stream-2", title: "Gaming Session" },
				{ id: "stream-3", title: "Q&A Live" },
			];
			await firstLoadCache.save(syncedData);
			firstLoadCache.close();

			// Step 2: Simulate page refresh - new persister loads cached data
			const secondLoadCache = new IDBPersister<TestItem>({
				storageKey: `electric:livestreams_${userId}:${userId}`,
				userId: userId,
			});

			const cachedData = await secondLoadCache.load();

			// Step 3: Verify instant load - data available without waiting for sync
			expect(cachedData).toHaveLength(3);
			expect(cachedData[0].title).toBe("My First Stream");

			secondLoadCache.close();
		});

		it("user preferences are available instantly on refresh", async () => {
			const userId = "user-prefs-test";
			type TestPrefs = {
				id: string;
				name: string;
				email_notifications: boolean;
			};

			// Initial sync
			const prefsCache = new IDBPersister<TestPrefs>({
				storageKey: `electric:user_preferences_${userId}:${userId}`,
				userId: userId,
			});

			await prefsCache.save([
				{
					id: userId,
					name: "Test User",
					email_notifications: true,
				},
			]);
			prefsCache.close();

			// Refresh simulation
			const refreshCache = new IDBPersister<TestPrefs>({
				storageKey: `electric:user_preferences_${userId}:${userId}`,
				userId: userId,
			});

			const cachedPrefs = await refreshCache.load();
			expect(cachedPrefs).toHaveLength(1);
			expect(cachedPrefs[0].name).toBe("Test User");
			expect(cachedPrefs[0].email_notifications).toBe(true);

			refreshCache.close();
		});

		it("widget configs are available instantly on refresh", async () => {
			const userId = "widget-test-user";
			type TestWidget = { id: string; type: string; config: object };

			// Initial sync
			const widgetCache = new IDBPersister<TestWidget>({
				storageKey: `electric:widget_configs_${userId}:${userId}`,
				userId: userId,
			});

			await widgetCache.save([
				{ id: "w1", type: "alertbox", config: { theme: "dark" } },
				{ id: "w2", type: "chat", config: { fontSize: 14 } },
			]);
			widgetCache.close();

			// Refresh simulation
			const refreshCache = new IDBPersister<TestWidget>({
				storageKey: `electric:widget_configs_${userId}:${userId}`,
				userId: userId,
			});

			const cachedWidgets = await refreshCache.load();
			expect(cachedWidgets).toHaveLength(2);
			expect(cachedWidgets.map((w) => w.type).sort()).toEqual([
				"alertbox",
				"chat",
			]);

			refreshCache.close();
		});
	});

	describe("cache invalidation scenarios", () => {
		it("respects maxAge for stale data on refresh", async () => {
			const userId = "stale-test";
			type TestItem = { id: string };

			// Create cache with short maxAge
			const cache = new IDBPersister<TestItem>({
				storageKey: `electric:data_${userId}:${userId}`,
				userId: userId,
				maxAge: 50, // 50ms
			});

			await cache.save([{ id: "1" }]);
			cache.close();

			// Wait for cache to become stale
			await new Promise((r) => setTimeout(r, 100));

			// Refresh - should get empty (stale data evicted)
			const refreshCache = new IDBPersister<TestItem>({
				storageKey: `electric:data_${userId}:${userId}`,
				userId: userId,
				maxAge: 50,
			});

			const staleData = await refreshCache.load();
			expect(staleData).toHaveLength(0);

			refreshCache.close();
		});

		it("version change invalidates cache on refresh", async () => {
			const userId = "version-test";
			type TestItem = { id: string };

			// Save with version 1
			const v1Cache = new IDBPersister<TestItem>({
				storageKey: `electric:data_${userId}:${userId}`,
				userId: userId,
				version: 1,
			});

			await v1Cache.save([{ id: "old-data" }]);
			v1Cache.close();

			// App updates, now using version 2
			const v2Cache = new IDBPersister<TestItem>({
				storageKey: `electric:data_${userId}:${userId}`,
				userId: userId,
				version: 2,
			});

			const cachedData = await v2Cache.load();
			expect(cachedData).toHaveLength(0); // Version mismatch, data evicted

			v2Cache.close();
		});

		it("user switch clears previous user data from view", async () => {
			type TestItem = { id: string; secret: string };

			// User A logs in
			const userACache = new IDBPersister<TestItem>({
				storageKey: "electric:data:userA",
				userId: "userA",
			});
			await userACache.save([{ id: "1", secret: "user-a-secret" }]);
			userACache.close();

			// User A logs out, User B logs in
			// User B's cache is separate
			const userBCache = new IDBPersister<TestItem>({
				storageKey: "electric:data:userB",
				userId: "userB",
			});

			const userBData = await userBCache.load();
			expect(userBData).toHaveLength(0); // User B doesn't see User A's data

			userBCache.close();
		});
	});

	describe("data integrity on refresh", () => {
		it("preserves complex nested data structures through cache cycle", async () => {
			const userId = "complex-data-test";
			type ComplexItem = {
				id: string;
				config: {
					nested: {
						array: number[];
						object: { key: string };
					};
				};
			};

			const cache = new IDBPersister<ComplexItem>({
				storageKey: `electric:complex_${userId}:${userId}`,
				userId: userId,
			});

			const originalData: ComplexItem[] = [
				{
					id: "1",
					config: {
						nested: {
							array: [1, 2, 3, 4, 5],
							object: { key: "value" },
						},
					},
				},
			];

			await cache.save(originalData);
			cache.close();

			// Refresh
			const refreshCache = new IDBPersister<ComplexItem>({
				storageKey: `electric:complex_${userId}:${userId}`,
				userId: userId,
			});

			const loadedData = await refreshCache.load();
			expect(loadedData).toHaveLength(1);
			expect(loadedData[0].config.nested.array).toEqual([1, 2, 3, 4, 5]);
			expect(loadedData[0].config.nested.object.key).toBe("value");

			refreshCache.close();
		});

		it("handles empty cache gracefully on first visit", async () => {
			const userId = "first-visit";
			type TestItem = { id: string };

			// First visit - no cache exists
			const cache = new IDBPersister<TestItem>({
				storageKey: `electric:data_${userId}:${userId}`,
				userId: userId,
			});

			const firstVisitData = await cache.load();
			expect(firstVisitData).toHaveLength(0);
			expect(cache.isAvailable()).toBe(true);

			cache.close();
		});
	});
});

/**
 * Manual E2E Test Instructions
 *
 * To fully verify the instant load behavior in a real browser:
 *
 * 1. Start the application:
 *    ```bash
 *    just dev
 *    ```
 *
 * 2. Open the app at https://localhost:8594 (or your configured Caddy port)
 *
 * 3. Log in with a test Google account
 *
 * 4. Navigate to the dashboard and wait for data to load
 *
 * 5. Open DevTools (F12) > Application > IndexedDB > streampai-electric-cache
 *    - You should see 'data' and 'metadata' stores
 *    - Check that collections are being saved
 *
 * 6. Refresh the page (Ctrl+R / Cmd+R)
 *
 * 7. Observe in Network tab:
 *    - Dashboard content should appear BEFORE shape sync completes
 *    - Electric requests should still be in-flight when data is visible
 *
 * 8. (Optional) Throttle network to 3G in DevTools to make the difference more visible
 *
 * Expected behavior:
 * - First load: Loading spinner, then data appears after sync
 * - Subsequent loads: Data appears immediately, then may update if server has changes
 */
