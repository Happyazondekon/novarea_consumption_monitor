import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const entiteId = (session.user as any).entiteId;

  try {
    const entite = await prisma.entite.findUnique({
      where: { id: entiteId },
    });

    if (!entite) return new NextResponse("Not Found", { status: 404 });

    const data = JSON.parse(JSON.stringify(entite, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
