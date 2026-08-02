import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import { recalculateCategoryConsumption } from '../src/lib/consumption/interpolate';

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting historical consumption backfill with linear interpolation...");

  await recalculateCategoryConsumption("POWER");
  await recalculateCategoryConsumption("WATER");

  console.log("✅ Backfill complete. All industrial deltas are now logically distributed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
