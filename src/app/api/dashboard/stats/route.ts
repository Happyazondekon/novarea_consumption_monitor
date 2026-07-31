import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getKPICards, getChartData } from "@/lib/queries/consumption";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Restrict global stats to Administrators
    if ((session.user as any).role !== 'ADMINISTRATEUR') {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const resource = searchParams.get("resource") || "POWER";
    const period = (searchParams.get("period") || "WEEK") as "WEEK" | "MONTH" | "YEAR";
    const dateStr = searchParams.get("date");
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    console.log(`[STATS_API] Fetching ${resource} for ${period}...`);

    const [kpis, charts] = await Promise.all([
        getKPICards(resource),
        getChartData(resource, period, targetDate)
    ]);

    return NextResponse.json({
      ...kpis,
      chartData: charts.chartData,
      eventTypes: charts.eventTypes
    });
  } catch (error: any) {
    console.error("[STATS_API_ERROR]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 });
  }
}
