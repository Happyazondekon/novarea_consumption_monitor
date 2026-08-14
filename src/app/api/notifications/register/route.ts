import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const subscription = await req.json();
    const userId = (session.user as any).id;

    await prisma.user.update({
      where: { id: userId },
      data: { pushSubscription: subscription }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to register" }, { status: 500 });
  }
}
