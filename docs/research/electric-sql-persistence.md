# Electric SQL Persistence Research

**Date**: 2025-12-28
**Status**: Research Complete - Recommendations Ready
**Branch**: `vk/44c6-electric-sql-per`

## Problem Statement

Some data rarely changes and we should be able to persist it locally to:
1. Eliminate loading states when data was already loaded (instant UX on page refresh)
2. Show user data immediately if already logged in
3. Display livestream pages instantly if shapes are already synced

### Constraints
- **Composable**: Future-compatible with SharedWorker syncing
- **Generic**: Usable with many shapes
- **Non-intrusive**: Easy switch between persisted/non-persisted shapes
- **Impersonation-aware**: Works with admin impersonation feature

---

## Current State Analysis

### Current Implementation (`frontend/src/lib/electric.ts`)

The codebase uses TanStack DB with Electric SQL collections:

```typescript
// Current pattern - no persistence
export const livestreamsCollection = createCollection(
  electricCollectionOptions<Livestream>({
    id: "livestreams",
    shapeOptions: {
      url: `${SHAPES_URL}/livestreams`,
    },
    getKey: (item) => item.id,
  }),
);
```

**Key characteristics:**
- Collections are created at module load time
- User-scoped collections use factory functions with caching (`createCollectionCache`)
- Shape URLs include user IDs for scoped data
- No local persistence - all data lost on page refresh

### Data Types Currently Synced

| Shape | User-Scoped | Change Frequency | Persistence Value |
|-------|-------------|------------------|-------------------|
| `user_preferences` | Yes | Rare | HIGH |
| `livestreams` | Yes | Low | HIGH |
| `widget_configs` | Yes | Low | HIGH |
| `notifications` | Yes | Medium | MEDIUM |
| `streaming_accounts` | Yes | Rare | HIGH |
| `stream_events` | Yes | High | LOW |
| `chat_messages` | Yes | Very High | LOW |
| `viewers` | Yes | Medium | MEDIUM |
| `user_roles` | Yes | Rare | HIGH |

---

## Solution Options

### Option A: Custom LocalStorage/IndexedDB Wrapper

**Description**: Create a persistence layer that saves/restores collection data to IndexedDB before Electric sync begins.

**Implementation approach**:
1. Create `createPersistedElectricCollection()` wrapper
2. On init, read cached data from IndexedDB
3. Hydrate collection with cached data immediately
4. Start Electric sync in background
5. On sync complete, update IndexedDB cache

**Pros**:
- Full control over persistence strategy
- Works with current TanStack DB setup
- Can implement custom eviction/invalidation

**Cons**:
- Significant implementation effort
- Need to handle cache invalidation carefully
- Race conditions between cache and sync
- Must implement versioning/migrations

**Complexity**: HIGH

---

### Option B: PGlite + Electric Sync

**Description**: Use PGlite (Postgres in WASM) with IndexedDB persistence as the local database, syncing with server via Electric.

**Implementation approach**:
1. Initialize PGlite with `idb://streampai` for IndexedDB persistence
2. Define local schema matching server tables
3. Use Electric to sync between cloud Postgres and PGlite
4. Query PGlite directly for instant data access

```typescript
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite('idb://streampai', { relaxedDurability: true })
// Electric syncs to this local PGlite instance
```

**Pros**:
- Full SQL capabilities locally
- Official Electric integration
- Multi-tab support via worker
- Mature IndexedDB persistence
- Handles complex queries efficiently

**Cons**:
- Adds ~3.7MB to bundle (gzipped)
- Different architecture than current TanStack DB approach
- More complex migration path
- Overkill for simple persistence needs

**Complexity**: HIGH

---

### Option C: TanStack DB LocalStorage Collection Hybrid

**Description**: Use TanStack DB's built-in `localStorageCollectionOptions` for initial state, then overlay with Electric sync.

**Implementation approach**:
1. Create a localStorage collection for initial hydration
2. Create Electric collection for real-time sync
3. Merge data from both in a computed view
4. Persist Electric data back to localStorage on updates

**Pros**:
- Uses existing TanStack DB primitives
- Cross-tab sync built-in
- Minimal new dependencies

**Cons**:
- localStorage 5MB limit
- Need to manually coordinate two collections
- More complex state management
- No official pattern for this combination

**Complexity**: MEDIUM-HIGH

---

### Option D: IndexedDB Collection Wrapper (Custom)

