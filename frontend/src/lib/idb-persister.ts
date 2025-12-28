/**
 * IDBPersister - IndexedDB persistence utility for Electric SQL collection data.
 *
 * Provides typed read/write operations for storing collection data in IndexedDB
 * with metadata tracking (version, timestamp, userId) and graceful fallback
 * when IndexedDB is unavailable (e.g., private browsing).
 *
 * @example
 * ```typescript
 * const persister = new IDBPersister<Livestream>({
 *   storageKey: 'livestreams_user123',
 *   maxAge: 24 * 60 * 60 * 1000, // 24h
 * });
 *
 * const cached = await persister.load();
 * await persister.save(collection.state.data);
 * await persister.clear();
 * ```
 */

const DB_NAME = "streampai-electric-cache";
const DB_VERSION = 1;
const DATA_STORE = "data";
const METADATA_STORE = "metadata";

export interface IDBPersisterConfig {
	/** Unique key to identify this persisted collection */
	storageKey: string;
	/** Maximum age in ms before cached data is considered stale (default: 24h) */
	maxAge?: number;
	/** User ID for user-scoped cache isolation */
	userId?: string;
	/** Schema version - change to invalidate existing cache */
	version?: number;
}

export interface CacheMetadata {
	storageKey: string;
	timestamp: number;
	userId: string | null;
	version: number;
	itemCount: number;
}

interface StoredData<T> {
	storageKey: string;
	items: T[];
}

interface StoredMetadata {
	storageKey: string;
	timestamp: number;
	userId: string | null;
	version: number;
	itemCount: number;
}

/**
 * Check if IndexedDB is available in the current environment.
 * Returns false in SSR, private browsing mode, or unsupported browsers.
 */
export function isIndexedDBAvailable(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	if (typeof indexedDB === "undefined") {
		return false;
	}
	// Test actual availability (Safari private mode, etc.)
	try {
		// Simple availability check - actual open test done in init
		return true;
	} catch {
		return false;
	}
}

/**
 * Generic IndexedDB persister for collection data.
 * Handles read/write operations with metadata tracking and graceful fallback.
 */
export class IDBPersister<T> {
	private readonly storageKey: string;
	private readonly maxAge: number;
	private readonly userId: string | null;
	private readonly version: number;

	private db: IDBDatabase | null = null;
	private initPromise: Promise<boolean> | null = null;
	private available = true;

	constructor(config: IDBPersisterConfig) {
		this.storageKey = config.storageKey;
		this.maxAge = config.maxAge ?? 24 * 60 * 60 * 1000; // 24h default
		this.userId = config.userId ?? null;
		this.version = config.version ?? 1;
	}

	/**
	 * Initialize the IndexedDB connection.
	 * Returns true if IndexedDB is available and initialized, false otherwise.
	 */
	private async init(): Promise<boolean> {
		if (this.initPromise) {
			return this.initPromise;
		}

		this.initPromise = this.doInit();
		return this.initPromise;
	}

	private doInit(): Promise<boolean> {
		if (!isIndexedDBAvailable()) {
			this.available = false;
			return Promise.resolve(false);
		}

		return new Promise((resolve) => {
			try {
				const request = indexedDB.open(DB_NAME, DB_VERSION);

				request.onerror = () => {
					console.warn(
						"[IDBPersister] IndexedDB not available:",
						request.error,
					);
					this.available = false;
					resolve(false);
				};

				request.onsuccess = () => {
					this.db = request.result;
					this.available = true;

					// Handle connection being closed unexpectedly
					this.db.onclose = () => {
						this.db = null;
						this.initPromise = null;
					};

					this.db.onerror = (event) => {
						console.warn("[IDBPersister] Database error:", event);
					};

					resolve(true);
				};

				request.onupgradeneeded = (event) => {
					const db = (event.target as IDBOpenDBRequest).result;

					// Create data store with storageKey as key
					if (!db.objectStoreNames.contains(DATA_STORE)) {
						db.createObjectStore(DATA_STORE, { keyPath: "storageKey" });
					}

					// Create metadata store with storageKey as key
					if (!db.objectStoreNames.contains(METADATA_STORE)) {
						db.createObjectStore(METADATA_STORE, { keyPath: "storageKey" });
					}
				};

				// Timeout for cases where IDB hangs (Safari private mode)
				setTimeout(() => {
					if (!this.db && this.initPromise !== null) {
						console.warn("[IDBPersister] IndexedDB init timeout");
						this.available = false;
						resolve(false);
					}
				}, 3000);
			} catch (error) {
				console.warn("[IDBPersister] IndexedDB init error:", error);
				this.available = false;
				resolve(false);
			}
		});
	}

