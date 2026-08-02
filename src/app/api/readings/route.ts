import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const category = formData.get("category") as string;
    const value = formData.get("value") as string;
    const photoData = formData.get("photo") as string; // Base64 string
    const timeOfDay = formData.get("timeOfDay") as string;
    const currentValue = parseFloat(value);

    const reading = await prisma.$transaction(async (tx) => {
      // 1. Create the new reading
      const newReading = await tx.meterReading.create({
        data: {
          userId: (session.user as any).id,
          category,
          value: currentValue,
          photoUrl: photoData,
          timeOfDay: timeOfDay || (new Date().getHours() < 13 ? "MORNING" : "EVENING"),
          isEdited: true // All new readings start as PENDING
        },
      });

      // 2. Find the most recent VALID (non-deleted) reading to use as baseline
      const previousReading = await tx.meterReading.findFirst({
        where: {
          category,
          timestamp: { lt: newReading.timestamp },
          isDeleted: false // CRITICAL: Only use actual data
        },
        orderBy: { timestamp: 'desc' }
      });

      // 3. Create Consumption delta ONLY if we have a real baseline
      if (previousReading) {
        const consumptionValue = currentValue - previousReading.value;
        // Logic: If someone enters a value LOWER than previous, we don't record negative consumption
        if (consumptionValue >= 0) {
            await tx.consumption.create({
                data: {
                    readingId: newReading.id, // Explicit link for cascade delete
                    date: newReading.timestamp,
                    category,
                    previousValue: previousReading.value,
                    currentValue: currentValue,
                    consumption: consumptionValue
                }
            });
        }
      }

      return newReading;
    });

    return NextResponse.json(reading);
  } catch (error) {
    console.error("Reading creation error:", error);
    return NextResponse.json({ error: "Failed to create reading" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

  try {
    const readings = await prisma.meterReading.findMany({
      where: {
          ...( (session.user as any).role === 'ELECTRICIEN' ? { userId: (session.user as any).id } : {} ),
          isDeleted: false // Don't show deleted ones in list
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: { user: { select: { name: true } } }
    });

    return NextResponse.json(readings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 });
  }
}
