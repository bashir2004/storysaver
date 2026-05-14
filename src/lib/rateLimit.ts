/**
 * Rate limiting utility using an in-memory sliding-window counter.
 * Keeps the last N timestamps per key and rejects if the window is full.
 */

interface Window {
  timestamps: number[];
}

const store = new Map<string, Window>();

/**
 * Check whether a key is within the allowed rate.
 * @param key       Unique identifier (e.g. IP address)
 * @param limit     Maximum requests allowed within the window
 * @param windowMs  Window size in milliseconds
 * @returns true if the request is allowed, false if rate-limited
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    store.set(key, entry);
    return false;
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return true;
}

/** Periodically flush stale entries to avoid unbounded memory growth */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.timestamps.every((t) => now - t >= 60_000)) {
      store.delete(key);
    }
  }
}, 5 * 60_000); // every 5 minutes
