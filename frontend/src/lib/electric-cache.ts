/**
 * Electric SQL Cache Management Utilities
 *
 * Provides debugging and maintenance utilities for managing persisted Electric SQL
 * collection data in IndexedDB.
 *
 * @example
 * ```typescript
 * // Clear specific user's cache (useful for impersonation)
 * await clearPersistedCache('user-123');
 *
 * // Get cache stats for debugging
 * const stats = await getCacheStats();
 * // { collections: 5, totalSize: '2.3MB', oldestEntry: Date, newestEntry: Date }
 *
 * // Clear on app version change
 * await invalidateCacheOnVersionChange('1.2.0');
 *
 * // Nuclear option - clear everything
 * await clearAllElectricCaches();
 * ```
 */

import {
	type CacheMetadata,
	clearAllElectricCache,
	isIndexedDBAvailable,
} from "./idb-persister";

const DB_NAME = "streampai-electric-cache";
const DB_VERSION = 1;
const DATA_STORE = "data";
const METADATA_STORE = "metadata";

const APP_VERSION_KEY = "streampai-electric-cache-version";

export interface CacheStats {
	/** Number of cached collections */
	collections: number;
	/** Human-readable total size estimate */
	totalSize: string;
	/** Total size in bytes */
	totalSizeBytes: number;
	/** Oldest cache entry timestamp */
	oldestEntry: Date | null;
	/** Newest cache entry timestamp */
	newestEntry: Date | null;
	/** Breakdown by collection */
	collectionDetails: CollectionCacheDetail[];
}

export interface CollectionCacheDetail {
	/** Storage key / collection name */
	name: string;
	/** Number of items in collection */
	itemCount: number;
	/** User ID if user-scoped */
	userId: string | null;
	/** Schema version */
	version: number;
	/** When this collection was last updated */
	lastUpdated: Date;
	/** Estimated size in bytes */
	sizeBytes: number;
	/** Human-readable size */
	size: string;
}

/**
 * Format bytes to human-readable string.
 */
function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/**
 * Estimate the size of a JavaScript object in bytes.
 * Uses JSON serialization for estimation.
 */
function estimateObjectSize(obj: unknown): number {
	try {
		const json = JSON.stringify(obj);
		// UTF-16 characters can be 2 bytes each in memory
		return new Blob([json]).size;
	} catch {
		return 0;
	}
}

/**
 * Open the IndexedDB database.
 * Returns null if IndexedDB is unavailable.
 */
function openDatabase(): Promise<IDBDatabase | null> {
	if (!isIndexedDBAvailable()) {
		return Promise.resolve(null);
	}

	return new Promise((resolve) => {
		try {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				console.warn("[ElectricCache] Error opening database:", request.error);
				resolve(null);
			};

			request.onsuccess = () => {
				resolve(request.result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(DATA_STORE)) {
					db.createObjectStore(DATA_STORE, { keyPath: "storageKey" });
				}
				if (!db.objectStoreNames.contains(METADATA_STORE)) {
					db.createObjectStore(METADATA_STORE, { keyPath: "storageKey" });
				}
			};

			// Timeout for cases where IDB hangs
			setTimeout(() => {
				if (!request.result) {
					console.warn("[ElectricCache] Database open timeout");
					resolve(null);
				}
			}, 3000);
		} catch (error) {
			console.warn("[ElectricCache] Error opening database:", error);
			resolve(null);
		}
	});
}

/**
 * Clear persisted cache for a specific user or all users.
 *
 * @param userId - If provided, only clears cache entries for this user.
 *                 If undefined, clears all cache entries.
 *
 * @example
 * ```typescript
 * // Clear all cache
 * await clearPersistedCache();
 *
 * // Clear only user's cache (useful after impersonation)
 * await clearPersistedCache('user-123');
 * ```
 */
