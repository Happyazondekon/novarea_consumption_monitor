import webpush from "web-push";

/**
 * Server-side Web Push configuration.
 *
 * The VAPID *private* key used to live hardcoded in two API routes, which means
 * it is in the git history and must be rotated. It now comes from the
 * environment only. The *public* key stays in the client components on purpose
 * — it is public by design and browsers need it to subscribe.
 *
 * Initialisation is lazy: `setVapidDetails` throws on malformed/missing keys,
 * and it used to run at module scope, so a missing variable would have taken
 * down the whole /api/readings route and blocked technicians from submitting.
 * Here a missing key only disables push; email alerts still go out.
 */

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:wins.azondekon@gmail.com";

let configured: boolean | null = null;

function configure(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn(
      "[PUSH] NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set — web push disabled (email alerts unaffected)."
    );
    return false;
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, publicKey, privateKey);
    return true;
  } catch (err) {
    console.error("[PUSH] Invalid VAPID configuration — web push disabled.", err);
    return false;
  }
}

/** Returns the configured web-push client, or null when push is not available. */
export function getWebPush(): typeof webpush | null {
  if (configured === null) configured = configure();
  return configured ? webpush : null;
}

/**
 * Best-effort push to one subscription. Never throws: a dead subscription or a
 * missing VAPID key must not fail the surrounding request.
 */
export async function sendPush(
  subscription: unknown,
  payload: { title: string; body: string; url: string }
): Promise<void> {
  const client = getWebPush();
  if (!client || !subscription) return;

  try {
    await client.sendNotification(subscription as any, JSON.stringify(payload));
  } catch (err) {
    console.error("[PUSH] Delivery failed:", err);
  }
}
