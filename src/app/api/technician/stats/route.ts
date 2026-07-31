import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  try {
    // 1. Pending Missions count
    const pendingMissions = await prisma.instruction.count({
        where: { userId, status: 'PENDING' }
    });

    // 2. Total Readings Validated
    const validatedCount = await prisma.meterReading.count({
        where: { userId, isEdited: false, isDeleted: false }
    });

    // 3. Pending/Modified (isEdited = true)
    const pendingCount = await prisma.meterReading.count({
        where: { userId, isEdited: true, isDeleted: false }
    });

    // 4. Total Readings
    const totalReadings = await prisma.meterReading.count({
        where: { userId, isDeleted: false }
    });

    return NextResponse.json({
        newInstructions: pendingMissions,
        validatedCount,
        pendingCount,
        totalReadings
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tech stats" }, { status: 500 });
  }
}
