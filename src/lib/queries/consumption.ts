import { prisma } from "@/lib/prisma";
import {
  startOfDay, endOfDay, subDays, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isSameDay, startOfYear, endOfYear, eachMonthOfInterval,
  isSameMonth, max
} from "date-fns";

export async function getKPICards(resource: string = "POWER", targetDate: Date = new Date()) {
  const start = startOfDay(targetDate);
  const end = endOfDay(targetDate);

  const powerToday = await prisma.consumption.aggregate({
    where: { category: "POWER", date: { gte: start, lte: end } },
    _sum: { consumption: true }
  });

  const waterToday = await prisma.consumption.aggregate({
    where: { category: "WATER", date: { gte: start, lte: end } },
    _sum: { consumption: true }
  });

  const eventsToday = await prisma.dailyEvent.count({
    where: { date: { gte: start, lte: end } }
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

  const avg = distinctDays > 0
    ? (totalConsumption30._sum.consumption || 0) / distinctDays
    : 0;

  return {
    powerToday: (powerToday._sum.consumption || 0).toFixed(2),
    waterToday: (waterToday._sum.consumption || 0).toFixed(2),
    eventsToday,
    dailyAverage: avg.toFixed(2)
  };
}

export async function getChartData(resource: string, period: "WEEK" | "MONTH" | "YEAR", targetDate: Date = new Date()) {
  let startDate: Date;
  let endDate: Date;
  let interval: Date[];
  let granularity: "day" | "month";

  if (period === "WEEK") {
    startDate = startOfWeek(targetDate, { weekStartsOn: 1 });
    endDate = endOfWeek(targetDate, { weekStartsOn: 1 });
    interval = eachDayOfInterval({ start: startDate, end: endDate });
    granularity = "day";
  } else if (period === "MONTH") {
    startDate = startOfMonth(targetDate);
    endDate = endOfMonth(targetDate);
    interval = eachDayOfInterval({ start: startDate, end: endDate });
    granularity = "day";
  } else {
    startDate = startOfYear(targetDate);
    endDate = endOfYear(targetDate);
    interval = eachMonthOfInterval({ start: startDate, end: endDate });
    granularity = "month";
  }

  const consumptions = await prisma.consumption.findMany({
    where: { category: resource, date: { gte: startDate, lte: endDate } }
  });

  const events = await prisma.dailyEvent.findMany({
    where: { date: { gte: startDate, lte: endDate }, eventType: { category: resource } },
    include: { eventType: true }
  });

  const eventTypesUsed = await prisma.eventType.findMany({
      where: { dailyEvents: { some: { date: { gte: startDate, lte: endDate }, eventType: { category: resource } } } }
  });

  const chartData = interval.map(date => {
    let bucketConsump = 0;
    let bucketEvents = 0;
    let bucketEventCodes: string[] = [];

    if (granularity === "day") {
        bucketConsump = consumptions
            .filter(c => isSameDay(c.date, date))
            .reduce((sum, c) => sum + c.consumption, 0);

        const dayEvents = events.filter(e => isSameDay(e.date, date));
        bucketEvents = dayEvents.length;
        bucketEventCodes = dayEvents.map(e => e.eventType.code);
    } else {
        bucketConsump = consumptions
            .filter(c => isSameMonth(c.date, date))
            .reduce((sum, c) => sum + c.consumption, 0);

        const monthEvents = events.filter(e => isSameMonth(e.date, date));
        bucketEvents = monthEvents.length;
        bucketEventCodes = Array.from(new Set(monthEvents.map(e => e.eventType.code)));
    }

    return {
      name: granularity === "day" ? format(date, "EEE dd") : format(date, "MMM"),
      fullDate: format(date, "yyyy-MM-dd"),
      consumption: bucketConsump,
      events: bucketEvents,
      eventCodes: bucketEventCodes.join(', ') // For labeling
    };
  });

  return {
      chartData,
      eventTypes: eventTypesUsed
  };
}

export async function getReportData(resource: string, period: "WEEK" | "MONTH" | "YEAR", targetDate: Date) {
    let startDate: Date;
    let endDate: Date;

    if (period === "WEEK") {
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

    const total = readings.reduce((sum, r) => sum + r.consumption, 0);
    const avg = readings.length > 0 ? total / readings.length : 0;

    let peakDay = { date: "N/A", value: 0 };
    if (readings.length > 0) {
        const peak = readings.reduce((maxR, r) => r.consumption > maxR.consumption ? r : maxR, readings[0]);
        peakDay = { date: format(peak.date, "dd/MM/yyyy"), value: peak.consumption };
    }

    const events = await prisma.dailyEvent.findMany({
        where: { date: { gte: startDate, lte: endDate }, eventType: { category: resource } },
        include: { eventType: true }
    });

    const eventStats = await prisma.eventType.findMany({
        where: {
            dailyEvents: { some: { date: { gte: startDate, lte: endDate }, eventType: { category: resource } } }
        },
        include: { _count: { select: { dailyEvents: { where: { date: { gte: startDate, lte: endDate } } } } } }
    });

    return {
        readings,
        summary: {
            total: total.toFixed(2),
            average: avg.toFixed(2),
            peak: peakDay,
            eventCount: events.length
        },
        eventTable: eventStats.map(e => ({
            code: e.code,
            description: e.description,
            type: e.type,
            count: (e as any)._count.dailyEvents
        })).sort((a, b) => b.count - a.count),
        periodInfo: {
            start: startDate,
            end: endDate,
            label: period === "WEEK" ? `Week of ${format(startDate, 'dd MMM')}` :
                   period === "MONTH" ? format(startDate, 'MMMM yyyy') :
                   format(startDate, 'yyyy')
        }
    };
}
