import { prisma } from "@/lib/prisma";
import { differenceInDays, addDays, startOfDay, isSameDay } from "date-fns";

/**
 * Recalculates all consumption deltas for a specific category.
 * Logic: DATE ISOLATION.
 * - Each date is an independent calculation unit.
 * - Consumption for a day only happens if there are multiple readings on THAT day.
 * - The first reading of a day is an OPENING index.
 * - Gaps are filled by distributing the delta between the last known reading
 *   and the current opening index across the MISSING days only.
 */
export async function recalculateCategoryConsumption(category: string) {
  console.log(`[INTERPOLATE] Recalculating ${category} with Date Isolation...`);

  // 1. Fetch all valid readings
  const readings = await prisma.meterReading.findMany({
    where: { category, isDeleted: false },
    orderBy: { timestamp: "asc" },
  });

  if (readings.length < 2) {
    console.log(`[INTERPOLATE] Not enough readings for ${category}. Clearing...`);
    await prisma.consumption.deleteMany({ where: { category } });
    return;
  }

  // 2. Clear existing consumption data
  await prisma.consumption.deleteMany({ where: { category } });

  const consumptionToCreate: any[] = [];

  // 3. Iterate through readings
  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const curr = readings[i];

    const d1 = startOfDay(prev.timestamp);
    const d2 = startOfDay(curr.timestamp);
    const daysDiff = differenceInDays(d2, d1);

    const deltaValue = curr.value - prev.value;

    if (daysDiff === 0) {
        // SAME DAY: Real consumption happened DURING this day
        const existingIndex = consumptionToCreate.findIndex(c => isSameDay(c.date, curr.timestamp));

        if (existingIndex > -1) {
            // Update today's usage (Second reading vs first reading of the same day)
            consumptionToCreate[existingIndex].currentValue = curr.value;
            consumptionToCreate[existingIndex].consumption += Math.max(0, deltaValue);
            consumptionToCreate[existingIndex].source = "MEASURED";
            consumptionToCreate[existingIndex].readingId = curr.id;
        } else {
            // First time we calculate usage for "today" (happens on multi-reading)
            consumptionToCreate.push({
                date: curr.timestamp,
                category,
                previousValue: prev.value,
                currentValue: curr.value,
                consumption: Math.max(0, deltaValue),
                source: "MEASURED",
                readingId: curr.id
            });
        }
    } else {
        // GAP DETECTED (daysDiff >= 1)
        // Everything consumed between previous reading and current opening index
        // belongs to the PREVIOUS days (ghost days).

        // Example: Saturday evening to Monday morning.
        // daysDiff = 2 (Sunday, Monday).
        // Total Delta / daysDiff.
        // But Rule: Monday (Current day) must start at 0.
        // So we distribute the delta ONLY on Sunday (and Saturday night if needed).

        const missingDaysCount = daysDiff;
        const dailyInterpolatedValue = deltaValue / missingDaysCount;

        for (let j = 1; j <= missingDaysCount; j++) {
            const targetDate = addDays(d1, j);
            const isToday = j === missingDaysCount;

            if (isToday) {
                // CURRENT DAY: This is the OPENING reading.
                // Consumption for "Today" is 0 until a second reading arrives.
                // We create a skeleton entry to mark the opening index.
                consumptionToCreate.push({
                    date: curr.timestamp,
                    category,
                    previousValue: curr.value, // It's our anchor
                    currentValue: curr.value,
                    consumption: 0,
                    source: "MEASURED",
                    readingId: curr.id
                });
            } else {
                // GHOST DAY: Distribute the "inter-day" consumption here
                consumptionToCreate.push({
                    date: targetDate,
                    category,
                    previousValue: null,
                    currentValue: null,
                    consumption: Math.max(0, dailyInterpolatedValue),
                    source: "INTERPOLATED",
                    gapStartDate: prev.timestamp,
                    gapEndDate: curr.timestamp,
                    readingId: curr.id
                });
            }
        }
    }
  }

  // 4. Batch create
  if (consumptionToCreate.length > 0) {
    // Filter out potential duplicates for the same day (keep the most updated one)
    const finalData: any[] = [];
    const seenDates = new Set();

    // Process backwards to keep latest state for each day
    for (let i = consumptionToCreate.length - 1; i >= 0; i--) {
        const item = consumptionToCreate[i];
        const dateKey = startOfDay(item.date).getTime();
        if (!seenDates.has(dateKey)) {
            finalData.unshift(item);
            seenDates.add(dateKey);
        }
    }

    await prisma.consumption.createMany({
        data: finalData
    });
  }

  console.log(`[INTERPOLATE] Finished. Created ${consumptionToCreate.length} entries.`);
}
