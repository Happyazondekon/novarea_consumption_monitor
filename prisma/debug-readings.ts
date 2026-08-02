import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const readings = await prisma.meterReading.findMany({
    orderBy: { timestamp: 'asc' }
  });
  const consumptions = await prisma.consumption.findMany();

  console.log("-----------------------------------------");
  console.log("📊 READINGS IN DB:");
  readings.forEach(r => console.log(`[${r.category}] Value: ${r.value} | Date: ${r.timestamp.toISOString()}`));

  console.log("\n📈 CONSUMPTIONS IN DB:");
  consumptions.forEach(c => console.log(`[${c.category}] Consumed: ${c.consumption} | Date: ${c.date.toISOString()} | Source: ${c.source}`));
  console.log("-----------------------------------------");
}

main().finally(() => prisma.$disconnect());
