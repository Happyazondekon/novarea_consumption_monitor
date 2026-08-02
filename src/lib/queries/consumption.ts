import { prisma } from "@/lib/prisma";
import {
  startOfDay, endOfDay, subDays, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isSameDay, startOfYear, endOfYear, eachMonthOfInterval,
  isSameMonth, eachWeekOfInterval, isSameWeek
} from "date-fns";

export async function getKPICards(resource: string = "POWER", targetDate: Date = new Date()) {
  const start = startOfDay(targetDate);
  const end = endOfDay(targetDate);

  const lastReadingRaw = await prisma.meterReading.findFirst({
    where: { category: resource, isDeleted: false },
    orderBy: { timestamp: 'desc' },
    select: { value: true }
  });
  const lastReading = lastReadingRaw?.value || 0;

  const usageToday = await prisma.consumption.aggregate({
    where: { category: resource, date: { gte: start, lte: end } },
    _sum: { consumption: true }
  });

  const eventsToday = await prisma.dailyEvent.count({
    where: {
        date: { gte: start, lte: end },
        eventType: { category: { in: [resource, "BOTH"] } }
    }
  });

  const thirtyDaysAgo = subDays(start, 30);
  const totalConsumption30 = await prisma.consumption.aggregate({
    where: { category: resource, date: { gte: thirtyDaysAgo, lte: end } },
    _sum: { consumption: true }
  });

  const daysWithDataRaw = await prisma.consumption.findMany({
    where: { category: resource, date: { gte: thirtyDaysAgo, lte: end } },
    select: { date: true }
  });

  const distinctDays = new Set(daysWithDataRaw.map(d => format(d.date, 'yyyy-MM-dd'))).size;
  const avg = distinctDays > 0 ? (totalConsumption30._sum.consumption || 0) / distinctDays : 0;

  return {
    lastReading: lastReading.toFixed(2),
    usageToday: (usageToday._sum.consumption || 0).toFixed(2),
    eventsToday,
    dailyAverage: avg.toFixed(2)
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

  let totalConsumptionInPeriod = 0;
  let bucketsWithDataCount = 0;

  const chartData = interval.map(bucketDate => {
    let bucketCons = consumptions.filter(c => {
        if (aggregation === "DAY") return isSameDay(c.date, bucketDate);
        if (aggregation === "WEEK") return isSameWeek(c.date, bucketDate, { weekStartsOn: 1 });
        return isSameMonth(c.date, bucketDate);
    });

    const bucketConsump = bucketCons.reduce((sum, c) => sum + c.consumption, 0);

    // Anomaly logic
    const bucketEventsList = events.filter(e => {
        if (aggregation === "DAY") return isSameDay(e.date, bucketDate);
        if (aggregation === "WEEK") return isSameWeek(e.date, bucketDate, { weekStartsOn: 1 });
        return isSameMonth(e.date, bucketDate);
    });

    const bucketEventCount = bucketEventsList.length;
    const bucketEventCodes = Array.from(new Set(bucketEventsList.map(e => e.eventType.code)));

    // Interpolation Metadata
    const hasInterpolated = bucketCons.some(c => c.source === "INTERPOLATED");
    const gapExample = bucketCons.find(c => c.source === "INTERPOLATED");

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

    const eventStats = await prisma.eventType.findMany({
        where: {
            dailyEvents: { some: { date: { gte: startDate, lte: endDate }, eventType: { category: { in: [resource, "BOTH"] } } } }
        },
        include: {
            _count: { select: { dailyEvents: { where: { date: { gte: startDate, lte: endDate } } } } }
        }
    });

    return {
        ...charts,
        readings,
        eventTable: eventStats.map(e => ({
            code: e.code,
            description: e.description,
            type: e.type,
            count: (e as any)._count.dailyEvents
        })).sort((a, b) => b.count - a.count),
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
