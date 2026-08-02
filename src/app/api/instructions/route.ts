import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    if (role === 'ADMINISTRATEUR') {
      const missions = await prisma.instruction.findMany({
        include: { user: { select: { name: true } } },
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

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();

    if (body.userIds && Array.isArray(body.userIds)) {
        const data = body.userIds.map((uid: string) => ({
            userId: uid,
            text: body.text,
            status: 'PENDING'
        }));
        await prisma.instruction.createMany({ data });
    } else if (body.userId) {
        await prisma.instruction.create({
            data: {
                userId: body.userId,
                text: body.text,
                status: 'PENDING'
            }
        });
    } else {
        return NextResponse.json({ error: "Missing targets" }, { status: 400 });
    }

    return NextResponse.json({ message: "Missions broadcasted successfully" });
  } catch (error) {
    console.error("Instruction POST Error:", error);
    return NextResponse.json({ error: "Broadcast failed" }, { status: 500 });
  }
}
