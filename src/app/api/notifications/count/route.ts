import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ count: 0 });

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  try {
    let count = 0;

    if (role === 'ADMINISTRATEUR') {
      // Admin notifications: submissions pending audit (isEdited: true)
      count = await prisma.meterReading.count({
        where: { isEdited: true, isDeleted: false }
      });
    } else {
      // Tech notifications: missions pending completion (status: 'PENDING')
      count = await prisma.instruction.count({
        where: { userId, status: 'PENDING' }
      });
    }

    return NextResponse.json({ count });
  } catch (err) {
    return NextResponse.json({ count: 0 });
  }
}
