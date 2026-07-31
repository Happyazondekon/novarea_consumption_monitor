import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getReportData } from "@/lib/queries/consumption";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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
    const doc = new jsPDF();
    const resourcesToProcess = resource === "BOTH" ? ["POWER", "WATER"] : [resource];

    // PAGE 1: COVER
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 297, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("NOVAREA TEXTILES BENIN", 105, 100, { align: "center" });

    doc.setFontSize(16);
    doc.text("Integrated Consumption Monitoring Report", 105, 120, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Resource Coverage: ${resource}`, 105, 140, { align: "center" });
    doc.text(`Audit Period: ${period}`, 105, 150, { align: "center" });
    doc.text(`Official Log Date: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 160, { align: "center" });

    for (const res of resourcesToProcess) {
        const data = await getReportData(res, period, targetDate);

        doc.addPage();
        doc.setTextColor(31, 41, 55);

        doc.setFillColor(31, 41, 55);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(`${res} ANALYTICS - ${data.periodInfo.label}`, 15, 10);

        doc.setTextColor(31, 41, 55);
        doc.setFontSize(8);
        doc.text("TOTAL PERIOD", 15, 25);
        doc.setFontSize(12);
        doc.text(`${data.summary.total} ${res === 'POWER' ? 'kWh' : 'm³'}`, 15, 30);

        doc.setFontSize(8);
        doc.text("DAILY AVERAGE", 70, 25);
        doc.setFontSize(12);
        doc.text(`${data.summary.average} ${res === 'POWER' ? 'kWh' : 'm³'}`, 70, 30);

        doc.setFontSize(8);
        doc.text("PEAK LOG", 125, 25);
        doc.setFontSize(10);
        doc.text(`${data.summary.peak.date}`, 125, 30);

        doc.setFontSize(8);
        doc.text("ANOMALIES", 175, 25);
        doc.setFontSize(12);
        doc.text(`${data.summary.eventCount}`, 175, 30);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${res} CONSUMPTION LOG`, 15, 45);

        autoTable(doc, {
            startY: 50,
            head: [['Date', 'Previous', 'Current', 'Consumed']],
            body: data.readings.map(r => [
                format(r.date, 'dd/MM/yyyy'),
                r.previousValue.toFixed(2),
                r.currentValue.toFixed(2),
                r.consumption.toFixed(2)
            ]),
            headStyles: { fillColor: [31, 41, 55] },
            alternateRowStyles: { fillColor: [245, 247, 250] },
            styles: { fontSize: 8 },
            margin: { left: 15, right: 15 }
        });

        doc.addPage();
        doc.setFillColor(31, 41, 55);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(`${res} - OPERATIONAL ANOMALIES & CONTEXT`, 15, 10);

        if (data.eventTable.length > 0) {
            autoTable(doc, {
                startY: 25,
                head: [['Code', 'Description', 'Direction', 'Frequency']],
                body: data.eventTable.map(e => [e.code, e.description, e.type, e.count]),
                headStyles: { fillColor: [31, 41, 55] },
                alternateRowStyles: { fillColor: [245, 247, 250] },
                styles: { fontSize: 9 },
                margin: { left: 15, right: 15 }
            });

            const finalYEvents = (doc as any).lastAutoTable.finalY || 100;
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text("Event Reference Notes:", 15, finalYEvents + 15);

            doc.setFont("helvetica", "normal");
            let noteY = finalYEvents + 22;
            data.eventTable.forEach(et => {
                if (noteY > 280) { doc.addPage(); noteY = 20; }
                doc.text(`* ${et.code} : ${et.description} (Categorized: ${et.type})`, 15, noteY);
                noteY += 5;
            });
        } else {
            doc.setTextColor(150, 150, 150);
            doc.text("No anomalies recorded for this resource in the selected period.", 15, 30);
        }
    }

    const pdfBuffer = doc.output('arraybuffer');

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Novarea_${resource}_Report_${format(new Date(), 'yyyyMMdd')}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF Generation Error:", error);
    return NextResponse.json({ error: "Failed to generate PDF: " + error.message }, { status: 500 });
  }
}
