"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import {
  FileText, Calendar, Zap, Droplets,
  ChevronRight, ArrowLeft, Loader2, Save, Download,
  Settings2, Activity, TrendingUp, BarChart3, Search,
  Eye, FileSpreadsheet, CheckCircle2, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import Link from "next/link";
import Swal from 'sweetalert2';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { format } from "date-fns";

export default function ReportGeneratorPage() {
  const { resolvedTheme } = useTheme();
  const [period, setPeriod] = useState<"WEEK" | "MONTH" | "YEAR">("WEEK");
  const [resource, setResource] = useState<"POWER" | "WATER" | "BOTH">("POWER");
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  const [powerPreview, setPowerPreview] = useState<any>(null);
  const [waterPreview, setWaterPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const powerChartRef = useRef<HTMLDivElement>(null);
  const waterChartRef = useRef<HTMLDivElement>(null);

  // High-contrast theme colors for generator preview
  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.2)";
  const axisColor = isDark ? "#a1a1aa" : "#18181b";
  const tooltipBg = isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 1)";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)";

  const fetchPreviews = async () => {
    setLoading(true);
    try {
        if (resource === "POWER" || resource === "BOTH") {
            const res = await fetch(`/api/dashboard/stats?resource=POWER&period=${period}&date=${targetDate}`);
            if (res.ok) setPowerPreview(await res.json());
        } else {
            setPowerPreview(null);
        }
        if (resource === "WATER" || resource === "BOTH") {
            const res = await fetch(`/api/dashboard/stats?resource=WATER&period=${period}&date=${targetDate}`);
            if (res.ok) setWaterPreview(await res.json());
        } else {
            setWaterPreview(null);
        }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreviews();
  }, [period, resource, targetDate]);

  const generatePDF = async () => {
    setExporting("pdf");
    try {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let currentY = 25;

        // HEADER
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(31, 41, 55);
        doc.text("Integrated Consumption Monitoring Report", margin, currentY);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128);
        currentY += 8;
        doc.text(`Novarea Textiles Benin • Period: ${period} • Date: ${format(new Date(targetDate), 'PPP')}`, margin, currentY);

        currentY += 10;
        doc.setDrawColor(229, 231, 235);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 15;

        const processResource = async (data: any, ref: any, title: string, unit: string) => {
            if (!data) return;

            if (currentY > 200) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(31, 41, 55);
            doc.text(title, margin, currentY);
            currentY += 10;

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`Total Period: ${data.powerToday || data.waterToday} ${unit}`, margin, currentY);
            doc.text(`Daily Avg: ${data.dailyAverage} ${unit}`, margin + 60, currentY);
            doc.text(`Logged Events: ${data.eventsToday}`, margin + 120, currentY);
            currentY += 10;

            // CAPTURE CHART
            if (ref.current) {
                const canvas = await html2canvas(ref.current, { scale: 2 });
                const imgData = canvas.toDataURL("image/png");
                const imgWidth = pageWidth - (margin * 2);
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
                currentY += imgHeight + 15;
            }

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("Consumption Log", margin, currentY);
            currentY += 5;

            const reportDataRes = await fetch(`/api/reports/data?resource=${title.includes('Electricity') ? 'POWER' : 'WATER'}&period=${period}&date=${targetDate}`);
            const reportData = await reportDataRes.json();

            autoTable(doc, {
                startY: currentY,
                head: [['Date', 'Previous Reading', 'Current Reading', 'Consumed']],
                body: reportData.readings.map((r: any) => [
                    format(new Date(r.date), 'dd/MM/yyyy HH:mm'),
                    r.previousValue.toFixed(2),
                    r.currentValue.toFixed(2),
                    r.consumption.toFixed(2)
                ]),
                theme: 'striped',
                headStyles: {
                  fillColor: [229, 231, 235], // LIGHT GRAY for ink economy
                  textColor: [31, 41, 55],    // Dark text
                  fontStyle: 'bold'
                },
                styles: { fontSize: 8, cellPadding: 3 },
                margin: { left: margin, right: margin }
            });

            if (reportData.eventTable.length > 0) {
                doc.addPage();
                currentY = 20;
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.text("Operational Anomalies & Context", margin, currentY);

                autoTable(doc, {
                    startY: currentY + 5,
                    head: [['Code', 'Description', 'Direction', 'Freq']],
                    body: reportData.eventTable.map((e: any) => [e.code, e.description, e.type, e.count]),
                    theme: 'striped',
                    headStyles: {
                      fillColor: [229, 231, 235], // LIGHT GRAY for ink economy
                      textColor: [31, 41, 55],    // Dark text
                      fontStyle: 'bold'
                    },
                    styles: { fontSize: 8 },
                    margin: { left: margin, right: margin }
                });

                const finalY = (doc as any).lastAutoTable.finalY;
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text("Event Definitions Reference:", margin, finalY + 10);
                let noteY = finalY + 15;
                reportData.eventTable.forEach((et: any) => {
                    doc.text(`* ${et.code}: ${et.description}`, margin, noteY);
                    noteY += 4;
                });
            }

            currentY = 20;
        };

        if (resource === "POWER" || resource === "BOTH") {
            await processResource(powerPreview, powerChartRef, "Electricity Consumption Analytics", "kWh");
        }

        if (resource === "WATER" || resource === "BOTH") {
            await processResource(waterPreview, waterChartRef, "Water Flow Monitoring", "m³");
        }

        doc.save(`Novarea_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
        Swal.fire({ title: 'Success', text: 'PDF Generated', icon: 'success', timer: 1500 });
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Failed to generate PDF', 'error');
    } finally {
        setExporting(null);
    }
  };

  const handleExport = async (formatType: "pdf" | "excel") => {
    if (formatType === "pdf") {
        await generatePDF();
        return;
    }

    setExporting("excel");
    try {
      const url = `/api/reports/excel?resource=${resource}&period=${period}&date=${targetDate}`;
      const res = await fetch(url);

      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `Novarea_${resource}_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        Swal.fire({ title: 'Success', text: 'Excel Exported', icon: 'success', timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to generate Excel', 'error');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in py-6 px-4 lg:px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 px-2">
        <div>
          <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[9px] mb-1">Reports Hub</p>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Generation Center</h1>
          <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest mt-2">Professional Document Builder</p>
        </div>
        <Link href="/dashboard/reports" className="btn-outline px-5 py-2 text-[9px] font-black uppercase">
          <ArrowLeft size={14} className="mr-2"/> Back to Audit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 space-y-8 bg-white dark:bg-zinc-900 border-none shadow-sm rounded-3xl">
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <Settings2 className="text-blue-600" size={16} />
                        <h3 className="text-xs font-black uppercase tracking-widest">Setup</h3>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Period</label>
                        <div className="grid grid-cols-3 gap-1 bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            {["WEEK", "MONTH", "YEAR"].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p as any)}
                                    className={cn(
                                        "py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                        period === p ? "bg-white dark:bg-zinc-700 text-blue-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Scope</label>
                        <div className="grid grid-cols-1 gap-2">
                            <ResourceToggle label="Electricity" icon={Zap} active={resource === "POWER"} onClick={() => setResource("POWER")} color="text-blue-600" />
                            <ResourceToggle label="Water" icon={Droplets} active={resource === "WATER"} onClick={() => setResource("WATER")} color="text-cyan-600" />
                            <ResourceToggle label="Combined" icon={Activity} active={resource === "BOTH"} onClick={() => setResource("BOTH")} color="text-purple-600" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[8px] font-black text-zinc-400 uppercase tracking-widest ml-1">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <input
                                type="date"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2 pt-6 border-t border-zinc-50 dark:border-zinc-800">
                    <button
                        disabled={!!exporting || loading}
                        onClick={() => handleExport("pdf")}
                        className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 text-[10px] font-black uppercase tracking-widest"
                    >
                        {exporting === 'pdf' ? <Loader2 className="animate-spin" size={16}/> : <FileText size={16}/>}
                        Export PDF
                    </button>
                    <button
                        disabled={!!exporting || loading}
                        onClick={() => handleExport("excel")}
                        className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        {exporting === 'excel' ? <Loader2 className="animate-spin" size={16}/> : <FileSpreadsheet size={16}/>}
                        Export Excel
                    </button>
                </div>
            </Card>
        </div>

        <div className="lg:col-span-9 space-y-6">
            <Card className="apple-card p-8 bg-white dark:bg-zinc-900 border-none shadow-sm min-h-[500px] flex flex-col space-y-8">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-4">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Querying Records...</p>
                    </div>
                ) : (
                    <>
                        {(resource === 'POWER' || resource === 'BOTH') && powerPreview && (
                            <div ref={powerChartRef}>
                                <PreviewSection
                                  data={powerPreview}
                                  title="Electricity Analytics"
                                  color="#3b82f6"
                                  unit="kWh"
                                  period={period}
                                  theme={{ gridColor, axisColor, tooltipBg, tooltipBorder, isDark }}
                                />
                            </div>
                        )}
                        {(resource === 'WATER' || resource === 'BOTH') && waterPreview && (
                            <div ref={waterChartRef}>
                                <PreviewSection
                                  data={waterPreview}
                                  title="Water Flow Analytics"
                                  color="#06b6d4"
                                  unit="m³"
                                  period={period}
                                  theme={{ gridColor, axisColor, tooltipBg, tooltipBorder, isDark }}
                                />
                            </div>
                        )}
                        {(!powerPreview && !waterPreview) && (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-20 py-20">
                                <Search size={64} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Adjust filters to see preview</p>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ data, title, color, unit, period, theme }: any) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 bg-white dark:bg-zinc-900 p-4 rounded-3xl">
            <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-800 pb-4 px-2">
                <h3 className="text-base font-black uppercase tracking-tighter" style={{ color: theme.isDark ? '#fff' : '#18181b' }}>{title}</h3>
                <div className="flex gap-8">
                    <StatMini label="Sum" value={data.powerToday || data.waterToday} unit={unit} theme={theme} />
                    <StatMini label="Avg" value={data.dailyAverage} unit={unit} theme={theme} />
                    <StatMini label="Notes" value={data.eventsToday} unit="LOG" theme={theme} />
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.gridColor} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: theme.axisColor }} dy={10} />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: theme.axisColor }} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#ef4444' }} />
                        <Tooltip content={<CustomTooltip theme={theme} />} />
                        <Bar yAxisId="left" dataKey="consumption" fill={color} radius={[4, 4, 0, 0]} barSize={period === "YEAR" ? 30 : 10} />
                        <Line yAxisId="right" type="monotone" dataKey="events" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }}>
                            <LabelList dataKey="eventCodes" position="top" style={{ fontSize: '9px', fontWeight: 900, fill: '#ef4444', fontStyle: 'italic' }} />
                        </Line>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function StatMini({ label, value, unit, theme }: any) {
    return (
        <div className="text-right">
            <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-black leading-none mt-0.5" style={{ color: theme.isDark ? '#fff' : '#18181b' }}>
                {value} <span className="text-[8px] opacity-30">{unit}</span>
            </p>
        </div>
    );
}

function ResourceToggle({ label, icon: Icon, active, onClick, color }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group",
                active
                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                    : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn("p-1.5 rounded-lg bg-white dark:bg-zinc-800 shadow-sm", active ? "text-blue-600" : color)}>
                    <Icon size={14} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </div>
            {active && <CheckCircle2 size={16} />}
        </button>
    );
}

const CustomTooltip = ({ active, payload, label, theme }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="backdrop-blur-md border p-3 rounded-xl shadow-2xl transition-colors duration-300"
          style={{ backgroundColor: theme.bg, borderColor: theme.border }}
        >
          <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: theme.isDark ? '#fff' : '#18181b' }}>{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Usage</span>
                <span className="text-xs font-black" style={{ color: theme.isDark ? '#fff' : '#18181b' }}>{payload[0].value.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-6 border-t border-zinc-100 dark:border-white/5 pt-1">
                <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Events</span>
                <span className="text-xs font-black text-red-500">{payload[1].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
};
