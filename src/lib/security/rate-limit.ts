/**
 * Fixed-window, in-process attempt counter used to slow down password guessing
 * on the credentials login.
 *
 * Caveat worth knowing: serverless instances do not share memory, so this
 * throttles one instance at a time. It is a speed bump that costs zero database
 * reads (important while the Neon quota is tight), not a distributed limiter.
 * If the plant ever needs a hard guarantee, move the counter to Postgres or
 * Upstash and keep the same call sites.
 */

type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as unknown as { __novareaAttempts?: Map<string, Bucket> };
const store: Map<string, Bucket> = (globalStore.__novareaAttempts ??= new Map());

export const LOGIN_MAX_ATTEMPTS = 8;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export type RateLimitState = { blocked: boolean; retryAfterSeconds: number };

/** Read-only check — call it before verifying the password. */
export function checkAttempts(key: string, limit = LOGIN_MAX_ATTEMPTS): RateLimitState {
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) return { blocked: false, retryAfterSeconds: 0 };
  if (bucket.count < limit) return { blocked: false, retryAfterSeconds: 0 };
  return { blocked: true, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
}

/** Call on every rejected credential pair. */
export function registerFailure(key: string, windowMs = LOGIN_WINDOW_MS): void {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    bucket.count += 1;
  }

  // Opportunistic pruning so a flood of distinct usernames cannot grow the map
  // without bound.
  if (store.size > 5000) {
    for (const [k, b] of store) {
      if (b.resetAt <= now) store.delete(k);
    }
  }
}

/** Call on a successful login so a legitimate user is never left throttled. */
export function clearAttempts(key: string): void {
  store.delete(key);
}
