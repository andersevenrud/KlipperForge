import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/queries/cache", () => ({
  getCachedBuild: vi.fn(),
  storeCachedBuild: vi.fn(),
  getCacheSize: vi.fn(() => 0),
  getCacheSizeBytes: vi.fn(() => 0),
  evictByKlipperCommit: vi.fn(() => 0),
  evictByTtl: vi.fn(() => 0),
  evictLeastRecentlyAccessed: vi.fn(() => 0),
}));

vi.mock("../services/klipper-source", () => ({
  getKlipperCommit: vi.fn(() => "abc123def456"),
}));

vi.mock("../config", () => ({
  config: {
    disableCache: false,
    cacheEvictStaleCommits: true,
    cacheTtlSeconds: 604_800,
    cacheMaxEntries: 500,
    cacheMaxSizeMb: 200,
  },
}));

import { config } from "../config";
import {
  evictByKlipperCommit,
  evictByTtl,
  evictLeastRecentlyAccessed,
  getCacheSize,
  getCacheSizeBytes,
} from "../db/queries/cache";
import { runCacheEviction } from "../services/cache";
import { getKlipperCommit } from "../services/klipper-source";

describe("runCacheEviction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when cache is disabled", () => {
    vi.mocked(config).disableCache = true;

    runCacheEviction();

    expect(evictByKlipperCommit).not.toHaveBeenCalled();
    expect(evictByTtl).not.toHaveBeenCalled();

    vi.mocked(config).disableCache = false;
  });

  it("evicts stale Klipper commits", () => {
    vi.mocked(evictByKlipperCommit).mockReturnValue(3);

    runCacheEviction();

    expect(evictByKlipperCommit).toHaveBeenCalledWith("abc123def456");
  });

  it("skips stale commit eviction when disabled", () => {
    vi.mocked(config).cacheEvictStaleCommits = false;

    runCacheEviction();

    expect(evictByKlipperCommit).not.toHaveBeenCalled();

    vi.mocked(config).cacheEvictStaleCommits = true;
  });

  it("skips stale commit eviction when no commit available", () => {
    vi.mocked(getKlipperCommit).mockReturnValue(null);

    runCacheEviction();

    expect(evictByKlipperCommit).not.toHaveBeenCalled();
  });

  it("evicts entries past TTL", () => {
    vi.mocked(evictByTtl).mockReturnValue(2);

    runCacheEviction();

    expect(evictByTtl).toHaveBeenCalledWith(604_800);
  });

  it("skips TTL eviction when TTL is 0", () => {
    vi.mocked(config).cacheTtlSeconds = 0;

    runCacheEviction();

    expect(evictByTtl).not.toHaveBeenCalled();

    vi.mocked(config).cacheTtlSeconds = 604_800;
  });

  it("enforces max entry count via LRU", () => {
    vi.mocked(getCacheSize).mockReturnValue(600);
    vi.mocked(evictLeastRecentlyAccessed).mockReturnValue(100);

    runCacheEviction();

    expect(evictLeastRecentlyAccessed).toHaveBeenCalledWith(500);
  });

  it("skips entry count enforcement when under limit", () => {
    vi.mocked(getCacheSize).mockReturnValue(100);

    runCacheEviction();

    // evictLeastRecentlyAccessed should not be called for count enforcement
    // (it may be called for size enforcement, so check the first call args)
    const calls = vi.mocked(evictLeastRecentlyAccessed).mock.calls;
    const countEnforcementCall = calls.find(([target]) => target === 500);
    expect(countEnforcementCall).toBeUndefined();
  });

  it("enforces max size via LRU with average blob estimate", () => {
    const maxBytes = 200 * 1024 * 1024; // 200MB
    const currentBytes = maxBytes + 50 * 1024 * 1024; // 250MB

    // After count check, getCacheSize is called again for size check
    vi.mocked(getCacheSize).mockReturnValue(1000);
    vi.mocked(getCacheSizeBytes).mockReturnValue(currentBytes);
    vi.mocked(evictLeastRecentlyAccessed).mockReturnValue(200);

    runCacheEviction();

    // avgSize = 250MB / 1000 = 256KB per entry
    // targetCount = floor(200MB / 256KB) = 800
    expect(evictLeastRecentlyAccessed).toHaveBeenCalledWith(800);
  });

  it("skips size enforcement when under limit", () => {
    vi.mocked(getCacheSize).mockReturnValue(10);
    vi.mocked(getCacheSizeBytes).mockReturnValue(1024); // 1KB total

    runCacheEviction();

    // No LRU eviction calls for either count or size
    expect(evictLeastRecentlyAccessed).not.toHaveBeenCalled();
  });

  it("runs all phases in sequence", () => {
    const callOrder: string[] = [];

    vi.mocked(evictByKlipperCommit).mockImplementation(() => {
      callOrder.push("commit");
      return 1;
    });
    vi.mocked(evictByTtl).mockImplementation(() => {
      callOrder.push("ttl");
      return 1;
    });
    vi.mocked(getCacheSize).mockReturnValue(600);
    vi.mocked(getCacheSizeBytes).mockReturnValue(300 * 1024 * 1024);
    vi.mocked(evictLeastRecentlyAccessed).mockImplementation(() => {
      callOrder.push("lru");
      return 1;
    });

    runCacheEviction();

    expect(callOrder[0]).toBe("commit");
    expect(callOrder[1]).toBe("ttl");
    expect(callOrder[2]).toBe("lru"); // count enforcement
    expect(callOrder[3]).toBe("lru"); // size enforcement
  });
});
