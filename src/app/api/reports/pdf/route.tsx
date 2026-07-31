import { renderToStream } from "@react-pdf/renderer";
import { MonitoringReportPDF } from "@/components/reports/MonitoringReportPDF";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stream = await renderToStream(<MonitoringReportPDF data={{}} />);

    // Convert stream to Buffer
    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Novarea_Report.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
