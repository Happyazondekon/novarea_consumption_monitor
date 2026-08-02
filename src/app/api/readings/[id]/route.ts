import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { value, photoUrl, isEdited, isValidated } = await req.json();
    const id = params.id;

    const updated = await prisma.$transaction(async (tx) => {
        const currentReading = await tx.meterReading.findUnique({ where: { id } });
        if (!currentReading) throw new Error("Not found");

        const updateData: any = {};
        if (value !== undefined) updateData.value = parseFloat(value);
        if (photoUrl !== undefined) updateData.photoUrl = photoUrl || undefined;
        if (isEdited !== undefined) updateData.isEdited = isEdited;
        if (isValidated !== undefined) updateData.isEdited = !isValidated; // Mapping isValidated to isEdited false

        const newReading = await tx.meterReading.update({
            where: { id },
            data: updateData
        });

        // RE-CALCULATE CONSUMPTION if value changed
        if (value !== undefined) {
            const previousReading = await tx.meterReading.findFirst({
                where: {
                    category: currentReading.category,
                    timestamp: { lt: currentReading.timestamp },
                    isDeleted: false
                },
                orderBy: { timestamp: 'desc' }
            });

            if (previousReading) {
                const consumptionValue = parseFloat(value) - previousReading.value;
                if (consumptionValue >= 0) {
                    await tx.consumption.upsert({
                        where: { readingId: id },
                        update: {
                            previousValue: previousReading.value,
                            currentValue: parseFloat(value),
                            consumption: consumptionValue
                        },
                        create: {
                            readingId: id,
                            date: currentReading.timestamp,
                            category: currentReading.category,
                            previousValue: previousReading.value,
                            currentValue: parseFloat(value),
                            consumption: consumptionValue
                        }
                    });
                }
            }
        }

        return newReading;
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
  const id = params.id;

  try {
    const reading = await prisma.meterReading.findUnique({ where: { id } });
    if (!reading) return NextResponse.json({ error: "Reading not found" }, { status: 404 });

    if (role !== 'ADMINISTRATEUR' && reading.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Permanent delete of both reading and linked consumption
    // Consumption table has onDelete: Cascade on readingId
    await prisma.meterReading.delete({ where: { id } });

    return NextResponse.json({ message: "Permanently removed" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
