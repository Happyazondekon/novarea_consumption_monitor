import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recalculateCategoryConsumption } from "@/lib/consumption/interpolate";
import { sendPush } from "@/lib/push";
import { sendReadingAlertEmail } from "@/lib/mail/templates";
import {
  CATEGORIES,
  MAX_PHOTO_CHARS,
  TIMES_OF_DAY,
  isOneOf,
  parseMeterValue,
} from "@/lib/security/guards";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

  // Photos and avatars are NOT sent here. They used to be inlined as base64 on
  // every row (the avatar repeated once per reading), which made each History
  // or Reports page load pull ~50 MB out of Neon. Instead each row carries a
  // URL to a cacheable binary endpoint, versioned by the image's length so a
  // replaced image gets a fresh URL.
  try {
    const [readings, photoLengths, avatarLengths] = await Promise.all([
      prisma.meterReading.findMany({
        where: { isDeleted: false },
        orderBy: { timestamp: "desc" },
        take: limit,
        select: {
          id: true,
          userId: true,
          category: true,
          value: true,
          timestamp: true,
          timeOfDay: true,
          isEdited: true,
          isDeleted: true,
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.$queryRaw<{ id: string; len: number }[]>`
        SELECT id, length("photoUrl")::int AS len FROM "MeterReading"
        WHERE "photoUrl" IS NOT NULL AND "isDeleted" = false`,
      prisma.$queryRaw<{ id: string; len: number }[]>`
        SELECT id, length(avatar)::int AS len FROM "User" WHERE avatar IS NOT NULL`,
    ]);

    const photoVersion = new Map(photoLengths.map((r) => [r.id, r.len]));
    const avatarVersion = new Map(avatarLengths.map((r) => [r.id, r.len]));

    return NextResponse.json(
      readings.map((r) => {
        const pv = photoVersion.get(r.id);
        const av = avatarVersion.get(r.user.id);
        return {
          ...r,
          photoUrl: pv ? `/api/readings/${r.id}/photo?v=${pv}` : null,
          user: {
            name: r.user.name,
            avatar: av ? `/api/users/${r.user.id}/avatar?v=${av}` : null,
          },
        };
      })
    );
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const category = formData.get("category");
    const timeOfDay = formData.get("timeOfDay");
    const photoUrl = formData.get("photo");

    // Validate before touching the database: `value` fed straight into
    // parseFloat used to let an empty or malformed field through as NaN, and
    // every consumption delta downstream is computed from it.
    if (!isOneOf(category, CATEGORIES)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!isOneOf(timeOfDay, TIMES_OF_DAY)) {
      return NextResponse.json({ error: "Invalid timeOfDay" }, { status: 400 });
    }

    const value = parseMeterValue(formData.get("value"));
    if (value === null) {
      return NextResponse.json({ error: "Invalid meter value" }, { status: 400 });
    }

    if (typeof photoUrl === "string" && photoUrl.length > MAX_PHOTO_CHARS) {
      return NextResponse.json({ error: "Photo is too large" }, { status: 413 });
    }

    const { photoUrl: _photo, ...reading } = await prisma.meterReading.create({
      data: {
        userId: (session.user as any).id,
        category,
        value,
        photoUrl:
          typeof photoUrl === "string" && photoUrl.startsWith("data:image/") ? photoUrl : undefined,
        timeOfDay,
        isEdited: true
      },
    });

    // Recalculate deltas immediately
    await recalculateCategoryConsumption(category);

    // --- NOTIFICATION LAYER (Multi-Channel) ---

    // We fetch ALL Administrators with their LATEST emails and push subscriptions from DB
    const admins = await prisma.user.findMany({
        where: { role: 'ADMINISTRATEUR', isActive: true },
        select: { id: true, name: true, email: true, pushSubscription: true }
    });

    const technicianName = session.user.name || "Technician";

    for (const admin of admins) {
        // 1. Web Push Alert (Browser/Phone)
        await sendPush(admin.pushSubscription, {
            title: "New Reading Captured",
            body: `${technicianName} logged ${value} ${category === 'POWER' ? 'kWh' : 'm³'} (Audit Required)`,
            url: "/dashboard/reports"
        });

        // 2. Email Alert (Professional Inbox via Resend)
        if (admin.email) {
            console.log(`[MAIL] Sending reading alert to Admin: ${admin.email}`);
            await sendReadingAlertEmail(
                admin.email,
                admin.name,
                technicianName,
                category,
                value
            );
        }
    }

    return NextResponse.json(reading);
  } catch (error) {
    console.error("POST Reading Error:", error);
    return NextResponse.json({ error: "Creation failed" }, { status: 500 });
  }
}
