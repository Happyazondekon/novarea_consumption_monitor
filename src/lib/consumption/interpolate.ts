import { prisma } from "@/lib/prisma";
import { differenceInDays, addDays, startOfDay, isSameDay, setHours } from "date-fns";

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
        // SAME DAY: Multi-reading
        const existingIndex = consumptionToCreate.findIndex(c => isSameDay(c.date, curr.timestamp));

        if (existingIndex > -1) {
            consumptionToCreate[existingIndex].currentValue = curr.value;
            consumptionToCreate[existingIndex].consumption += Math.max(0, deltaValue);
            consumptionToCreate[existingIndex].source = "MEASURED";
            consumptionToCreate[existingIndex].readingId = curr.id;
        } else {
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
        // GAP DETECTED
        const missingDaysCount = daysDiff;
        const dailyInterpolatedValue = deltaValue / missingDaysCount;

        for (let j = 1; j <= missingDaysCount; j++) {
            const rawTargetDate = addDays(d1, j);
            const isToday = j === missingDaysCount;

            if (isToday) {
                // CURRENT DAY: Opening index (Start at 0)
                consumptionToCreate.push({
                    date: curr.timestamp,
                    category,
                    previousValue: curr.value,
                    currentValue: curr.value,
                    consumption: 0,
                    source: "MEASURED",
                    readingId: curr.id
                });
            } else {
                // GHOST DAY: Distribute consumption here
                // FIXED: We force Noon (12:00) to prevent Timezone shift to previous day
                const safeTargetDate = setHours(startOfDay(rawTargetDate), 12);

                consumptionToCreate.push({
                    date: safeTargetDate,
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

  // 4. Batch create with de-duplication
  if (consumptionToCreate.length > 0) {
    const finalData: any[] = [];
    const seenDates = new Set();

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

  console.log(`[INTERPOLATE] Finished. Created ${consumptionToCreate.length} records.`);
}