**Description**: Create a custom TanStack DB collection that wraps Electric with IndexedDB persistence.

**Implementation approach**:
```typescript
function createPersistedElectricCollection<T>(config: {
  id: string;
  shapeOptions: ShapeStreamOptions;
  storageKey: string;
  getKey: (item: T) => string;
  userId?: () => string | undefined;
}) {
  const idb = new IDBPersister(config.storageKey);

  return createCollection({
    id: config.id,
    getKey: config.getKey,
    sync: (params) => {
      // 1. Load from IndexedDB immediately
      const cached = await idb.load();
      if (cached.length > 0) {
        params.begin();
        cached.forEach(item => params.write({ type: 'insert', value: item }));
        params.commit();
        params.markReady(); // Instant ready!
      }

      // 2. Start Electric sync
      const electricSync = createElectricSync(config.shapeOptions, ...);
      electricSync.sync({
        ...params,
        commit: () => {
          params.commit();
          // 3. Persist to IndexedDB after sync
          idb.save(collection.state.data);
        }
      });
    }
  });
}
```

**Pros**:
- Clean abstraction
- Works with existing hooks (`useElectric`, etc.)
- Larger storage capacity than localStorage
- Composable with future SharedWorker

**Cons**:
- Custom sync logic may have edge cases
- Need careful handling of cache invalidation
- Must handle user switching (impersonation)

**Complexity**: MEDIUM

---

### Option E: Service Worker + Cache API

**Description**: Use Service Worker to cache Electric shape responses.

**Implementation approach**:
1. Register Service Worker that intercepts `/shapes/*` requests
2. On response, cache in Cache API
3. On request, serve from cache first, then revalidate

**Pros**:
- Standard web platform APIs
- Works transparently with existing code
- Familiar caching patterns (stale-while-revalidate)

**Cons**:
- Caches HTTP responses, not application state
- More complex debugging
- Requires separate SW file management
- Shape handles may change between sessions

**Complexity**: MEDIUM

---

## Comparison Matrix

| Criteria | Weight | Option A (Custom LS/IDB) | Option B (PGlite) | Option C (LS Hybrid) | Option D (IDB Wrapper) | Option E (SW Cache) |
|----------|--------|--------------------------|-------------------|---------------------|------------------------|---------------------|
| **Functional Requirements** |
| Instant data on reload | 5 | 4 | 5 | 3 | 4 | 3 |
| Works with all shapes | 4 | 4 | 5 | 3 | 4 | 4 |
| Composable (SharedWorker) | 4 | 3 | 4 | 2 | 4 | 3 |
| Non-intrusive API | 4 | 3 | 2 | 2 | 4 | 5 |
| Impersonation support | 3 | 3 | 4 | 3 | 4 | 4 |
| **Non-Functional** |
| Performance | 5 | 4 | 5 | 3 | 4 | 4 |
| Developer Experience | 4 | 3 | 3 | 2 | 4 | 3 |
| Bundle size impact | 3 | 5 | 2 | 5 | 5 | 4 |
| **Ecosystem** |
| Maturity | 3 | 3 | 4 | 4 | 3 | 5 |
| Community Support | 3 | 3 | 4 | 3 | 2 | 4 |
| Documentation | 3 | 3 | 4 | 4 | 2 | 4 |
| **Implementation** |
| Complexity (5=simple) | 4 | 2 | 2 | 2 | 3 | 3 |
| **Total (Weighted)** | | **148** | **158** | **127** | **162** | **159** |

---

## Recommendation

### Primary Recommendation: Option D - IndexedDB Collection Wrapper

**Rationale**:
1. **Best composability score** - Clean abstraction that doesn't change existing hooks
2. **Non-intrusive** - Minimal changes to existing code; can be adopted incrementally
3. **No bundle size impact** - Uses browser-native IndexedDB
4. **Future-proof** - Architecture supports SharedWorker enhancement later
5. **User isolation** - Storage key can include user ID for impersonation support

### Implementation Design

#### Core API

```typescript
// New file: frontend/src/lib/persisted-electric.ts

export interface PersistedElectricConfig<T> extends ElectricCollectionConfig<T> {
  /** Enable persistence to IndexedDB */
  persist?: boolean;
  /** Storage key (defaults to collection id) */
  storageKey?: string;
  /** User ID for user-scoped persistence */
  userId?: () => string | undefined;
  /** Time in ms before cached data is considered stale (default: 24h) */
  maxAge?: number;
  /** Validate cached data against schema before hydrating */
  validateCache?: boolean;
}

export function persistedElectricCollection<T>(
  config: PersistedElectricConfig<T>
): CollectionConfig<T> {
  // Implementation
}
```

