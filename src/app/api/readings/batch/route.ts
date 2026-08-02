import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recalculateCategoryConsumption } from "@/lib/consumption/interpolate";

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
        // Find targeted readings to know their categories
        const readings = await prisma.meterReading.findMany({
            where: {
                id: { in: ids },
                ...(role !== 'ADMINISTRATEUR' ? { userId } : {})
            },
            select: { id: true, category: true }
        });

        const targetIds = readings.map(r => r.id);
        const uniqueCategories = Array.from(new Set(readings.map(r => r.category)));

        // Delete all at once. Consumption records will auto-delete due to Cascade
        await prisma.meterReading.deleteMany({
            where: { id: { in: targetIds } }
        });

        // Recalculate affected categories
        for (const cat of uniqueCategories) {
            await recalculateCategoryConsumption(cat);
        }

        return NextResponse.json({ message: "Batch removal complete" });
    }

    if (action === "VALIDATE") {
        if (role !== 'ADMINISTRATEUR') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await prisma.meterReading.updateMany({
            where: { id: { in: ids } },
            data: { isEdited: false }
        });
        return NextResponse.json({ message: "Batch validation complete" });
    }

    return NextResponse.json({ error: "Action not supported" }, { status: 400 });
  } catch (error) {
    console.error("Batch Error:", error);
    return NextResponse.json({ error: "Batch operation failed" }, { status: 500 });
  }
}
