/**
 * Persisted Electric Collection Wrapper
 *
 * Extends `electricCollectionOptions` with IndexedDB persistence for instant
 * data loading on page refresh. Implements hydration-first, sync-second pattern.
 *
 * ## How It Works
 *
 * 1. On collection creation, immediately loads cached data from IndexedDB
 * 2. Hydrates collection with cached data (instant ready state!)
 * 3. Starts Electric sync in background
 * 4. On sync complete/update, persists latest data to IndexedDB
 *
 * ## When to Use
 *
 * Use persistence for data that:
 * - Changes infrequently (user preferences, widget configs)
 * - Benefits from instant load on page refresh
 * - Is user-scoped (pass userId for cache isolation)
 *
 * Don't use for:
 * - High-frequency data (chat messages, stream events)
 * - Data where freshness is critical
 *
 * ## Impersonation Support
 *
 * Storage key includes userId: `electric:{collectionId}:{userId}`
 * Each user's cache is isolated, preventing data leaks during admin impersonation.
 *
 * @see {@link clearPersistedCache} to clear cache for a specific collection
 * @see {@link getCacheStats} from electric-cache.ts for debugging
 *
 * @example
 * ```typescript
 * // Before (no persistence)
 * export const livestreamsCollection = createCollection(
 *   electricCollectionOptions<Livestream>({
 *     id: "livestreams",
 *     shapeOptions: { url: `${SHAPES_URL}/livestreams` },
 *     getKey: (item) => item.id,
 *   }),
 * );
 *
 * // After (with persistence)
 * export const livestreamsCollection = createCollection(
 *   persistedElectricCollection<Livestream>({
 *     id: "livestreams",
 *     shapeOptions: { url: `${SHAPES_URL}/livestreams` },
 *     getKey: (item) => item.id,
 *     persist: true,
 *     userId: () => getCurrentUserId(),
 *   }),
 * );
 * ```
 */

import type { Row } from "@electric-sql/client";
import type { Collection, CollectionConfig } from "@tanstack/db";
import {
	type ElectricCollectionConfig,
	type ElectricCollectionUtils,
	electricCollectionOptions,
} from "@tanstack/electric-db-collection";
import { IDBPersister } from "./idb-persister";

/**
 * Return type for persistedElectricCollection (non-schema variant)
 */
type ElectricCollectionOptionsResult<T extends Row<unknown>> = Omit<
	CollectionConfig<T, string | number>,
	"utils"
> & {
	id?: string;
	utils: ElectricCollectionUtils<T>;
	schema?: never;
};

// Default maxAge is 24 hours (in milliseconds)
const DEFAULT_MAX_AGE = 24 * 60 * 60 * 1000;

// Debounce delay for persisting data to IndexedDB after sync commits
const PERSIST_DEBOUNCE_MS = 100;

/**
 * Configuration for persisted Electric collections.
 *
 * Extends standard ElectricCollectionConfig with persistence options.
 *
 * @example
 * ```typescript
 * const config: PersistedElectricConfig<Livestream> = {
 *   id: "livestreams_user123",
 *   shapeOptions: { url: `${SHAPES_URL}/livestreams/user123` },
 *   getKey: (item) => item.id,
 *   persist: true,                    // Enable persistence
 *   userId: () => "user123",          // User-scoped storage
 *   maxAge: 24 * 60 * 60 * 1000,      // 24h expiration (default)
 *   version: 1,                       // Increment to invalidate cache
 * };
 * ```
 */
export interface PersistedElectricConfig<T extends Row<unknown>>
	extends ElectricCollectionConfig<T> {
	/**
	 * Enable persistence to IndexedDB.
	 * When false (default), behaves exactly like electricCollectionOptions.
	 */
	persist?: boolean;

	/**
	 * Storage key override.
	 * Defaults to collection id. Combined with userId to form final key:
	 * `electric:{storageKey}:{userId}` or `electric:{storageKey}` if no userId.
	 */
	storageKey?: string;

	/**
	 * Function to get current user ID for user-scoped persistence.
	 * IMPORTANT: Always provide this for user-scoped data to prevent
	 * cache leakage between users (e.g., during admin impersonation).
	 */
	userId?: () => string | undefined;

	/**
	 * Time in ms before cached data is considered stale.
	 * - Default: 24 hours (24 * 60 * 60 * 1000)
	 * - Set to `null` to never expire (useful for very stable data)
	 * - Shorter values (e.g., 1 hour) for data that may change more frequently
	 */
	maxAge?: number | null;

	/**
	 * Schema version for cache invalidation.
	 * Increment this when the data structure changes to force fresh data.
	 * Defaults to 1.
	 */
	version?: number;
}

