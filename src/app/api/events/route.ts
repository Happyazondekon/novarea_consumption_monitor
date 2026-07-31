import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  const date = dateStr ? new Date(dateStr) : new Date();

  try {
    const dailyEvents = await prisma.dailyEvent.findMany({
      where: {
        date: { gte: startOfDay(date), lte: endOfDay(date) }
      },
      include: { eventType: true }
    });

    const types = await prisma.eventType.findMany();

    return NextResponse.json({ dailyEvents, types });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { date, eventTypeId, comment } = await req.json();

    const event = await prisma.dailyEvent.create({
      data: {
        date: new Date(date),
        eventTypeId,
        comment
      },
      include: { eventType: true }
    });

    return NextResponse.json(event);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await req.json();
    await prisma.dailyEvent.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
