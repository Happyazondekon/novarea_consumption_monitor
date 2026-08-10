import { prisma } from "@/lib/prisma";
import {
  startOfDay, endOfDay, subDays, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isSameDay, startOfYear, endOfYear, eachMonthOfInterval,
  isSameMonth, eachWeekOfInterval, isSameWeek
} from "date-fns";

/**
 * Calculates a fixed 30-day historical average to serve as a reliable estimation baseline.
 */
async function getHistoric30DayAverage(category: string) {
  const thirtyDaysAgo = subDays(new Date(), 30);
  const now = endOfDay(new Date());

  const agg = await prisma.consumption.aggregate({
    where: { category, date: { gte: thirtyDaysAgo, lte: now } },
    _sum: { consumption: true }
  });

  const daysRaw = await prisma.consumption.findMany({
    where: { category, date: { gte: thirtyDaysAgo, lte: now } },
    select: { date: true }
  });

  const distinctCount = new Set(daysRaw.map(d => format(d.date, 'yyyy-MM-dd'))).size;
  return distinctCount > 0 ? (agg._sum.consumption || 0) / distinctCount : 0;
}

export async function getKPICards(
    resource: string = "POWER",
    targetDate: Date = new Date(),
    period: "WEEK" | "MONTH" | "YEAR" | "CUSTOM" = "WEEK",
    customStart?: Date,
    customEnd?: Date
) {
  let start: Date;
  let end: Date;

  if (period === "WEEK") {
    start = startOfWeek(targetDate, { weekStartsOn: 1 });
    end = endOfWeek(targetDate, { weekStartsOn: 1 });
  } else if (period === "MONTH") {
    start = startOfMonth(targetDate);
    end = endOfMonth(targetDate);
  } else if (period === "YEAR") {
    start = startOfYear(targetDate);
    end = endOfYear(targetDate);
  } else {
    start = startOfDay(customStart || subDays(new Date(), 7));
    end = endOfDay(customEnd || new Date());
  }

  const lastReadingRaw = await prisma.meterReading.findFirst({
    where: { category: resource, isDeleted: false },
    orderBy: { timestamp: 'desc' },
    select: { value: true }
  });
  const lastReading = lastReadingRaw?.value || 0;

  const usagePeriodAgg = await prisma.consumption.aggregate({
    where: { category: resource, date: { gte: start, lte: end } },
    _sum: { consumption: true }
  });
  let totalConsumption = usagePeriodAgg._sum.consumption || 0;

  const daysWithDataRaw = await prisma.consumption.findMany({
    where: { category: resource, date: { gte: start, lte: end } },
    select: { date: true }
  });
  const distinctDays = new Set(daysWithDataRaw.map(d => format(d.date, 'yyyy-MM-dd'))).size;
  const avg = distinctDays > 0 ? (usagePeriodAgg._sum.consumption || 0) / distinctDays : 0;

  const historicAvg = await getHistoric30DayAverage(resource);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  let isPredictive = false;

  const todayCons = await prisma.consumption.findFirst({
      where: { category: resource, date: { gte: todayStart, lte: todayEnd } }
  });

  if ((!todayCons || todayCons.consumption === 0) && (todayStart >= start && todayStart <= end)) {
      const readingCountToday = await prisma.meterReading.count({
          where: { category: resource, timestamp: { gte: todayStart, lte: todayEnd }, isDeleted: false }
      });

      if (readingCountToday === 1) {
          totalConsumption += historicAvg;
          isPredictive = true;
      }
  }

  const eventsPeriod = await prisma.dailyEvent.count({
    where: {
        date: { gte: start, lte: end },
        eventType: { category: { in: [resource, "BOTH"] } }
    }
  });

  return {
    lastReading: lastReading.toFixed(2),
    usageToday: totalConsumption.toFixed(2),
    eventsToday: eventsPeriod,
    dailyAverage: avg.toFixed(2),
    isPredictive
  };
}

