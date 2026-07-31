import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, email, avatar, oldPassword, newPassword, phone } = await req.json();
    const userId = (session.user as any).id;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updateData: any = { name, email, phone };
    if (avatar) updateData.avatar = avatar;

    // Password change logic
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, currentUser.password);
      if (!isMatch) {
        return NextResponse.json({ error: "Old password does not match" }, { status: 400 });
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
        email: updatedUser.email,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
