import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    if (role === 'ADMINISTRATEUR') {
      // Admins see all missions with status and user details
      const missions = await prisma.instruction.findMany({
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(missions);
    } else {
      // Technicians see their own missions, sorted by status (Pending first)
      const missions = await prisma.instruction.findMany({
        where: { userId },
        orderBy: [
            { status: 'asc' }, // PENDING before DONE
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
    const { userIds, text } = await req.json();

    // Create a mission for each technician
    const data = userIds.map((uid: string) => ({
        userId: uid,
        text: text,
        status: 'PENDING'
    }));

    await prisma.instruction.createMany({ data });

    return NextResponse.json({ message: "Missions broadcasted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Broadcast failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      const { id, status } = await req.json();
      const updated = await prisma.instruction.update({
        where: { id },
        data: { status }
      });
      return NextResponse.json(updated);
    } catch (error) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
      const { id } = await req.json();
      await prisma.instruction.delete({ where: { id } });
      return NextResponse.json({ message: "Mission removed" });
    } catch (error) {
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
