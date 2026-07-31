import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const avatar = formData.get("avatar") as string; // Expecting Base64
    const oldPassword = formData.get("oldPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const phone = formData.get("phone") as string;

    const userId = (session.user as any).id;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updateData: any = {};
    if (name) updateData.name = name;
    if (username) {
        // Check if username is already taken by someone else
        const existing = await prisma.user.findFirst({
            where: { username, NOT: { id: userId } }
        });
        if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 400 });
        updateData.username = username;
    }
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;

    // Password validation logic
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, currentUser.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error("Profile POST update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
