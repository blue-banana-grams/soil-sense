const entries = new Map<string, { expiresAt: number; value: Promise<unknown> }>();

// Caches the promise so concurrent callers share one request; failures are not cached.
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = entries.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as Promise<T>;

  const value = load();
  entries.set(key, { expiresAt: Date.now() + ttlMs, value });
  value.catch(() => entries.delete(key));
  return value;
}

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
