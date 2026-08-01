import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = "dev_master";
  const password = "MasterPassword2026!"; // Vous pourrez le changer via ce script
  const hashedPassword = await bcrypt.hash(password, 10);

  const superAdmin = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role: "ADMINISTRATEUR",
      name: "System Developer",
      isActive: true
    },
    create: {
      username,
      password: hashedPassword,
      name: "System Developer",
      role: "ADMINISTRATEUR",
      isActive: true,
      email: "dev@novarea.bj"
    }
  });

  console.log("--------------------------------------");
  console.log("🚀 HIDDEN SUPER ADMIN CREATED SUCCESSFULLY");
  console.log(`ID: ${superAdmin.username}`);
  console.log(`PASS: ${password}`);
  console.log("--------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
