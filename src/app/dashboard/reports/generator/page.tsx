"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import {
  FileText,
  Download,
  Calendar,
  Zap,
  Droplets,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Filter,
  Eye,
  Settings2,
  PieChart,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';
import { format } from "date-fns";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { useTheme } from "next-themes";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function ReportGeneratorPage() {
  const { resolvedTheme } = useTheme();
  const [resource, setResource] = useState<"POWER" | "WATER">("POWER");
  const [period, setPeriod] = useState<"WEEK" | "MONTH" | "YEAR">("WEEK");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/data?resource=${resource}&period=${period}&date=${date}`);
      if (res.ok) setReportData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resource, period, date]);

  const handleExport = async (type: "pdf" | "excel") => {
    setExporting(type);
    try {
        if (type === 'pdf') {
            const canvas = await html2canvas(chartRef.current!, { scale: 2, backgroundColor: resolvedTheme === 'dark' ? '#09090b' : '#ffffff' });
            const imgData = canvas.toDataURL('image/png');

            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            let currentY = 20;

            // Header
            doc.setFillColor(243, 244, 246);
            doc.rect(0, 0, pageWidth, 40, 'F');
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(31, 41, 55);
            doc.text("NOVAREA TEXTILES BENIN", margin, 25);
            doc.setFontSize(10);
            doc.setTextColor(107, 114, 128);
            doc.text(`UTILITY MONITORING REPORT • ${resource} • ${period}`, margin, 32);

            currentY = 55;
            doc.setFontSize(14);
            doc.setTextColor(37, 99, 235);
            doc.text("Strategic Analytics Summary", margin, currentY);
            currentY += 10;

            // Chart
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = pageWidth - (margin * 2);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            doc.addImage(imgData, 'PNG', margin, currentY, pdfWidth, pdfHeight);
            currentY += pdfHeight + 15;

            // Footer / Metrics
            doc.setDrawColor(229, 231, 235);
            doc.line(margin, currentY, pageWidth - margin, currentY);
            currentY += 15;

            doc.setFontSize(10);
            doc.setTextColor(75, 85, 99);
            doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, margin, currentY);

            doc.save(`Novarea_Report_${resource}_${period}_${format(new Date(), 'yyyyMMdd')}.pdf`);
        } else {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Monitoring Data');
            sheet.columns = [
                { header: 'Date/Period', key: 'name', width: 20 },
                { header: `Consumption (${resource === 'POWER' ? 'kWh' : 'm³'})`, key: 'consumption', width: 25 },
                { header: 'Event Count', key: 'events', width: 15 }
            ];
            reportData.chartData.forEach((row: any) => sheet.addRow(row));
            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `Novarea_Data_${resource}.xlsx`);
        }
        Swal.fire({ title: 'Export Complete', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
        Swal.fire('Export Failed', 'A synchronization error occurred.', 'error');
    } finally {
        setExporting(null);
    }
  };

  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  return (
    <div className="w-full space-y-6 animate-fade-in py-4 lg:py-6 px-4 lg:px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8 px-2">
        <div>
          <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[9px] mb-1.5">Intelligence Unit</p>
          <h1 className="text-3xl lg:text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Generation Tool</h1>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex flex-1 items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-3 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <Calendar className="text-blue-600" size={18} />
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none font-black uppercase text-xs tracking-widest py-1"
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-20 lg:pb-0">
        {/* CONFIGURATION SIDEBAR */}
        <div className="lg:col-span-3 space-y-6">
            <Card className="apple-card p-6 lg:p-8 space-y-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Settings2 size={12}/> Resource</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setResource("POWER")} className={cn("py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2", resource === 'POWER' ? "border-blue-600 bg-blue-50/50 text-blue-600 shadow-sm" : "border-zinc-100 dark:border-zinc-800 text-zinc-400")}>
                                <Zap size={18}/> <span className="text-[9px] font-black uppercase">Power</span>
                            </button>
                            <button onClick={() => setResource("WATER")} className={cn("py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2", resource === 'WATER' ? "border-cyan-500 bg-cyan-50/50 text-cyan-600 shadow-sm" : "border-zinc-100 dark:border-zinc-800 text-zinc-400")}>
                                <Droplets size={18}/> <span className="text-[9px] font-black uppercase">Water</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2"><PieChart size={12}/> Granularity</label>
                        <div className="grid grid-cols-3 gap-1 bg-zinc-200 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            {["WEEK", "MONTH", "YEAR"].map(p => (
                                <button key={p} onClick={() => setPeriod(p as any)} className={cn("py-2 rounded-lg text-[8px] font-black uppercase transition-all", period === p ? "bg-white dark:bg-zinc-700 text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}>{p}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
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

        {/* PREVIEW AREA */}
        <div className="lg:col-span-9 space-y-6">
            <Card className="apple-card p-4 lg:p-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-none shadow-sm min-h-[500px] flex flex-col space-y-8 overflow-x-hidden">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-zinc-400">
                        <Loader2 className="animate-spin text-blue-600" size={40} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Querying Operational Database...</p>
                    </div>
                ) : reportData ? (
                    <>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-xl rotate-3">
                                    <BarChart3 size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-black uppercase tracking-tighter leading-none">Live Document Preview</h3>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">{resource} CONSUMPTION • {period} GRANULARITY</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-900/30 text-left shrink-0 self-start">
                                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Total Consumption</p>
                                <p className="text-lg font-black text-blue-600">{resource === 'POWER' ? reportData.powerToday : reportData.waterToday} {resource === 'POWER' ? 'kWh' : 'm³'}</p>
                            </div>
                        </div>

                        <div ref={chartRef} className="flex-1 bg-white dark:bg-zinc-900 p-2 lg:p-4 rounded-3xl min-h-[400px]">
                            <ResponsiveContainer width="100%" height={400}>
                                <ComposedChart data={reportData.chartData} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: isDark ? '#71717a' : '#52525b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: isDark ? '#71717a' : '#52525b' }} />
                                    <Tooltip content={<CustomTooltip theme={{ bg: isDark ? '#18181b' : '#fff', border: isDark ? '#27272a' : '#e4e4e7', isDark }} />} />
                                    <Bar dataKey="consumption" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={period === 'YEAR' ? 40 : 15} />
                                    <Line type="monotone" dataKey="events" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                             <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">Industrial Metadata Verified by VISSIM Protocols</p>
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[8px] font-black text-zinc-400 uppercase">Production Ready</span>
                             </div>
                        </div>
                    </>
                ) : null}
            </Card>
        </div>
      </div>
    </div>
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
          <div className="space-y-1 text-left">
            <div className="flex items-center justify-between gap-4">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Usage</span>
                <span className="text-xs font-black" style={{ color: theme.isDark ? '#fff' : '#18181b' }}>{payload[0].value.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-6 border-t border-zinc-200 dark:border-white/5 pt-1">
                <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Events</span>
                <span className="text-xs font-black text-red-500">{payload[1].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
};
