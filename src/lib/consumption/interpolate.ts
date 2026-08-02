import { prisma } from "@/lib/prisma";
import { differenceInDays, addDays, startOfDay, isSameDay } from "date-fns";

/**
 * Recalculates all consumption deltas for a specific category.
 * Ensures linear interpolation for missing reading days and real-time updates for same-day entries.
 */
export async function recalculateCategoryConsumption(category: string) {
  console.log(`[INTERPOLATE] Recalculating ${category} consumption...`);

  // 1. Fetch all valid readings for this category
  const readings = await prisma.meterReading.findMany({
    where: { category, isDeleted: false },
    orderBy: { timestamp: "asc" },
  });

  if (readings.length < 2) {
    console.log(`[INTERPOLATE] Not enough readings for ${category} (Found ${readings.length}). Clearing consumption...`);
    await prisma.consumption.deleteMany({ where: { category } });
    return;
  }

  // 2. Clear existing consumption data for this category
  await prisma.consumption.deleteMany({ where: { category } });

  const consumptionToCreate: any[] = [];

  // 3. Iterate through consecutive pairs of readings
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const curr = readings[i];

    const totalDelta = curr.value - prev.value;

    const d1 = startOfDay(prev.timestamp);
    const d2 = startOfDay(curr.timestamp);
    const daysDiff = differenceInDays(d2, d1);

    if (daysDiff === 0) {
        // SAME DAY: Multi-reading on the same day (Real-time update)
        // We accumulate this delta into the current day's consumption record
        const existingIndex = consumptionToCreate.findIndex(c => isSameDay(c.date, curr.timestamp));

        if (existingIndex > -1) {
            // Update the existing entry for today with the new delta
            consumptionToCreate[existingIndex].currentValue = curr.value;
            consumptionToCreate[existingIndex].consumption += Math.max(0, totalDelta);
        } else {
            // First calculated delta for today
            consumptionToCreate.push({
                date: curr.timestamp,
                category,
                previousValue: prev.value,
                currentValue: curr.value,
                consumption: Math.max(0, totalDelta),
                source: "MEASURED",
                readingId: curr.id
            });
        }
    } else if (daysDiff === 1) {
      // Direct consecutive day: Measured
      consumptionToCreate.push({
        date: curr.timestamp,
        category,
        previousValue: prev.value,
        currentValue: curr.value,
        consumption: Math.max(0, totalDelta),
        source: "MEASURED",
        readingId: curr.id
      });
    } else if (daysDiff > 1) {
      // Gap detected: Interpolated
      const dailyValue = totalDelta / daysDiff;

      for (let j = 1; j <= daysDiff; j++) {
        const targetDate = addDays(d1, j);
        const isLastDay = j === daysDiff;

        consumptionToCreate.push({
          date: isLastDay ? curr.timestamp : targetDate,
          category,
          previousValue: isLastDay ? prev.value : null,
          currentValue: isLastDay ? curr.value : null,
          consumption: Math.max(0, dailyValue),
          source: "INTERPOLATED",
          gapStartDate: prev.timestamp,
          gapEndDate: curr.timestamp,
          readingId: curr.id
        });
      }
    }
  }

  // 4. Batch create new consumption entries
  if (consumptionToCreate.length > 0) {
    await prisma.consumption.createMany({
        data: consumptionToCreate
    });
  }

  console.log(`[INTERPOLATE] Finished. Created ${consumptionToCreate.length} entries for ${category}.`);
}
