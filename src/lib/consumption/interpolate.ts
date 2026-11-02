import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Rebuilds the Consumption table for one category from the raw meter readings.
 *
 * MODEL: CONTINUOUS 24h INDEX
 * --------------------------------------------------------------------------
 * A day's consumption is `first index of day J+1 - first index of day J`.
 * Every kWh / m3 the meter counted is therefore attributed to exactly one day,
 * and the total over any period equals (last index - first index). The previous
 * "date isolation" model defined a day as evening - morning of the same day,
 * which silently dropped every night: 28 Oct evening 238 287.85 -> 29 Oct
 * morning 238 395.76 meant 107.91 kWh that appeared in no total at all, so a
 * monthly report never reconciled with the physical meter.
 *
 * GAPS: WEIGHTED BY DAY TYPE
 * --------------------------------------------------------------------------
 * When days are missing (quota outage, weekend without a round), the measured
 * delta is spread across the missing days in proportion to what that weekday
 * historically consumes, instead of being divided equally. A Sunday with the
 * plant idle no longer receives the same share as a working Tuesday. The shares
 * always add back up to the measured delta exactly - nothing is invented.
 *
 * The function is idempotent: it deletes and rewrites the whole category, so it
 * is safe to call after any insert, edit or delete of a reading.
 */

/** Site timezone offset (WAT / Africa/Porto-Novo, no DST). */
const SITE_UTC_OFFSET_HOURS = 1;

/** Trailing window used to build the weekday profile, in days. */
const PROFILE_WINDOW_DAYS = 120;

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;

type DayBucket = {
  /** Whole days since the epoch, in site-local time. */
  index: number;
  firstValue: number;
  lastValue: number;
  firstReadingId: string;
  lastReadingId: string;
  firstTs: Date;
  lastTs: Date;
  readingCount: number;
};

type Segment = {
  from: DayBucket;
  to: DayBucket;
  /** Number of calendar days the segment covers: from.index .. to.index - 1. */
  span: number;
  total: number;
};

/** Which site-local calendar day a timestamp belongs to. */
function localDayIndex(ts: Date): number {
  return Math.floor((ts.getTime() + SITE_UTC_OFFSET_HOURS * MS_PER_HOUR) / MS_PER_DAY);
}

/**
 * Noon UTC on the given local day. Anchoring at midday keeps the stored date on
 * the intended calendar day whatever timezone the server or the reader runs in
 * — the queries compare these rows with `isSameDay()` and `format()`, which use
 * the *server's* local zone (UTC on Vercel, UTC+1 locally).
 */
function dayIndexToNoonUtc(index: number): Date {
  return new Date(index * MS_PER_DAY + 12 * MS_PER_HOUR);
}

