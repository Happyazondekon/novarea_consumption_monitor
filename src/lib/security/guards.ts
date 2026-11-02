/**
 * Small, dependency-free guards shared by the middleware, the auth layer and
 * the API routes. Kept free of Prisma/Node imports so the middleware (Edge
 * runtime) can use them too.
 */

export const ROLES = ["ADMINISTRATEUR", "ELECTRICIEN"] as const;
export type Role = (typeof ROLES)[number];

export const CATEGORIES = ["WATER", "POWER"] as const;
export const TIMES_OF_DAY = ["MORNING", "EVENING"] as const;
export const INSTRUCTION_STATUSES = ["PENDING", "DONE"] as const;

/** Super-admin account that must never be reachable through the user-management API. */
export const PROTECTED_USERNAME = "dev_master";

/** Largest photo we accept as a base64 data URL (~1.5 MB of binary). */
export const MAX_PHOTO_CHARS = 2000000;

export function isOneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T
): value is T[number] {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

/**
 * Returns a safe, same-origin redirect target.
 *
 * Anything absolute ("https://evil.com"), protocol-relative ("//evil.com"),
 * backslash-smuggled ("/\evil.com") or containing control characters is
 * rejected, so `?callbackUrl=` can never be turned into an open redirect.
 */
export function safeCallbackUrl(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return fallback;
  }
  return value;
}

/**
 * Parses a meter index. Meters only ever count up, so we reject anything that
 * is not a finite, non-negative number — this is what stops a typo or a crafted
 * request from writing NaN/Infinity into the Consumption maths.
 */
export function parseMeterValue(raw: unknown): number | null {
  const value =
    typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? "").replace(",", "."));
  if (!Number.isFinite(value)) return null;
  if (value < 0 || value > 1e12) return null;
  return value;
}

/** Minimum password policy for accounts created or reset through the admin UI. */
export function validatePassword(
  raw: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof raw !== "string" || raw.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters long" };
  }
  if (raw.length > 200) return { ok: false, error: "Password is too long" };
  return { ok: true, value: raw };
}

/** Trimmed login handle, so "Nicolas " and "Nicolas" cannot coexist. */
export function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length < 3 || value.length > 60) return null;
  if (!/^[A-Za-z0-9._-]+$/.test(value)) return null;
  return value;
}
