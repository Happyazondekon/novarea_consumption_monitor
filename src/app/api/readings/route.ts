import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recalculateCategoryConsumption } from "@/lib/consumption/interpolate";
import webpush from "web-push";
import { sendReadingAlertEmail } from "@/lib/mail/templates";

// Configure Web Push
webpush.setVapidDetails(
  'mailto:wins.azondekon@gmail.com',
  "BA-l5QNwNPDSadlNd8YFxharpn7qldla3LcTgoNhS38Yre1TpaMGxGLwrjF_0yubxfYZASka82avM1AiQQ-RuI8",
  "N_jV_EJTkQm7tRIrRkVNRmNPpDy_8Lq6E7EG6hWewL8"
);

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

  try {
    const readings = await prisma.meterReading.findMany({
      where: { isDeleted: false },
      orderBy: { timestamp: "desc" },
      take: limit,
      include: { user: { select: { name: true, avatar: true } } },
    });
    return NextResponse.json(readings);
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const category = formData.get("category") as string;
    const value = parseFloat(formData.get("value") as string);
    const photoUrl = formData.get("photo") as string;
    const timeOfDay = formData.get("timeOfDay") as string;

    const reading = await prisma.meterReading.create({
      data: {
        userId: (session.user as any).id,
        category,
        value,
        photoUrl,
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
        if (admin.pushSubscription) {
            try {
                await webpush.sendNotification(admin.pushSubscription as any, JSON.stringify({
                    title: "New Reading Captured",
                    body: `${technicianName} logged ${value} ${category === 'POWER' ? 'kWh' : 'm³'} (Audit Required)`,
                    url: "/dashboard/reports"
                }));
            } catch (err) { console.error("Admin push notify failed:", admin.id); }
        }

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