export async function clearPersistedCache(userId?: string): Promise<void> {
	if (!userId) {
		// Clear all - delegate to existing function
		await clearAllElectricCache();
		return;
	}

	const db = await openDatabase();
	if (!db) {
		return;
	}

	return new Promise((resolve, reject) => {
		try {
			// First, get all metadata to find entries for this user
			const readTx = db.transaction([METADATA_STORE], "readonly");
			const metadataStore = readTx.objectStore(METADATA_STORE);
			const getAllRequest = metadataStore.getAll();

			getAllRequest.onsuccess = () => {
				const allMetadata = getAllRequest.result as CacheMetadata[];
				const userEntries = allMetadata.filter((m) => m.userId === userId);

				if (userEntries.length === 0) {
					db.close();
					resolve();
					return;
				}

				// Delete entries for this user
				const writeTx = db.transaction(
					[DATA_STORE, METADATA_STORE],
					"readwrite",
				);
				const dataStore = writeTx.objectStore(DATA_STORE);
				const mdStore = writeTx.objectStore(METADATA_STORE);

				for (const entry of userEntries) {
					dataStore.delete(entry.storageKey);
					mdStore.delete(entry.storageKey);
				}

				writeTx.oncomplete = () => {
					console.debug(
						`[ElectricCache] Cleared ${userEntries.length} cache entries for user ${userId}`,
					);
					db.close();
					resolve();
				};

				writeTx.onerror = () => {
					console.warn(
						"[ElectricCache] Error clearing user cache:",
						writeTx.error,
					);
					db.close();
					reject(writeTx.error);
				};
			};

			getAllRequest.onerror = () => {
				console.warn(
					"[ElectricCache] Error reading metadata:",
					getAllRequest.error,
				);
				db.close();
				reject(getAllRequest.error);
			};
		} catch (error) {
			console.warn("[ElectricCache] clearPersistedCache error:", error);
			db.close();
			reject(error);
		}
	});
}

/**
 * Get comprehensive cache statistics for debugging.
 *
 * @returns Cache stats including collection count, sizes, and timestamps.
 *
 * @example
 * ```typescript
 * const stats = await getCacheStats();
 * console.log(`Collections: ${stats.collections}`);
 * console.log(`Total size: ${stats.totalSize}`);
 * console.log(`Oldest entry: ${stats.oldestEntry}`);
 *
 * // List all collections
 * for (const collection of stats.collectionDetails) {
 *   console.log(`${collection.name}: ${collection.itemCount} items (${collection.size})`);
 * }
 * ```
 */
