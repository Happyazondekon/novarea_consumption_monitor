import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReportData } from "@/lib/queries/consumption";
import ExcelJS from "exceljs";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMINISTRATEUR') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get("resource") || "POWER";
  const period = (searchParams.get("period") || "WEEK") as "WEEK" | "MONTH" | "YEAR";
  const dateStr = searchParams.get("date");
  const targetDate = dateStr ? new Date(dateStr) : new Date();

  try {
    const workbook = new ExcelJS.Workbook();

    const addResourceSheets = async (resType: "POWER" | "WATER") => {
        const data = await getReportData(resType, period, targetDate);
        const prefix = resType === 'POWER' ? 'Power' : 'Water';

        // 1. Data Sheet
        const dataSheet = workbook.addWorksheet(`${prefix} Consumption`);
        dataSheet.columns = [
            { header: 'Date', key: 'date', width: 25 },
            { header: 'Previous Reading', key: 'prev', width: 20 },
            { header: 'Current Reading', key: 'curr', width: 20 },
            { header: `Consumed (${resType === 'POWER' ? 'kWh' : 'm³'})`, key: 'cons', width: 20 }
        ];
        dataSheet.getRow(1).font = { bold: true };
        dataSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };

        data.readings.forEach((r: any) => {
            dataSheet.addRow({
                date: format(new Date(r.date), 'dd/MM/yyyy HH:mm'),
                prev: r.previousValue,
                curr: r.currentValue,
                cons: r.consumption
            });
        });

        // 2. Events Sheet
        const eventSheet = workbook.addWorksheet(`${prefix} Events`);
        eventSheet.columns = [
            { header: 'Event Code', key: 'code', width: 15 },
            { header: 'Description', key: 'desc', width: 40 },
            { header: 'Direction', key: 'type', width: 15 },
            { header: 'Frequency', key: 'count', width: 15 }
        ];
        eventSheet.getRow(1).font = { bold: true };
        eventSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };

        data.eventTable.forEach((e: any) => {
            eventSheet.addRow({
                code: e.code,
                desc: e.description,
                type: e.type,
                count: e.count
            });
        });
    };

    if (resource === 'BOTH') {
        await addResourceSheets("POWER");
        await addResourceSheets("WATER");
    } else {
        await addResourceSheets(resource as any);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="Novarea_${resource}_Report.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error: any) {
    console.error("Excel Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 });
  }
}
