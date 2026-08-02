import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      const { status } = await req.json();
      const id = params.id;

      console.log(`[API] Updating instruction ${id} to ${status}`);

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
