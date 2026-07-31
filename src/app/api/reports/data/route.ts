import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReportData } from "@/lib/queries/consumption";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Restrict to Administrators
  if ((session.user as any).role !== 'ADMINISTRATEUR') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") || "POWER";
  const period = (searchParams.get("period") || "WEEK") as "WEEK" | "MONTH" | "YEAR";
  const dateStr = searchParams.get("date");
  const targetDate = dateStr ? new Date(dateStr) : new Date();

  try {
    const data = await getReportData(resource, period, targetDate);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
