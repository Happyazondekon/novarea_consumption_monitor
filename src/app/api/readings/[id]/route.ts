import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recalculateCategoryConsumption } from "@/lib/consumption/interpolate";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { value, photoUrl, isEdited, isValidated } = await req.json();
    const id = params.id;

    const readingBefore = await prisma.meterReading.findUnique({ where: { id } });
    if (!readingBefore) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateData: any = {};
    if (value !== undefined) updateData.value = parseFloat(value);
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl || undefined;
    if (isEdited !== undefined) updateData.isEdited = isEdited;
    if (isValidated !== undefined) updateData.isEdited = !isValidated;

    const updated = await prisma.meterReading.update({
      where: { id },
      data: updateData
    });

    // If value or deletion status changed, recalculate consumption for this category
    if (value !== undefined) {
        await recalculateCategoryConsumption(readingBefore.category);
    }

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

    // Permanent delete. Consumption table has onDelete: Cascade
    await prisma.meterReading.delete({ where: { id } });

    // Recalculate category consumption as the gap has changed
    await recalculateCategoryConsumption(reading.category);

    return NextResponse.json({ message: "Permanently removed and consumption recalculated" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
