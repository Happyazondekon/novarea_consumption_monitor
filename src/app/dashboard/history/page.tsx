"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import {
  Zap,
  Droplets,
  Filter,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Clock,
  Calendar,
  FileText,
  Eye,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';
import { format, isSameDay } from "date-fns";

export default function HistoryPage() {
  const [filter, setFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReading, setSelectedReading] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/readings");
      if (res.ok) setHistory(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(h => {
    const matchesCat = filter === "ALL" || h.category === filter;
    const matchesDate = !dateFilter || isSameDay(new Date(h.timestamp), new Date(dateFilter));
    return matchesCat && matchesDate;
  });

  if (selectedReading) {
    return (
        <div id="history-details" className="w-full space-y-6 animate-fade-in py-4 lg:py-8 px-4 lg:px-6 text-left relative selection:bg-blue-500/30">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Submission Details</h2>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Archived Log • ID: {selectedReading.id.substring(0,8)}</p>
                </div>
                <button onClick={() => setSelectedReading(null)} className="btn-outline px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                    <ArrowLeft size={14} className="mr-2"/> Back
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-6">
                    <Card id="reading-summary-card" className="p-8 space-y-8 bg-white dark:bg-zinc-900 rounded-[2rem] border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center",
                                selectedReading.category === 'POWER' ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600"
                            )}>
                                {selectedReading.category === 'POWER' ? <Zap size={32} /> : <Droplets size={32} />}
                            </div>
                            <div>
                                <h3 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">{selectedReading.value.toFixed(2)}</h3>
                                <p className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] mt-2">{selectedReading.category === 'POWER' ? 'Kilowatt-Hours' : 'Cubic Meters'}</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Capture Timestamp</p>
                                <p className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase">{format(new Date(selectedReading.timestamp), 'dd MMM yyyy, HH:mm')}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">System Status</p>
                                <span className={cn(
                                    "text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block",
                                    selectedReading.isEdited ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                                )}>
                                    {selectedReading.isEdited ? "Audit Pending" : "Verified"}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card id="visual-evidence-card" className="p-6 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center group overflow-hidden relative min-h-[300px]">
                    {selectedReading.photoUrl ? (
                        <>
                            <div className="flex items-center gap-2 mb-6 self-start px-2">
                                <FileText size={16} className="text-zinc-400" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Visual Evidence</h3>
                            </div>
                            <div className="w-full h-full max-h-[400px] rounded-2xl overflow-hidden relative shadow-inner bg-zinc-50 dark:bg-zinc-800/50">
                                <img src={selectedReading.photoUrl} alt="Meter" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={() => setShowPreview(true)} className="btn-primary scale-90">View Full Photo</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-[10px] font-black uppercase text-zinc-300">No visual proof attached</p>
                    )}
                </Card>
            </div>

            {showPreview && selectedReading.photoUrl && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300 p-4 lg:p-8">
                    <button onClick={() => setShowPreview(false)} className="absolute top-6 lg:top-8 right-6 lg:right-8 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                        <X size={32} />
                    </button>
                    <div className="relative w-full max-w-4xl h-full max-h-[85vh] rounded-3xl lg:rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10">
                        <img src={selectedReading.photoUrl} alt="Full Proof" className="w-full h-full object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in py-4 lg:py-6 px-4 lg:px-6 text-left selection:bg-blue-500/30">
      <div id="history-header" className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 px-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-600 mb-0.5">Archive Control</p>
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Capture History</h1>
          <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest mt-1">Review your submitted readings</p>
        </div>
        <div id="history-date-filter" className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex flex-1 items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <Calendar className="text-blue-600" size={16} />
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none font-black uppercase text-[10px] tracking-widest py-1 w-full"
                />
                {dateFilter && <button onClick={() => setDateFilter("")} className="text-zinc-400"><X size={14}/></button>}
            </div>
        </div>
      </div>

      <div id="history-type-filters" className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-zinc-200 dark:border-zinc-800 px-2">
        {["ALL", "POWER", "WATER"].map((t) => (
            <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                "px-4 py-2 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0",
                filter === t ? "border-blue-600 text-blue-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
                )}
            >
                {t}
            </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-zinc-400">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-[9px] font-black uppercase tracking-widest">Accessing Archives...</p>
        </div>
      ) : (
        <>
            <div id="history-list-mobile" className="lg:hidden grid grid-cols-1 gap-3 px-2 pb-20">
                {filteredHistory.map(item => (
                    <div
                        key={item.id}
                        onClick={() => setSelectedReading(item)}
                        className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                item.category === 'POWER' ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600"
                            )}>
                                {item.category === 'POWER' ? <Zap size={18}/> : <Droplets size={18}/>}
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[12px] font-black text-zinc-900 dark:text-white uppercase leading-none">
                                    {item.value.toFixed(2)}
                                    <span className="text-[8px] text-zinc-400 ml-1">{item.category === 'POWER' ? 'kWh' : 'm³'}</span>
                                </p>
                                <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1">
                                    {format(new Date(item.timestamp), 'dd MMM, HH:mm')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             {item.isEdited ? <AlertCircle size={14} className="text-orange-400" /> : <CheckCircle2 size={14} className="text-green-500" />}
                             <ChevronRight size={14} className="text-zinc-300" />
                        </div>
                    </div>
                ))}
            </div>

            <div id="history-table-desktop" className="hidden lg:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm mx-2">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] bg-zinc-100 dark:bg-zinc-800/20">
                        <th className="px-8 py-4">Captured Timestamp</th>
                        <th className="px-8 py-4">Utility Type</th>
                        <th className="px-8 py-4 text-right">Captured Index</th>
                        <th className="px-8 py-4 text-center">Status</th>
                        <th className="px-8 py-4 text-right pr-12">Audit</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredHistory.map((item) => (
                        <tr key={item.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                        <td className="px-8 py-4">
                            <div className="flex flex-col text-left">
                                <span className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase leading-none">{format(new Date(item.timestamp), 'dd MMM yyyy')}</span>
                                <span className="text-[8px] text-zinc-400 font-bold uppercase mt-1">{format(new Date(item.timestamp), 'HH:mm')} • {item.timeOfDay}</span>
                            </div>
                        </td>
                        <td className="px-8 py-4">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                "p-1.5 rounded-lg",
                                item.category === "POWER" ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600"
                                )}>
                                {item.category === "POWER" ? <Zap size={12} /> : <Droplets size={12} />}
                                </div>
                                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">{item.category}</span>
                            </div>
                        </td>
                        <td className="px-8 py-4 text-right font-black text-base text-zinc-900 dark:text-white tracking-tighter">
                            {item.value.toFixed(2)}
                            <span className="text-[8px] text-zinc-400 ml-1.5 uppercase">{item.category === "POWER" ? "kWh" : "m³"}</span>
                        </td>
                        <td className="px-8 py-4">
                            <div className="flex justify-center">
                                {item.isEdited ? (
                                    <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-orange-50 text-orange-500">
                                        <AlertCircle size={12} />
                                        <span className="text-[7px] font-black uppercase">Pending</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-green-50 text-green-500">
                                        <CheckCircle2 size={12} />
                                        <span className="text-[7px] font-black uppercase">Verified</span>
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="px-8 py-4 text-right pr-12">
                            <button
                                onClick={() => setSelectedReading(item)}
                                className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-400 hover:text-blue-600 hover:bg-white transition-all flex items-center justify-center shadow-sm"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {filteredHistory.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem]">
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Zero historical logs detected</p>
                </div>
            )}
        </>
      )}
    </div>
  );
}
