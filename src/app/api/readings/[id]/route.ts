import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { value, photoUrl, isEdited } = await req.json();
    const id = params.id;

    const updated = await prisma.meterReading.update({
      where: { id },
      data: {
        value: parseFloat(value),
        photoUrl: photoUrl || undefined,
        isEdited: isEdited ?? true
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    const id = params.id;

    if (role === 'ADMINISTRATEUR') {
        await prisma.meterReading.delete({ where: { id } });
    } else {
        // Technician can only delete their own
        await prisma.meterReading.delete({
            where: { id, userId }
        });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
