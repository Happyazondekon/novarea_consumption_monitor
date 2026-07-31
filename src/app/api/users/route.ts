import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        instructions: true,
        isActive: true,
        avatar: true
      }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { id, username, name, password, role, email, phone, instructions, isActive } = await req.json();

    if (id) {
        // Update
        const updateData: any = { username, name, role, email, phone, instructions, isActive };
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });
        return NextResponse.json(user);
    } else {
        // Create
        const user = await prisma.user.create({
            data: {
                username,
                name,
                password: await bcrypt.hash(password || 'password123', 10),
                role,
                email,
                phone,
                instructions,
                isActive: isActive ?? true
            }
        });
        return NextResponse.json(user);
    }
  } catch (error) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