/** 0 = Sunday. Day 0 of the epoch (1970-01-01) was a Thursday. */
function weekdayOf(dayIndex: number): number {
  return (dayIndex + 4) % 7;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Splits `total` across `weights`, rounded to 2 decimals, guaranteeing that the
 * parts add up to `total` exactly: the rounding residue is pushed onto the
 * heaviest day rather than silently lost.
 */
function distribute(total: number, weights: number[]): number[] {
  const count = weights.length;
  if (count === 0) return [];

  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const exact =
    weightSum > 0
      ? weights.map((w) => (total * w) / weightSum)
      : weights.map(() => total / count); // no usable profile yet -> flat

  const shares = exact.map(round2);
  const drift = round2(total - shares.reduce((sum, s) => sum + s, 0));

  if (drift !== 0) {
    let heaviest = 0;
    for (let i = 1; i < count; i++) {
      if (exact[i] > exact[heaviest]) heaviest = i;
    }
    shares[heaviest] = round2(shares[heaviest] + drift);
  }

  return shares;
}

/** Collapses time-ordered readings into one bucket per site-local day. */
function bucketByDay(readings: { id: string; value: number; timestamp: Date }[]): DayBucket[] {
  const days: DayBucket[] = [];

  for (const reading of readings) {
    const index = localDayIndex(reading.timestamp);
    const current = days[days.length - 1];

    if (current && current.index === index) {
      current.lastValue = reading.value;
      current.lastReadingId = reading.id;
      current.lastTs = reading.timestamp;
      current.readingCount += 1;
    } else {
      days.push({
        index,
        firstValue: reading.value,
        lastValue: reading.value,
        firstReadingId: reading.id,
        lastReadingId: reading.id,
        firstTs: reading.timestamp,
        lastTs: reading.timestamp,
        readingCount: 1,
      });
    }
  }

  return days;
}

/**
 * Average consumption per weekday, built only from fully measured days (two
 * consecutive anchors, no gap) inside the trailing window. Returns a lookup
 * that falls back to the overall average for a weekday we have never measured,
 * and 0 when there is no history at all (which makes `distribute` go flat).
 */
/**
 * Share of a full 24h day that is consumed outside the reading window, i.e.
 * between the evening reading and the next morning's. Derived from the days we
 * fully measured (we know both their intra-day delta and their 24h total)
 * rather than guessed, so it tracks the plant's actual night regime.
 */
function estimateNightFraction(segments: Segment[]): number {
  let sum = 0;
  let count = 0;

  for (const segment of segments) {
    if (segment.span !== 1) continue;
    if (segment.from.readingCount < 2) continue;
    if (segment.total <= 0) continue;

    const dayPart = segment.from.lastValue - segment.from.firstValue;
    const nightPart = segment.total - dayPart;
    if (nightPart < 0) continue;

    sum += Math.min(1, nightPart / segment.total);
    count += 1;
  }

  // Fall back to a third of the day when there is nothing to learn from yet.
  return count > 0 ? sum / count : 0.33;
}

function buildWeekdayProfile(segments: Segment[], latestDayIndex: number) {
  const windowStart = latestDayIndex - PROFILE_WINDOW_DAYS;
  const sums = new Array(7).fill(0);
  const counts = new Array(7).fill(0);

  for (const segment of segments) {
    if (segment.span !== 1) continue;
    if (segment.from.index < windowStart) continue;
    const weekday = weekdayOf(segment.from.index);
    sums[weekday] += segment.total;
    counts[weekday] += 1;
  }

  const measuredTotal = sums.reduce((sum, value) => sum + value, 0);
  const measuredCount = counts.reduce((sum, value) => sum + value, 0);
  const overallAverage = measuredCount > 0 ? measuredTotal / measuredCount : 0;

  return (dayIndex: number): number => {
    const weekday = weekdayOf(dayIndex);
    if (counts[weekday] > 0) return Math.max(0, sums[weekday] / counts[weekday]);
    return overallAverage;
  };
}

export async function recalculateCategoryConsumption(category: string) {
  const readings = await prisma.meterReading.findMany({
    where: { category, isDeleted: false },
    orderBy: { timestamp: "asc" },
    select: { id: true, value: true, timestamp: true },
  });

  await prisma.consumption.deleteMany({ where: { category } });

  if (readings.length < 2) {
    console.log(`[CONSUMPTION] ${category}: fewer than 2 readings, nothing to compute.`);
    return;
  }

  const days = bucketByDay(readings);

  // 1. One segment per pair of consecutive days that carry readings.
  const segments: Segment[] = [];
  for (let i = 0; i + 1 < days.length; i++) {
    const from = days[i];
    const to = days[i + 1];
    let total = to.firstValue - from.firstValue;

    if (total < 0) {
      // A meter only counts up: this is a rollover, a replaced meter or a typo.
      // Clamp to zero so one bad row cannot poison a whole period, but say so
      // loudly instead of hiding it the way the old Math.max(0, delta) did.
      console.warn(
        `[CONSUMPTION] ${category}: index went backwards between ` +
          `${from.firstTs.toISOString()} (${from.firstValue}) and ` +
          `${to.firstTs.toISOString()} (${to.firstValue}). Recorded as 0 — please audit these readings.`
      );
      total = 0;
    }

    segments.push({ from, to, span: to.index - from.index, total });
  }

  const latest = days[days.length - 1];
  const weightFor = buildWeekdayProfile(segments, latest.index);
  const nightFraction = estimateNightFraction(segments);

  // 2. Turn the segments into one row per calendar day.
  const rows: Prisma.ConsumptionCreateManyInput[] = [];

  for (const segment of segments) {
    if (segment.span === 1) {
      rows.push({
        date: dayIndexToNoonUtc(segment.from.index),
        category,
        previousValue: segment.from.firstValue,
        currentValue: segment.to.firstValue,
        consumption: round2(segment.total),
        source: "MEASURED",
        readingId: segment.to.firstReadingId,
      });
      continue;
    }

    // Gap: the measured delta covers from.index .. to.index - 1.
    const gapDayIndexes: number[] = [];
    for (let d = segment.from.index; d < segment.to.index; d += 1) {
      gapDayIndexes.push(d);
    }

    // The first day of a gap is only partly unknown: if it carries two readings
    // we *measured* what it used between them, and that amount is a hard floor
    // on its 24h figure — not merely a hint for the weighting. Reserve it, then
    // share out only the genuinely unknown remainder (that day's night plus the
    // whole missing days). Without this floor, a working Friday we had measured
    // at 1012 kWh could be written down to 554 kWh, which the meter disproves.
    const hasIntraDayMeasure = segment.from.readingCount >= 2;
    const measuredOnFirstDay = hasIntraDayMeasure
      ? Math.min(Math.max(0, segment.from.lastValue - segment.from.firstValue), segment.total)
      : 0;
    const remainder = Math.max(0, segment.total - measuredOnFirstDay);

    const weights = gapDayIndexes.map((dayIndex, position) => {
      if (position !== 0) return weightFor(dayIndex);
      // Day A: only its night is unknown when we measured its daytime;
      // otherwise the whole day is unknown and it gets a full day's weight.
      return hasIntraDayMeasure ? nightFraction * weightFor(dayIndex) : weightFor(dayIndex);
    });

    const shares = distribute(remainder, weights);

    gapDayIndexes.forEach((dayIndex, position) => {
      const isFirstDay = position === 0;
      const consumption = isFirstDay
        ? round2(measuredOnFirstDay + shares[position])
        : shares[position];

      rows.push({
        date: dayIndexToNoonUtc(dayIndex),
        category,
        // Day A's opening index is real, so keep it for the report; its closing
        // index is not knowable, hence null.
        previousValue: isFirstDay ? segment.from.firstValue : null,
        currentValue: null,
        consumption,
        source: "INTERPOLATED",
        gapStartDate: segment.from.firstTs,
        gapEndDate: segment.to.firstTs,
        readingId: segment.to.firstReadingId,
      });
    });
  }

  // 3. The most recent day has no closing anchor yet, so its full 24h figure is
  //    not knowable. Report what has actually been measured on it so far; the
  //    row is replaced by the complete value as soon as the next day is read.
  rows.push({
    date: dayIndexToNoonUtc(latest.index),
    category,
    previousValue: latest.firstValue,
    currentValue: latest.lastValue,
    consumption: round2(Math.max(0, latest.lastValue - latest.firstValue)),
    source: "MEASURED",
    readingId: latest.lastReadingId,
  });

  await prisma.consumption.createMany({ data: rows });

  const interpolated = rows.filter((row) => row.source === "INTERPOLATED").length;
  console.log(
    `[CONSUMPTION] ${category}: ${rows.length} days written ` +
      `(${rows.length - interpolated} measured, ${interpolated} interpolated).`
  );
}
