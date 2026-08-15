import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import webpush from "web-push";
import { sendMissionEmail } from "@/lib/mail/templates";

export const dynamic = "force-dynamic";

// Configure Web Push
webpush.setVapidDetails(
  'mailto:wins.azondekon@gmail.com',
  "BA-l5QNwNPDSadlNd8YFxharpn7qldla3LcTgoNhS38Yre1TpaMGxGLwrjF_0yubxfYZASka82avM1AiQQ-RuI8",
  "N_jV_EJTkQm7tRIrRkVNRmNPpDy_8Lq6E7EG6hWewL8"
);

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    if (role === 'ADMINISTRATEUR') {
      const missions = await prisma.instruction.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(missions);
    } else {
      const missions = await prisma.instruction.findMany({
        where: { userId },
        include: { user: { select: { name: true } } },
        orderBy: [
            { status: 'asc' }, // PENDING first
            { createdAt: 'desc' }
        ]
      });
      return NextResponse.json(missions);
    }
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

async function sendNotification(userId: string, title: string, body: string, url: string, adminName: string, text: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true, pushSubscription: true }
        });

        if (user) {
            // 1. Web Push
            if (user.pushSubscription) {
                const sub = user.pushSubscription as any;
                await webpush.sendNotification(sub, JSON.stringify({
                    title,
                    body,
                    url
                }));
            }

            // 2. Email Notification (via Resend)
            if (user.email) {
                await sendMissionEmail(user.email, user.name, adminName, text);
            }
        }
    } catch (err) {
        console.error("Multi-channel notification failed for user:", userId, err);
    }
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const adminName = (session?.user as any)?.name || "The Administration";

    if (body.userIds && Array.isArray(body.userIds)) {
        const data = body.userIds.map((uid: string) => ({
            userId: uid,
            text: body.text,
            status: 'PENDING'
        }));
        await prisma.instruction.createMany({ data });

        // Notify each target user (Push + Email)
        for (const uid of body.userIds) {
            await sendNotification(
                uid,
                "New Operational Directive",
                `${adminName}: ${body.text}`,
                "/dashboard/instructions",
                adminName,
                body.text
            );
        }
    } else if (body.userId) {
        await prisma.instruction.create({
            data: {
                userId: body.userId,
                text: body.text,
                status: 'PENDING'
            }
        });
        await sendNotification(
            body.userId,
            "New Operational Directive",
            `${adminName}: ${body.text}`,
            "/dashboard/instructions",
            adminName,
            body.text
        );
    } else {
        return NextResponse.json({ error: "Missing targets" }, { status: 400 });
    }

    return NextResponse.json({ message: "Missions broadcasted successfully" });
  } catch (error) {
    console.error("Instruction POST Error:", error);
    return NextResponse.json({ error: "Broadcast failed" }, { status: 500 });
  }
}