	/**
	 * Check if the persister is available (IndexedDB accessible).
	 */
	isAvailable(): boolean {
		return this.available;
	}

	/**
	 * Load cached data from IndexedDB.
	 * Returns empty array if:
	 * - IndexedDB unavailable
	 * - No cached data exists
	 * - Cache is stale (older than maxAge)
	 * - Cache version mismatch
	 * - Cache userId mismatch
	 */
	async load(): Promise<T[]> {
		const initialized = await this.init();
		if (!initialized || !this.db) {
			return [];
		}

		// Capture db reference to avoid null check issues in callbacks
		const db = this.db;

		return new Promise((resolve) => {
			try {
				const transaction = db.transaction(
					[DATA_STORE, METADATA_STORE],
					"readonly",
				);

				const dataStore = transaction.objectStore(DATA_STORE);
				const metadataStore = transaction.objectStore(METADATA_STORE);

				const metadataRequest = metadataStore.get(this.storageKey);

				metadataRequest.onsuccess = () => {
					const metadata = metadataRequest.result as StoredMetadata | undefined;

					// Validate metadata
					if (!metadata) {
						resolve([]);
						return;
					}

					// Check version match
					if (metadata.version !== this.version) {
						console.debug(
							`[IDBPersister] Version mismatch for ${this.storageKey}: cached=${metadata.version}, expected=${this.version}`,
						);
						resolve([]);
						return;
					}

					// Check userId match
					if (metadata.userId !== this.userId) {
						console.debug(
							`[IDBPersister] User mismatch for ${this.storageKey}: cached=${metadata.userId}, expected=${this.userId}`,
						);
						resolve([]);
						return;
					}

					// Check staleness
					const age = Date.now() - metadata.timestamp;
					if (age > this.maxAge) {
						console.debug(
							`[IDBPersister] Cache stale for ${this.storageKey}: age=${age}ms, maxAge=${this.maxAge}ms`,
						);
						resolve([]);
						return;
					}

					// Metadata is valid, load data
					const dataRequest = dataStore.get(this.storageKey);

					dataRequest.onsuccess = () => {
						const storedData = dataRequest.result as StoredData<T> | undefined;
						if (storedData?.items) {
							console.debug(
								`[IDBPersister] Loaded ${storedData.items.length} items for ${this.storageKey}`,
							);
							resolve(storedData.items);
						} else {
							resolve([]);
						}
					};

					dataRequest.onerror = () => {
						console.warn(
							"[IDBPersister] Error loading data:",
							dataRequest.error,
						);
						resolve([]);
					};
				};

				metadataRequest.onerror = () => {
					console.warn(
						"[IDBPersister] Error loading metadata:",
						metadataRequest.error,
					);
					resolve([]);
				};

				transaction.onerror = () => {
					console.warn("[IDBPersister] Transaction error:", transaction.error);
					resolve([]);
				};
			} catch (error) {
				console.warn("[IDBPersister] Load error:", error);
				resolve([]);
			}
		});
	}

	/**
	 * Save data to IndexedDB with metadata.
	 * Silently fails if IndexedDB is unavailable.
	 */
	async save(data: T[]): Promise<void> {
		const initialized = await this.init();
		if (!initialized || !this.db) {
			return;
		}

		// Capture db reference to avoid null check issues in callbacks
		const db = this.db;

		return new Promise((resolve, reject) => {
			try {
				const transaction = db.transaction(
					[DATA_STORE, METADATA_STORE],
					"readwrite",
				);

				const dataStore = transaction.objectStore(DATA_STORE);
				const metadataStore = transaction.objectStore(METADATA_STORE);

				const storedData: StoredData<T> = {
					storageKey: this.storageKey,
					items: data,
				};

				const storedMetadata: StoredMetadata = {
					storageKey: this.storageKey,
					timestamp: Date.now(),
					userId: this.userId,
					version: this.version,
					itemCount: data.length,
				};

				dataStore.put(storedData);
				metadataStore.put(storedMetadata);

				transaction.oncomplete = () => {
					console.debug(
						`[IDBPersister] Saved ${data.length} items for ${this.storageKey}`,
					);
					resolve();
				};

				transaction.onerror = () => {
					console.warn("[IDBPersister] Save error:", transaction.error);
					reject(transaction.error);
				};
			} catch (error) {
				console.warn("[IDBPersister] Save error:", error);
				reject(error);
			}
		});
	}

