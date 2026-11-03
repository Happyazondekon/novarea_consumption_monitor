import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { imageResponse } from "@/lib/image/serve";

// Same audience as GET /api/readings: any signed-in user.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reading = await prisma.meterReading.findUnique({
    where: { id: params.id },
    select: { photoUrl: true },
  });
  return imageResponse(reading?.photoUrl);
}
