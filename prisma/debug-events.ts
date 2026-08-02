import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const types = await prisma.eventType.findMany();
  console.log("-----------------------------------------");
  console.log("🔍 CURRENT EVENT TYPES IN DATABASE:");
  types.forEach(t => {
      console.log(`[${t.code}] ${t.description} | CAT: ${t.category} | TYPE: ${t.type}`);
  });
  console.log("-----------------------------------------");
}

main().finally(() => prisma.$disconnect());
