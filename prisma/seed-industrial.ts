import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import { addDays, startOfDay, isBefore, isSameDay } from 'date-fns';
import { recalculateCategoryConsumption } from '../src/lib/consumption/interpolate';

const prisma = new PrismaClient();

async function main() {
  console.log("🏭 STARTING INDUSTRIAL SEEDING (JULY - AUGUST 2026)");

  const techId = "cms9mxte60001zv4smurseb83"; // nicolas
  const startDate = new Date("2026-07-01T08:00:00Z");
  const endDate = new Date();

  let currentPower = 50240.15;
  let currentWater = 12450.60;

  let currentDate = startOfDay(startDate);
  const endLimit = startOfDay(endDate);

  const eventTypes = await prisma.eventType.findMany();

  while (isBefore(currentDate, endLimit) || isSameDay(currentDate, endLimit)) {
    // We skip some days randomly (~30% chance) to demonstrate interpolation
    const skipDay = Math.random() < 0.3;
    const isToday = isSameDay(currentDate, endLimit);

    if (!skipDay || isToday) {
        // Log Reading
        await prisma.meterReading.create({
            data: {
                userId: techId,
                category: 'POWER',
                value: currentPower,
                timestamp: currentDate,
                timeOfDay: currentDate.getHours() < 13 ? 'MORNING' : 'EVENING',
                isEdited: false
            }
        });

        await prisma.meterReading.create({
            data: {
                userId: techId,
                category: 'WATER',
                value: currentWater,
                timestamp: currentDate,
                timeOfDay: currentDate.getHours() < 13 ? 'MORNING' : 'EVENING',
                isEdited: false
            }
        });

        // Add random anomaly
        if (Math.random() < 0.15) {
            const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            await prisma.dailyEvent.create({
                data: {
                    date: currentDate,
                    eventTypeId: randomType.id,
                    comment: "Seeded industrial context"
                }
            });
        }

        console.log(`✅ Logged ${currentDate.toISOString().split('T')[0]}`);
    } else {
        console.log(`⏳ GAP ${currentDate.toISOString().split('T')[0]}`);
    }

    // Increment values for next day regardless of log (representing consumption)
    currentPower += 180 + (Math.random() * 70);
    currentWater += 25 + (Math.random() * 15);
    currentDate = addDays(currentDate, 1);
  }

  // FORCE INTERPOLATION
  await recalculateCategoryConsumption("POWER");
  await recalculateCategoryConsumption("WATER");

  console.log("🎯 INDUSTRIAL SEEDING COMPLETE.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
