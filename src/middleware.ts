import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "./auth.config";
import { ROLES, safeCallbackUrl } from "./lib/security/guards";

const { auth } = NextAuth(authConfig);

/**
 * The single route gate for the app.
 *
 * It lives here rather than in `callbacks.authorized` on purpose. next-auth v5
 * (see node_modules/next-auth/lib/index.js -> handleAuth) runs `authorized`
 * first and, as soon as it returns a Response, it *skips this handler entirely*.
 * With the gate split across both places, any redirect was served without the
 * security headers below, and the two code paths could drift apart. Owning the
 * decision in one function keeps the behaviour obvious and testable.
 *
 * Posture is default-deny: everything is private unless it is listed as public.
 */

/** Paths served to anonymous visitors. */
const PUBLIC_PATHS = [
  "/login",
  "/api/auth", // next-auth's own endpoints — must stay open or nobody can sign in
  "/manifest.json",
  "/sw.js",
  "/service-worker.js",
  "/robots.txt",
];

/** Pages reserved to ADMINISTRATEUR. */
const ADMIN_PAGES = ["/dashboard/events", "/dashboard/reports", "/dashboard/users"];

/**
 * APIs reserved to ADMINISTRATEUR, checked at the edge as defence in depth —
 * each route handler still verifies the session itself.
 * `/api/users` is matched exactly: `/api/users/me` and `/api/users/profile`
 * are legitimately used by technicians.
 */
const ADMIN_API_PREFIXES = ["/api/dashboard", "/api/reports", "/api/notifications/test-mail"];
const ADMIN_API_EXACT = ["/api/users"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isAdminOnly(pathname: string): boolean {
  return (
    ADMIN_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    ADMIN_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    ADMIN_API_EXACT.includes(pathname)
  );
}

function withSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Permissions-Policy", "camera=(self), geolocation=(), microphone=()");

  // 'unsafe-inline'/'unsafe-eval' are still required by the Next.js 14 runtime
  // and by the chart/PDF libraries. Tightening that needs per-request nonces.
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: blob: https:; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "connect-src 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'; " +
      "frame-ancestors 'none'; " +
      "upgrade-insecure-requests;"
  );

  // Never let an authenticated page or the login form sit in a shared or
  // back/forward cache. This is what stops the browser from re-rendering a
  // stale /login (or a dashboard) after sign-in or sign-out: `no-store` also
  // makes the page ineligible for Chrome's back-forward cache.
  if (pathname === "/login" || pathname.startsWith("/dashboard") || pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

function redirect(url: URL, pathname: string): NextResponse {
  return withSecurityHeaders(NextResponse.redirect(url), pathname);
}

function jsonError(status: number, error: string, pathname: string): NextResponse {
  return withSecurityHeaders(NextResponse.json({ error }, { status }), pathname);
}

export default auth((req: NextRequest & { auth: unknown }) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const session = req.auth as { user?: { role?: string } } | null;
  const isLoggedIn = Boolean(session?.user);
  const role = session?.user?.role;
  const isApi = pathname.startsWith("/api/");

  // 1. An authenticated user has no business on the login screen. Combined with
  //    the `no-store` header and the server-side guard in app/login/page.tsx,
  //    this closes the "back button lands on /login while signed in" hole.
  if (pathname === "/login") {
    if (isLoggedIn) {
      return redirect(new URL("/dashboard", nextUrl), pathname);
    }
    return withSecurityHeaders(NextResponse.next(), pathname);
  }

  // 2. Open endpoints (next-auth, PWA assets).
  if (isPublic(pathname)) {
    return withSecurityHeaders(NextResponse.next(), pathname);
  }

  // 3. Default-deny: no session, no access.
  if (!isLoggedIn) {
    if (isApi) return jsonError(401, "Unauthorized", pathname);

    const loginUrl = new URL("/login", nextUrl);
    // Only ever echo back a same-origin path, so ?callbackUrl= cannot be
    // weaponised into an open redirect.
    loginUrl.searchParams.set("callbackUrl", safeCallbackUrl(pathname + nextUrl.search));
    return redirect(loginUrl, pathname);
  }

  // 4. A session whose role is not one we issue is treated as untrusted.
  if (!ROLES.includes(role as (typeof ROLES)[number])) {
    if (isApi) return jsonError(403, "Forbidden", pathname);
    return redirect(new URL("/login", nextUrl), pathname);
  }

  // 5. Role-based access control.
  if (isAdminOnly(pathname) && role !== "ADMINISTRATEUR") {
    if (isApi) return jsonError(403, "Forbidden", pathname);
    return redirect(new URL("/dashboard", nextUrl), pathname);
  }

  return withSecurityHeaders(NextResponse.next(), pathname);
});

export const config = {
  matcher: [
    // Everything except Next.js internals and static files, so pages *and* API
    // routes go through the gate above.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|map)$).*)",
  ],
};