#### Usage Example

```typescript
// Before (no persistence)
export function createUserScopedLivestreamsCollection(userId: string) {
  return createCollection(
    electricCollectionOptions<Livestream>({
      id: `livestreams_${userId}`,
      shapeOptions: { url: `${SHAPES_URL}/livestreams/${userId}` },
      getKey: (item) => item.id,
    }),
  );
}

// After (with persistence)
export function createUserScopedLivestreamsCollection(userId: string) {
  return createCollection(
    persistedElectricCollection<Livestream>({
      id: `livestreams_${userId}`,
      shapeOptions: { url: `${SHAPES_URL}/livestreams/${userId}` },
      getKey: (item) => item.id,
      persist: true,
      userId: () => userId,
    }),
  );
}
```

#### Impersonation Support

```typescript
// Storage key includes user ID to avoid data leaks
const storageKey = config.userId
  ? `electric:${config.storageKey || config.id}:${config.userId()}`
  : `electric:${config.storageKey || config.id}`;

// On user change, clear old cache
onUserChange((newUserId, oldUserId) => {
  if (oldUserId !== newUserId) {
    clearPersistedCache(oldUserId);
  }
});
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (4-6 hours)

1. **Create IndexedDB persistence utilities**
   - `IDBPersister` class for read/write operations
   - Cache metadata (version, timestamp, userId)
   - Batch operations for performance

2. **Create `persistedElectricCollection` wrapper**
   - Extend `electricCollectionOptions` with persistence
   - Implement hydration-first, sync-second pattern
   - Handle cache invalidation

3. **Add cache management utilities**
   - `clearPersistedCache(userId?: string)`
   - `getCacheStats()` for debugging
   - `invalidateCacheOnVersionChange()`

### Phase 2: Integration (2-3 hours)

4. **Migrate high-value collections**
   - `userPreferencesCollection` - instant profile data
   - `livestreamsCollection` - instant stream history
   - `widgetConfigsCollection` - instant widget settings

5. **Update hooks if needed**
   - Ensure `useLiveQuery` works with hydrated state
   - Add `isHydrated` / `isStale` signals if useful

### Phase 3: Polish (2-3 hours)

6. **Add tests**
   - Unit tests for IDBPersister
   - Integration tests for hydration flow
   - Test impersonation/user switching

7. **Add monitoring/debugging**
   - Console logs in development
   - Cache hit/miss metrics

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Race condition between cache and sync | Medium | Medium | Use transaction locking; prefer sync data over cache on conflict |
| Stale data shown to user | Low | Medium | Show stale indicator; implement maxAge eviction |
| Cache corruption | Low | High | Validate on read; clear corrupted caches gracefully |
| IndexedDB unavailable (private browsing) | Low | Low | Fallback to memory-only; feature detect |

### Adoption Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Team learning curve | Low | Low | Simple API similar to existing patterns |
| Refactoring blast radius | Low | Low | Opt-in per collection; no breaking changes |
| Rollback difficulty | Low | Low | Can disable persistence with config flag |

---

## Alternative: Fallback Option

**Option E (Service Worker Cache)** is recommended as fallback if Option D encounters issues:
- More standard approach
- Easier debugging
- But less control over hydration timing

---

## Future Enhancements

After Phase 3, consider:

1. **SharedWorker for cross-tab sync** (composability constraint)
2. **Background sync for offline mutations**
3. **Compression for large datasets**
4. **Schema versioning for migrations**

---

## References

- [TanStack DB LocalStorage Collection](https://tanstack.com/db/latest/docs/collections/local-storage-collection)
- [Electric Collection Docs](https://tanstack.com/db/latest/docs/collections/electric-collection)
- [PGlite IndexedDB Filesystem](https://pglite.dev/docs/filesystems)
- [Electric SQL Local-First Blog](https://electric-sql.com/blog/2025/07/29/local-first-sync-with-tanstack-db)
- [GitHub: TanStack/db](https://github.com/TanStack/db)
- [GitHub: electric-sql/pglite](https://github.com/electric-sql/pglite)