/**
 * Internal state for tracking hydration and sync
 */
interface PersistenceState<T> {
	persister: IDBPersister<T>;
	isHydratedFromCache: boolean;
	hasSyncedOnce: boolean;
}

/**
 * Creates Electric collection options with IndexedDB persistence.
 *
 * When persistence is enabled:
 * 1. On collection creation, immediately loads cached data from IndexedDB
 * 2. Hydrates collection with cached data (instant ready state!)
 * 3. Starts Electric sync in background
 * 4. On sync complete/update, persists latest data to IndexedDB
 *
 * Race Condition Handling:
 * - If Electric sync completes before cache load, cache hydration is aborted
 * - Electric sync data always takes precedence over cached data
 * - Commits are debounced (100ms) to avoid excessive IndexedDB writes
 *
 * Fallback Behavior:
 * - If IndexedDB is unavailable (e.g., private browsing), silently falls back
 *   to non-persisted behavior
 * - Cache load failures are logged but don't prevent Electric sync
 *
 * @param config - Configuration including Electric options and persistence settings
 * @returns Collection config that can be passed to createCollection
 *
 * @example
 * ```typescript
 * // User-scoped collection with persistence
 * export function createUserScopedLivestreamsCollection(userId: string) {
 *   return createCollection(
 *     persistedElectricCollection<Livestream>({
 *       id: `livestreams_${userId}`,
 *       shapeOptions: { url: `${SHAPES_URL}/livestreams/${userId}` },
 *       getKey: (item) => item.id,
 *       persist: true,
 *       userId: () => userId,
 *       maxAge: 24 * 60 * 60 * 1000, // 24h (default)
 *     }),
 *   );
 * }
 *
 * // Non-persisted fallback (persist: false or omitted)
 * const collection = persistedElectricCollection<ChatMessage>({
 *   id: "chat_messages",
 *   shapeOptions: { url: `${SHAPES_URL}/chat_messages` },
 *   getKey: (item) => item.id,
 *   // persist: false is implicit
 * });
 * ```
 */
