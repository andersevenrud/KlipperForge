import { config } from "../config";
import {
  evictByKlipperCommit,
  evictByTtl,
  evictLeastRecentlyAccessed,
  getCachedBuild,
  getCacheSize,
  getCacheSizeBytes,
  storeCachedBuild,
} from "../db/queries/cache";
import type { CachedBuildResult } from "../types";
import { getKlipperCommit } from "./klipper-source";

export function lookupCache(cacheKey: string): CachedBuildResult | null {
  return getCachedBuild(cacheKey);
}

export function storeInCache(cacheKey: string, blob: Uint8Array, filename: string, boardId: string): void {
  storeCachedBuild(cacheKey, blob, filename, boardId);
}

export function runCacheEviction(): void {
  if (config.disableCache) return;

  let totalEvicted = 0;

  // Phase 1: Evict entries for old Klipper commits (guaranteed dead)
  if (config.cacheEvictStaleCommits) {
    const currentCommit = getKlipperCommit();
    if (currentCommit) {
      const evicted = evictByKlipperCommit(currentCommit);
      if (evicted > 0) {
        console.log(`[cache] Evicted ${evicted} entries for stale Klipper commits`);
        totalEvicted += evicted;
      }
    }
  }

  // Phase 2: Evict entries older than TTL
  if (config.cacheTtlSeconds > 0) {
    const evicted = evictByTtl(config.cacheTtlSeconds);
    if (evicted > 0) {
      console.log(`[cache] Evicted ${evicted} entries past TTL (${config.cacheTtlSeconds}s)`);
      totalEvicted += evicted;
    }
  }

  // Phase 3: Enforce max entry count (LRU)
  if (config.cacheMaxEntries > 0) {
    const currentCount = getCacheSize();
    if (currentCount > config.cacheMaxEntries) {
      const evicted = evictLeastRecentlyAccessed(config.cacheMaxEntries);
      if (evicted > 0) {
        console.log(`[cache] Evicted ${evicted} entries to enforce max count (${config.cacheMaxEntries})`);
        totalEvicted += evicted;
      }
    }
  }

  // Phase 4: Enforce max total size (LRU by average blob size estimate)
  if (config.cacheMaxSizeMb > 0) {
    const maxBytes = config.cacheMaxSizeMb * 1024 * 1024;
    const currentBytes = getCacheSizeBytes();
    if (currentBytes > maxBytes) {
      const count = getCacheSize();
      if (count > 0) {
        const avgSize = currentBytes / count;
        const targetCount = Math.max(1, Math.floor(maxBytes / avgSize));
        const evicted = evictLeastRecentlyAccessed(targetCount);
        if (evicted > 0) {
          console.log(
            `[cache] Evicted ${evicted} entries to enforce size limit ` +
              `(${(currentBytes / 1024 / 1024).toFixed(1)}MB > ${config.cacheMaxSizeMb}MB)`,
          );
          totalEvicted += evicted;
        }
      }
    }
  }

  if (totalEvicted > 0) {
    console.log(`[cache] Eviction complete: removed ${totalEvicted} total entries`);
  }
}