export async function getCacheStats(): Promise<CacheStats> {
	const emptyStats: CacheStats = {
		collections: 0,
		totalSize: "0 B",
		totalSizeBytes: 0,
		oldestEntry: null,
		newestEntry: null,
		collectionDetails: [],
	};

	const db = await openDatabase();
	if (!db) {
		return emptyStats;
	}

	return new Promise((resolve) => {
		try {
			const tx = db.transaction([DATA_STORE, METADATA_STORE], "readonly");
			const dataStore = tx.objectStore(DATA_STORE);
			const metadataStore = tx.objectStore(METADATA_STORE);

			const metadataRequest = metadataStore.getAll();
			const dataRequest = dataStore.getAll();

			let metadata: CacheMetadata[] = [];
			let data: Array<{ storageKey: string; items: unknown[] }> = [];
			let metadataLoaded = false;
			let dataLoaded = false;

			const processResults = () => {
				if (!metadataLoaded || !dataLoaded) return;

				const dataMap = new Map(data.map((d) => [d.storageKey, d.items]));
				let totalSizeBytes = 0;
				let oldestTimestamp: number | null = null;
				let newestTimestamp: number | null = null;

				const collectionDetails: CollectionCacheDetail[] = metadata.map((m) => {
					const items = dataMap.get(m.storageKey) || [];
					const sizeBytes = estimateObjectSize(items);
					totalSizeBytes += sizeBytes;

					if (oldestTimestamp === null || m.timestamp < oldestTimestamp) {
						oldestTimestamp = m.timestamp;
					}
					if (newestTimestamp === null || m.timestamp > newestTimestamp) {
						newestTimestamp = m.timestamp;
					}

					return {
						name: m.storageKey,
						itemCount: m.itemCount,
						userId: m.userId,
						version: m.version,
						lastUpdated: new Date(m.timestamp),
						sizeBytes,
						size: formatBytes(sizeBytes),
					};
				});

				// Sort by last updated, newest first
				collectionDetails.sort(
					(a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime(),
				);

				const stats: CacheStats = {
					collections: metadata.length,
					totalSize: formatBytes(totalSizeBytes),
					totalSizeBytes,
					oldestEntry: oldestTimestamp ? new Date(oldestTimestamp) : null,
					newestEntry: newestTimestamp ? new Date(newestTimestamp) : null,
					collectionDetails,
				};

				db.close();
				resolve(stats);
			};

			metadataRequest.onsuccess = () => {
				metadata = metadataRequest.result;
				metadataLoaded = true;
				processResults();
			};

			dataRequest.onsuccess = () => {
				data = dataRequest.result;
				dataLoaded = true;
				processResults();
			};

			metadataRequest.onerror = () => {
				console.warn(
					"[ElectricCache] Error reading metadata:",
					metadataRequest.error,
				);
				db.close();
				resolve(emptyStats);
			};

			dataRequest.onerror = () => {
				console.warn("[ElectricCache] Error reading data:", dataRequest.error);
				db.close();
				resolve(emptyStats);
			};

			tx.onerror = () => {
				console.warn("[ElectricCache] Transaction error:", tx.error);
				db.close();
				resolve(emptyStats);
			};
		} catch (error) {
			console.warn("[ElectricCache] getCacheStats error:", error);
			db.close();
			resolve(emptyStats);
		}
	});
}

/**
 * Invalidate cache when the app version changes.
 * Uses localStorage to track the last known version.
 *
 * @param currentVersion - Current app version (e.g., '1.2.0')
 * @returns true if cache was invalidated, false otherwise
 *
 * @example
 * ```typescript
 * // Call on app startup
 * const wasInvalidated = await invalidateCacheOnVersionChange('1.2.0');
 * if (wasInvalidated) {
 *   console.log('Cache was cleared due to version change');
 * }
 * ```
 */
export async function invalidateCacheOnVersionChange(
	currentVersion: string,
): Promise<boolean> {
	if (typeof localStorage === "undefined") {
		return false;
	}

	try {
		const storedVersion = localStorage.getItem(APP_VERSION_KEY);

		if (storedVersion === currentVersion) {
			// Same version, no invalidation needed
			return false;
		}

		if (storedVersion !== null) {
			// Version changed, clear cache
			console.debug(
				`[ElectricCache] App version changed from ${storedVersion} to ${currentVersion}, clearing cache`,
			);
			await clearAllElectricCache();
		}

		// Store current version
		localStorage.setItem(APP_VERSION_KEY, currentVersion);

		return storedVersion !== null;
	} catch (error) {
		console.warn(
			"[ElectricCache] invalidateCacheOnVersionChange error:",
			error,
		);
		return false;
	}
}

/**
 * Nuclear option: Clear all Electric SQL caches.
 * Deletes the entire IndexedDB database.
 *
 * Use this for troubleshooting or when cache corruption is suspected.
 *
 * @example
 * ```typescript
 * // Called from dev tools or troubleshooting UI
 * await clearAllElectricCaches();
 * console.log('All caches cleared, please refresh');
 * ```
 */
export async function clearAllElectricCaches(): Promise<void> {
	await clearAllElectricCache();

	// Also clear version tracking
	if (typeof localStorage !== "undefined") {
		try {
			localStorage.removeItem(APP_VERSION_KEY);
		} catch {
			// Ignore localStorage errors
		}
	}

	console.debug("[ElectricCache] All Electric caches cleared (nuclear option)");
}

// Re-export types for convenience
export type { CacheMetadata } from "./idb-persister";

// Re-export existing utilities
export { getElectricCacheStats, isIndexedDBAvailable } from "./idb-persister";
