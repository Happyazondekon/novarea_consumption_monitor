import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    const { ids, action } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (action === "DELETE") {
        // If not admin, only allow deleting own readings
        if (role !== 'ADMINISTRATEUR') {
            await prisma.meterReading.deleteMany({
                where: { id: { in: ids }, userId: userId }
            });
        } else {
            await prisma.meterReading.deleteMany({
                where: { id: { in: ids } }
            });
        }
        return NextResponse.json({ message: "Deleted successfully" });
    }

    if (action === "VALIDATE") {
        if (role !== 'ADMINISTRATEUR') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await prisma.meterReading.updateMany({
            where: { id: { in: ids } },
            data: { isEdited: false }
        });
        return NextResponse.json({ message: "Validated successfully" });
    }

    return NextResponse.json({ error: "Action not supported" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Batch operation failed" }, { status: 500 });
  }
}
