import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReportData } from "@/lib/queries/consumption";
import ExcelJS from 'exceljs';
import { format } from "date-fns";

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
    const workbook = new ExcelJS.Workbook();
    const resourcesToProcess = resource === "BOTH" ? ["POWER", "WATER"] : [resource];

    for (const res of resourcesToProcess) {
        const data = await getReportData(res, period, targetDate);
        if (data.readings.length === 0 && resource !== "BOTH") {
            return NextResponse.json({ error: "No data" }, { status: 404 });
        }

        const sheetName = `${res}_${data.periodInfo.label}`.substring(0, 31);
        const worksheet = workbook.addWorksheet(sheetName);

        // Define Headers based on client templates
        if (res === "POWER") {
            worksheet.columns = [
                { header: 'Date', key: 'date', width: 20 },
                { header: 'Previous Reading/KWH', key: 'prev', width: 25 },
                { header: 'Current Reading/KWH', key: 'curr', width: 25 },
                { header: 'Current Unit Consumed', key: 'cons', width: 25 },
            ];
        } else {
            worksheet.columns = [
                { header: 'DATE', key: 'date', width: 20 },
                { header: 'PREVIOUS READING/M³', key: 'prev', width: 25 },
                { header: 'CURRENT READING/M³', key: 'curr', width: 25 },
                { header: 'CONSUMMED UNIT/M³', key: 'cons', width: 25 },
            ];
        }

        // Style Headers
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };

        // Add Data Rows
        data.readings.forEach(r => {
            worksheet.addRow({
                date: format(r.date, 'dd/MM/yyyy HH:mm'),
                prev: r.previousValue.toFixed(2),
                curr: r.currentValue.toFixed(2),
                cons: r.consumption.toFixed(2)
            });
        });

        // Add Summary Sheet if it's the only resource or at the end
        const eventSheet = workbook.addWorksheet(`${res}_Events`.substring(0, 31));
        eventSheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Code', key: 'code', width: 10 },
            { header: 'Description', key: 'desc', width: 40 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Precision', key: 'comment', width: 30 },
        ];

        // Style Event Headers
        eventSheet.getRow(1).font = { bold: true };
        eventSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Novarea_${resource}_${period}_${format(new Date(), 'yyyyMMdd')}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Excel Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate Excel" }, { status: 500 });
  }
}
