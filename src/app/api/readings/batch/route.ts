import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { ids, action } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (action === "DELETE") {
        await prisma.meterReading.deleteMany({
            where: { id: { in: ids } }
        });
        // Note: Associated consumption records remain but we could cleanup if needed
        return NextResponse.json({ message: "Deleted successfully" });
    }

    if (action === "VALIDATE") {
        await prisma.meterReading.updateMany({
            where: { id: { in: ids } },
            data: { isEdited: false } // Assuming validation resets 'Edited' or sets a verified flag
        });
        return NextResponse.json({ message: "Validated successfully" });
    }

    return NextResponse.json({ error: "Action not supported" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Batch operation failed" }, { status: 500 });
  }
}
