import { NextResponse } from "next/server";

const DATA_URL = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/;

/**
 * Turn a stored base64 data URL into a binary image response.
 *
 * Callers put a version token in the URL (`?v=`), so the browser can keep the
 * image for a year: a changed image gets a new URL. This is what keeps photos
 * from being re-read from Neon on every page load.
 */
export function imageResponse(dataUrl: string | null | undefined): NextResponse {
  const match = dataUrl ? DATA_URL.exec(dataUrl) : null;
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = Buffer.from(match[2], "base64");
  return new NextResponse(body, {
    headers: {
      "Content-Type": match[1],
      "Content-Length": String(body.length),
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
