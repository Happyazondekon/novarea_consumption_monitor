import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { INSTRUCTION_STATUSES, isOneOf } from "@/lib/security/guards";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    try {
      const { status } = await req.json();
      const id = params.id;

      // Only the two states the UI knows about — anything else would silently
      // corrupt the pending-mission counters.
      if (!isOneOf(status, INSTRUCTION_STATUSES)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      const instruction = await prisma.instruction.findUnique({
        where: { id },
        select: { userId: true }
      });
      if (!instruction) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // A technician may only close their own mission. Previously any
      // authenticated user could mark somebody else's directive as DONE just by
      // knowing (or guessing) its id.
      if (role !== 'ADMINISTRATEUR' && instruction.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const updated = await prisma.instruction.update({
        where: { id },
        data: { status }
      });
      return NextResponse.json(updated);
    } catch (error) {
      console.error("PATCH Error:", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const session = await auth();
    // Only Admin can delete missions
    if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
      const id = params.id;
      console.log(`[API] Deleting instruction ${id}`);

      await prisma.instruction.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Mission removed" });
    } catch (error) {
      console.error("DELETE Error:", error);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
