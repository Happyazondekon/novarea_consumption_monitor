import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️ FIXING WINSTON ACCOUNT...");

  const hashedPassword = await bcrypt.hash("WInston2026!", 10);

  // Clean username "winston" (removed the trailing space found in DB)
  const user = await prisma.user.update({
    where: { id: "cms9mxs5x0000zv4s3q23ieoz" },
    data: {
      username: "winston",
      password: hashedPassword,
      isActive: true
    }
  });

  console.log(`✅ Winston account fixed.`);
  console.log(`- New System ID: ${user.username}`);
  console.log(`- New Password: [WInston2026!]`);
  console.log(`- Status: ACTIVE`);
}

main().finally(() => prisma.$disconnect());
