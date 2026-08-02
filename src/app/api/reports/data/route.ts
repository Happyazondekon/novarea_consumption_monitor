import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReportData } from "@/lib/queries/consumption";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const data = await getReportData(resource, period, targetDate, customStart, customEnd, aggregation);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[REPORT_DATA_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
