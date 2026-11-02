import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import {
  PROTECTED_USERNAME,
  ROLES,
  isOneOf,
  normalizeUsername,
  validatePassword,
} from "@/lib/security/guards";

export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR')
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      where: {
        NOT: { username: 'dev_master' } // Hide Super Admin from UI lists
      },
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

    const cleanUsername = normalizeUsername(username);
    if (!cleanUsername) {
        return NextResponse.json(
            { error: "Username must be 3-60 characters, letters/digits/._- only" },
            { status: 400 }
        );
    }
    if (cleanUsername === PROTECTED_USERNAME) {
        return NextResponse.json({ error: "Reserved username" }, { status: 403 });
    }
    if (typeof name !== "string" || name.trim().length < 2) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    // Reject anything outside the two roles the app issues: the role string is
    // what every authorization check compares against, so a typo here would
    // create an account that no rule matches.
    if (!isOneOf(role, ROLES)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (id) {
        // Update
        const target = await prisma.user.findUnique({
            where: { id },
            select: { id: true, username: true }
        });
        if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // The super-admin is hidden from the UI list; make it unreachable
        // through the API too rather than only out of sight.
        if (target.username === PROTECTED_USERNAME) {
            return NextResponse.json({ error: "This account cannot be modified" }, { status: 403 });
        }

        const updateData: any = {
            username: cleanUsername,
            name: name.trim(),
            role,
            email,
            phone,
            instructions,
            isActive
        };

        if (password) {
            const check = validatePassword(password);
            if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
            updateData.password = await bcrypt.hash(check.value, 10);
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });
        return NextResponse.json(user);
    } else {
        // Create. A password is now mandatory: the old fallback silently gave
        // every new account the same well-known 'password123'.
        const check = validatePassword(password);
        if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

        const user = await prisma.user.create({
            data: {
                username: cleanUsername,
                name: name.trim(),
                password: await bcrypt.hash(check.value, 10),
                role,
                email,
                phone,
                instructions,
                isActive: isActive ?? true
            }
        });
        return NextResponse.json(user);
    }
  } catch (error: any) {
    // Unique constraint on `username`
    if (error?.code === "P2002") {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    console.error("[USERS_POST]", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