export function persistedElectricCollection<T extends Row<unknown>>(
	config: PersistedElectricConfig<T>,
): ElectricCollectionOptionsResult<T> {
	// If persistence is not enabled, just return normal electric options
	if (!config.persist) {
		return electricCollectionOptions<T>(config);
	}

	// Get the base electric options
	const baseOptions = electricCollectionOptions<T>(config);

	// Get user ID at config time (will be re-evaluated for storage key)
	const getUserId = config.userId;
	const resolveUserId = () => getUserId?.();

	// Generate storage key with user scope
	const getStorageKey = (): string => {
		const baseKey = config.storageKey || config.id;
		const userId = resolveUserId();
		return userId ? `electric:${baseKey}:${userId}` : `electric:${baseKey}`;
	};

	// Determine maxAge - use default if not specified, null means never expire
	const maxAge = config.maxAge === undefined ? DEFAULT_MAX_AGE : config.maxAge;

	// Track persistence state per collection instance
	const createPersistenceState = (): PersistenceState<T> => {
		return {
			persister: new IDBPersister<T>({
				storageKey: getStorageKey(),
				maxAge: maxAge,
				userId: resolveUserId(),
				version: config.version ?? 1,
			}),
			isHydratedFromCache: false,
			hasSyncedOnce: false,
		};
	};

	// Get the original sync function
	const originalSync = baseOptions.sync;
	if (!originalSync) {
		throw new Error(
			"[persistedElectricCollection] Base electric options missing sync config",
		);
	}

	// Create enhanced sync config
	const enhancedSync: CollectionConfig<T, string | number>["sync"] = {
		...originalSync,
		sync: (params) => {
			const { collection, begin, write, commit, markReady } = params;
			const state = createPersistenceState();

			// Start async hydration from cache
			const hydrateFromCache = async () => {
				try {
					const cachedData = await state.persister.load();

					// Double-check hasSyncedOnce before and after loading to prevent race condition
					// where Electric sync completes while we're loading from IndexedDB
					if (cachedData.length > 0 && !state.hasSyncedOnce) {
						console.debug(
							`[persistedElectric] Hydrating ${config.id} with ${cachedData.length} cached items`,
						);

						begin();
						for (const item of cachedData) {
							write({
								type: "insert",
								value: item,
								metadata: { fromCache: true },
							});
						}

						// Final check before committing - abort if Electric sync completed during hydration
						if (state.hasSyncedOnce) {
							console.debug(
								`[persistedElectric] Aborting cache hydration for ${config.id} - Electric sync completed`,
							);
							return;
						}

						commit();
						markReady(); // Instant ready with cached data!
						state.isHydratedFromCache = true;
					}
				} catch (error) {
					console.warn(
						`[persistedElectric] Failed to hydrate ${config.id} from cache:`,
						error,
					);
					// Continue without cache - Electric will sync fresh data
				}
			};

			// Start cache hydration immediately (non-blocking)
			hydrateFromCache();

			// Helper to persist current collection state to IndexedDB
			const persistToCache = async (
				collectionRef: Collection<T, string | number>,
			) => {
				try {
					// Get all current data from collection
					const data = Array.from(collectionRef.values());
					await state.persister.save(data);
				} catch (error) {
					console.warn(
						`[persistedElectric] Failed to persist ${config.id} to cache:`,
						error,
					);
				}
			};

			// Track commits to persist after sync
			let pendingPersist: ReturnType<typeof setTimeout> | null = null;

			// Wrap commit to persist after sync updates
			const wrappedCommit = () => {
				commit();
				state.hasSyncedOnce = true;

				// Debounce persistence to avoid excessive writes during rapid updates
				if (pendingPersist) {
					clearTimeout(pendingPersist);
				}
				pendingPersist = setTimeout(() => {
					persistToCache(collection);
					pendingPersist = null;
				}, PERSIST_DEBOUNCE_MS);
			};

			// Call original sync with wrapped commit
			const result = originalSync.sync({
				...params,
				commit: wrappedCommit,
			});

			// Return cleanup that also clears pending persist
			if (typeof result === "function") {
				return () => {
					if (pendingPersist) {
						clearTimeout(pendingPersist);
					}
					state.persister.close();
					result();
				};
			}

			if (result && typeof result === "object") {
				return {
					...result,
					cleanup: () => {
						if (pendingPersist) {
							clearTimeout(pendingPersist);
						}
						state.persister.close();
						result.cleanup?.();
					},
				};
			}

			// No cleanup returned, just close persister on collection cleanup
			return {
				cleanup: () => {
					if (pendingPersist) {
						clearTimeout(pendingPersist);
					}
					state.persister.close();
				},
			};
		},
	};

	// Return enhanced options with persisted sync
	return {
		...baseOptions,
		sync: enhancedSync,
	} as ElectricCollectionOptionsResult<T>;
}

/**
 * Clear persisted cache for a specific collection.
 *
 * Use this to manually invalidate cached data when:
 * - User logs out (clear their user-scoped cache)
 * - Data is known to be stale
 * - Troubleshooting cache-related issues
 *
 * @param collectionId - The collection ID or storage key (e.g., "livestreams")
 * @param userId - Optional user ID for user-scoped cache. If provided, clears
 *                 `electric:{collectionId}:{userId}`. If omitted, clears
 *                 `electric:{collectionId}`.
 *
 * @example
 * ```typescript
 * // Clear specific user's livestreams cache
 * await clearPersistedCache("livestreams", "user-123");
 *
 * // Clear non-user-scoped cache
 * await clearPersistedCache("global_settings");
 *
 * // Clear all cache for a user on logout
 * import { clearPersistedCache as clearAll } from "~/lib/electric-cache";
 * await clearAll("user-123"); // Different function - clears ALL user's cache
 * ```
 */
export async function clearPersistedCache(
	collectionId: string,
	userId?: string,
): Promise<void> {
	const storageKey = userId
		? `electric:${collectionId}:${userId}`
		: `electric:${collectionId}`;

	const persister = new IDBPersister({ storageKey });
	await persister.clear();
	persister.close();
}
