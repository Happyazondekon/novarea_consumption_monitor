import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { imageResponse } from "@/lib/image/serve";

// Avatars are shown next to readings, which every signed-in user can list.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { avatar: true },
  });
  return imageResponse(user?.avatar);
}
