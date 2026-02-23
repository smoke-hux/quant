const MAX_STORE_SIZE = 10_000;
const store = new Map<string, { count: number; resetAt: number }>();

function cleanup() {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  });

  // Evict oldest entries if store exceeds max size (LRU-like)
  if (store.size > MAX_STORE_SIZE) {
    const keysToDelete = store.size - MAX_STORE_SIZE;
    let deleted = 0;
    store.forEach((_entry, key) => {
      if (deleted < keysToDelete) {
        store.delete(key);
        deleted++;
      }
    });
  }
}

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.limit - 1 };
  }

  entry.count++;
  const allowed = entry.count <= opts.limit;
  const remaining = Math.max(0, opts.limit - entry.count);

  return { allowed, remaining };
}

export function authLimiter(ip: string) {
  return rateLimit(`auth:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
}

export function apiLimiter(ip: string) {
  return rateLimit(`api:${ip}`, { limit: 60, windowMs: 60 * 1000 });
}