export async function getChartData(
    resource: string,
    period: "WEEK" | "MONTH" | "YEAR" | "CUSTOM",
    targetDate: Date = new Date(),
    customStart?: Date,
    customEnd?: Date,
    aggregation: "DAY" | "WEEK" | "MONTH" = "DAY"
) {
  let startDate: Date;
  let endDate: Date;

  if (period === "WEEK") {
    startDate = startOfWeek(targetDate, { weekStartsOn: 1 });
    endDate = endOfWeek(targetDate, { weekStartsOn: 1 });
  } else if (period === "MONTH") {
    startDate = startOfMonth(targetDate);
    endDate = endOfMonth(targetDate);
  } else if (period === "YEAR") {
    startDate = startOfYear(targetDate);
    endDate = endOfYear(targetDate);
  } else {
    startDate = startOfDay(customStart || subDays(new Date(), 7));
    endDate = endOfDay(customEnd || new Date());
  }

  let interval: Date[];
  if (aggregation === "WEEK") {
    interval = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
  } else if (aggregation === "MONTH") {
    interval = eachMonthOfInterval({ start: startDate, end: endDate });
  } else {
    interval = eachDayOfInterval({ start: startDate, end: endDate });
  }

  const consumptions = await prisma.consumption.findMany({
    where: { category: resource, date: { gte: startDate, lte: endDate } }
  });

  const events = await prisma.dailyEvent.findMany({
    where: {
        date: { gte: startDate, lte: endDate },
        eventType: { category: { in: [resource, "BOTH"] } }
    },
    include: { eventType: true }
  });

  const historicAvg = await getHistoric30DayAverage(resource);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  let totalConsumptionInPeriod = 0;
  let bucketsWithDataCount = 0;

  const chartData = interval.map(bucketDate => {
    let bucketCons = consumptions.filter(c => {
        if (aggregation === "DAY") return isSameDay(c.date, bucketDate);
        if (aggregation === "WEEK") return isSameWeek(c.date, bucketDate, { weekStartsOn: 1 });
        return isSameMonth(c.date, bucketDate);
    });

    let bucketConsump = bucketCons.reduce((sum, c) => sum + c.consumption, 0);
    let hasInterpolated = bucketCons.some(c => c.source === "INTERPOLATED");
    let gapExample = bucketCons.find(c => c.source === "INTERPOLATED");

    // NEW: Predictive bar for today in chart
    if (aggregation === "DAY" && isSameDay(bucketDate, todayStart) && bucketConsump === 0) {
        // Find if we have at least one reading today to trigger prediction
        // (Note: This is a synchronous filter but reading check is async, we use the fact that
        // if bucketConsump is 0 but an entry exists with consumption 0, it was the first reading)
        const hasOpeningReading = bucketCons.length > 0;
        if (hasOpeningReading) {
            bucketConsump = historicAvg;
            hasInterpolated = true; // Use the dotted style for predicted bars
        }
    }

    const bucketEventsList = events.filter(e => {
        if (aggregation === "DAY") return isSameDay(e.date, bucketDate);
        if (aggregation === "WEEK") return isSameWeek(e.date, bucketDate, { weekStartsOn: 1 });
        return isSameMonth(e.date, bucketDate);
    });

    const bucketEventCount = bucketEventsList.length;
    const bucketEventCodes = Array.from(new Set(bucketEventsList.map(e => e.eventType.code)));

    if (bucketConsump > 0) {
        totalConsumptionInPeriod += bucketConsump;
        bucketsWithDataCount++;
    }

    return {
      name: aggregation === "DAY" ? format(bucketDate, "EEE dd") :
            aggregation === "WEEK" ? `W${format(bucketDate, "ww")}` :
            format(bucketDate, "MMM"),
      fullDate: format(bucketDate, "yyyy-MM-dd"),
      consumption: bucketConsump,
      events: bucketEventCount,
      eventCodes: bucketEventCodes.join(', '),
      source: hasInterpolated ? "INTERPOLATED" : "MEASURED",
      gapStart: gapExample?.gapStartDate,
      gapEnd: gapExample?.gapEndDate
    };
  });

  const referenceAverage = bucketsWithDataCount > 0 ? totalConsumptionInPeriod / bucketsWithDataCount : 0;
  const ieCount = events.filter(e => e.eventType.type === 'INCREASE').length;
  const deCount = events.filter(e => e.eventType.type === 'DECREASE').length;

  return {
    chartData,
    referenceAverage: parseFloat(referenceAverage.toFixed(2)),
    eventSummary: { ie: ieCount, de: deCount }
  };
}

export async function getReportData(
    resource: string,
    period: "WEEK" | "MONTH" | "YEAR" | "CUSTOM",
    targetDate: Date,
    customStart?: Date,
    customEnd?: Date,
    aggregation: "DAY" | "WEEK" | "MONTH" = "DAY"
) {
    const charts = await getChartData(resource, period, targetDate, customStart, customEnd, aggregation);

    let startDate: Date;
    let endDate: Date;
    if (period === "CUSTOM") {
        startDate = startOfDay(customStart!);
        endDate = endOfDay(customEnd!);
    } else if (period === "WEEK") {
        startDate = startOfWeek(targetDate, { weekStartsOn: 1 });
        endDate = endOfWeek(targetDate, { weekStartsOn: 1 });
    } else if (period === "MONTH") {
        startDate = startOfMonth(targetDate);
        endDate = endOfMonth(targetDate);
    } else {
        startDate = startOfYear(targetDate);
        endDate = endOfYear(targetDate);
    }

    const readings = await prisma.consumption.findMany({
        where: { category: resource, date: { gte: startDate, lte: endDate } },
        orderBy: { date: 'asc' }
    });

    const eventLogs = await prisma.dailyEvent.findMany({
        where: {
            date: { gte: startDate, lte: endDate },
            eventType: { category: { in: [resource, "BOTH"] } }
        },
        include: { eventType: true },
        orderBy: { date: 'asc' }
    });

    return {
        ...charts,
        readings,
        eventLogs: eventLogs.map(e => ({
            date: e.date,
            code: e.eventType.code,
            description: e.eventType.description,
            type: e.eventType.type,
            comment: e.comment
        })),
        periodInfo: {
            start: startDate,
            end: endDate,
            label: period === "CUSTOM" ? `${format(startDate, 'dd MMM')} - ${format(endDate, 'dd MMM yyyy')}` :
                   period === "WEEK" ? `Week of ${format(startDate, 'dd MMM')}` :
                   period === "MONTH" ? format(startDate, 'MMMM yyyy') :
                   format(startDate, 'yyyy')
        }
    };
}