	/**
	 * Clear cached data for this storage key.
	 */
	async clear(): Promise<void> {
		const initialized = await this.init();
		if (!initialized || !this.db) {
			return;
		}

		// Capture db reference to avoid null check issues in callbacks
		const db = this.db;

		return new Promise((resolve, reject) => {
			try {
				const transaction = db.transaction(
					[DATA_STORE, METADATA_STORE],
					"readwrite",
				);

				const dataStore = transaction.objectStore(DATA_STORE);
				const metadataStore = transaction.objectStore(METADATA_STORE);

				dataStore.delete(this.storageKey);
				metadataStore.delete(this.storageKey);

				transaction.oncomplete = () => {
					console.debug(`[IDBPersister] Cleared cache for ${this.storageKey}`);
					resolve();
				};

				transaction.onerror = () => {
					console.warn("[IDBPersister] Clear error:", transaction.error);
					reject(transaction.error);
				};
			} catch (error) {
				console.warn("[IDBPersister] Clear error:", error);
				reject(error);
			}
		});
	}

	/**
	 * Get metadata about the cached data (if available).
	 * Returns null if no cache exists or is invalid.
	 */
	async getMetadata(): Promise<CacheMetadata | null> {
		const initialized = await this.init();
		if (!initialized || !this.db) {
			return null;
		}

		// Capture db reference to avoid null check issues in callbacks
		const db = this.db;

		return new Promise((resolve) => {
			try {
				const transaction = db.transaction([METADATA_STORE], "readonly");
				const metadataStore = transaction.objectStore(METADATA_STORE);
				const request = metadataStore.get(this.storageKey);

				request.onsuccess = () => {
					const metadata = request.result as StoredMetadata | undefined;
					if (metadata) {
						resolve({
							storageKey: metadata.storageKey,
							timestamp: metadata.timestamp,
							userId: metadata.userId,
							version: metadata.version,
							itemCount: metadata.itemCount,
						});
					} else {
						resolve(null);
					}
				};

				request.onerror = () => {
					console.warn("[IDBPersister] Error getting metadata:", request.error);
					resolve(null);
				};
			} catch (error) {
				console.warn("[IDBPersister] getMetadata error:", error);
				resolve(null);
			}
		});
	}

	/**
	 * Close the database connection.
	 */
	close(): void {
		if (this.db) {
			this.db.close();
			this.db = null;
			this.initPromise = null;
		}
	}
}

/**
 * Clear all Electric cache data from IndexedDB.
 * Useful for logout or cache invalidation.
 */
export async function clearAllElectricCache(): Promise<void> {
	if (!isIndexedDBAvailable()) {
		return;
	}

	return new Promise((resolve, reject) => {
		try {
			const request = indexedDB.deleteDatabase(DB_NAME);

			request.onsuccess = () => {
				console.debug("[IDBPersister] All Electric cache cleared");
				resolve();
			};

			request.onerror = () => {
				console.warn("[IDBPersister] Error clearing all cache:", request.error);
				reject(request.error);
			};
		} catch (error) {
			console.warn("[IDBPersister] clearAllElectricCache error:", error);
			reject(error);
		}
	});
}

/**
 * Get cache statistics for all stored collections.
 * Useful for debugging and monitoring.
 */
export async function getElectricCacheStats(): Promise<CacheMetadata[]> {
	if (!isIndexedDBAvailable()) {
		return [];
	}

	return new Promise((resolve) => {
		try {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				resolve([]);
			};

			request.onsuccess = () => {
				const db = request.result;

				try {
					const transaction = db.transaction([METADATA_STORE], "readonly");
					const metadataStore = transaction.objectStore(METADATA_STORE);
					const getAllRequest = metadataStore.getAll();

					getAllRequest.onsuccess = () => {
						const metadata = getAllRequest.result as StoredMetadata[];
						db.close();
						resolve(
							metadata.map((m) => ({
								storageKey: m.storageKey,
								timestamp: m.timestamp,
								userId: m.userId,
								version: m.version,
								itemCount: m.itemCount,
							})),
						);
					};

					getAllRequest.onerror = () => {
						db.close();
						resolve([]);
					};
				} catch {
					db.close();
					resolve([]);
				}
			};

			request.onupgradeneeded = (event) => {
				// If upgrade is needed, database is empty
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(DATA_STORE)) {
					db.createObjectStore(DATA_STORE, { keyPath: "storageKey" });
				}
				if (!db.objectStoreNames.contains(METADATA_STORE)) {
					db.createObjectStore(METADATA_STORE, { keyPath: "storageKey" });
				}
			};
		} catch (error) {
			console.warn("[IDBPersister] getElectricCacheStats error:", error);
			resolve([]);
		}
	});
}
