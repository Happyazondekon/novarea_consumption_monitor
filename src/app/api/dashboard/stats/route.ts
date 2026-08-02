import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getKPICards, getChartData } from "@/lib/queries/consumption";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== 'ADMINISTRATEUR') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const resource = searchParams.get("resource") || "POWER";
    const period = (searchParams.get("period") || "WEEK") as "WEEK" | "MONTH" | "YEAR" | "CUSTOM";
    const dateStr = searchParams.get("date");
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    const customStart = searchParams.get("customStart") ? new Date(searchParams.get("customStart")!) : undefined;
    const customEnd = searchParams.get("customEnd") ? new Date(searchParams.get("customEnd")!) : undefined;
    const aggregation = (searchParams.get("aggregation") || "DAY") as "DAY" | "WEEK" | "MONTH";

    console.log(`[STATS_API] Fetching ${resource} for ${period} (Agg: ${aggregation})...`);

    // Updated: getKPICards now receives temporal filters to sync metrics
    const [kpis, charts] = await Promise.all([
        getKPICards(resource, targetDate, period, customStart, customEnd),
        getChartData(resource, period, targetDate, customStart, customEnd, aggregation)
    ]);

    return NextResponse.json({
      ...kpis,
      ...charts
    });
  } catch (error: any) {
    console.error("[STATS_API_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 });
  }
}
