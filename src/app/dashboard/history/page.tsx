"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import {
  History, Clock, Zap, Droplets, Filter,
  ChevronRight, Eye, Search, CheckCircle2,
  AlertCircle, Loader2, X, ArrowLeft, Camera,
  Calendar, Trash2, Check, MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';
import { format, isSameDay } from "date-fns";

export default function HistoryPage() {
  const { data: session } = useSession();
  const [filter, setFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "details">("table");
  const [selectedReading, setSelectedReading] = useState<any>(null);

  // Batch State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/readings");
      if (res.ok) setReadings(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleOpenDetails = (reading: any) => {
    setSelectedReading(reading);
    setViewMode("details");
  };

  // Batch Logic
  const filteredReadings = readings.filter(h => {
    const matchesCat = filter === "ALL" || h.category === filter;
    const matchesDate = !dateFilter || isSameDay(new Date(h.timestamp), new Date(dateFilter));
    return matchesCat && matchesDate;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReadings.length) {
        setSelectedIds([]);
    } else {
        setSelectedIds(filteredReadings.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBatchDelete = async () => {
    const result = await Swal.fire({
        title: 'Batch Delete',
        text: `Permanently delete ${selectedIds.length} readings?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
        setProcessing(true);
        try {
            const res = await fetch("/api/readings/batch", {
                method: "POST",
                body: JSON.stringify({ ids: selectedIds, action: "DELETE" })
            });
            if (res.ok) {
                Swal.fire('Deleted', 'Records removed from your history.', 'success');
                setSelectedIds([]);
                fetchHistory();
            }
        } finally {
            setProcessing(false);
        }
    }
  };

  if (viewMode === "details" && selectedReading) {
    return (
        <div className="w-full space-y-6 animate-fade-in py-8 px-4 lg:px-6 text-left relative">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Submission Evidence</h2>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Archived Log • ID {selectedReading.id.substring(0,8).toUpperCase()}</p>
                </div>
                <button onClick={() => setViewMode("table")} className="btn-outline px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                    <ArrowLeft size={12} className="mr-2"/> Back to History
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card className="p-8 space-y-8 bg-white dark:bg-zinc-900 rounded-[2rem] border-none shadow-sm flex flex-col justify-center">
                        <div className="space-y-4 text-center">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Meter Index Value</label>
                            <div className="flex flex-col items-center">
                                <span className="text-7xl font-black text-zinc-900 dark:text-white">{selectedReading.value.toFixed(2)}</span>
                                <div className="mt-4 text-blue-600 font-black text-xl tracking-widest uppercase">
                                    {selectedReading.category === "POWER" ? "kWh" : "m³"}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-50 dark:border-zinc-800 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest text-left">Timestamp</p>
                                <p className="text-[11px] font-bold uppercase text-left">{format(new Date(selectedReading.timestamp), 'dd MMM yyyy HH:mm')}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Status</p>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-md text-[8px] font-black uppercase inline-block",
                                    selectedReading.isEdited ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"
                                )}>
                                    {selectedReading.isEdited ? "Audit Pending" : "Verified"}
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-zinc-900 text-white rounded-[2rem] border-none">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <CheckCircle2 size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest">Log Integrity</p>
                                <p className="text-[9px] text-zinc-500 font-medium">This record is securely stored and timestamped.</p>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="p-6 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-none shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Camera size={16} className="text-zinc-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Captured Visual Proof</span>
                        </div>
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{selectedReading.timeOfDay} Shift</span>
                    </div>
                    <div className="flex-1 rounded-[1.8rem] bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden border border-zinc-100 dark:border-zinc-800 relative shadow-inner flex items-center justify-center">
                        {selectedReading.photoUrl ? (
                            <img src={selectedReading.photoUrl} alt="Meter Proof" className="w-full h-full object-contain" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-300">
                                <Camera size={48} className="opacity-10" />
                                <p className="text-[9px] font-black uppercase mt-3">Proof Missing</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in py-6 px-4 lg:px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 px-2">
        <div>
          <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[9px] mb-0.5">Field Logs</p>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Personal History</h1>
          <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest mt-1">Review your submitted readings and status</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <Calendar className="text-blue-600" size={16} />
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-transparent border-none outline-none font-black uppercase text-[10px] tracking-widest py-1"
                />
                {dateFilter && <button onClick={() => setDateFilter("")} className="text-zinc-400 hover:text-red-500"><X size={14}/></button>}
            </div>
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors" size={14} />
              <input
                type="text"
                placeholder="SEARCH YOUR LOGS..."
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-600/10 transition-all min-w-[200px]"
              />
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
          <div className="flex gap-2">
            {["ALL", "POWER", "WATER"].map((t) => (
                <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                    "px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 transition-all",
                    filter === t ? "border-blue-600 text-blue-600" : "border-transparent text-zinc-400 hover:text-zinc-600"
                    )}
                >
                    {t}
                </button>
            ))}
          </div>

          {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 animate-in slide-in-from-right-4 duration-300">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    {selectedIds.length} SELECTED
                  </span>
                  <button
                    onClick={handleBatchDelete}
                    disabled={processing}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-lg text-[9px] font-black uppercase border border-red-100 hover:bg-red-100 transition-all"
                  >
                    {processing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14}/>} Batch Delete
                  </button>
                  <button onClick={() => setSelectedIds([])} className="p-2 text-zinc-400 hover:text-zinc-600"><X size={16}/></button>
              </div>
          )}
      </div>

      <Card className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm mx-2">
        {loading ? (
           <div className="p-20 flex flex-col items-center justify-center gap-4 text-zinc-400">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-[9px] font-black uppercase tracking-widest">Loading History...</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] bg-zinc-50/50 dark:bg-zinc-800/20">
                    <th className="px-6 py-4 w-10">
                        <button
                            onClick={toggleSelectAll}
                            className={cn(
                                "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                                selectedIds.length === filteredReadings.length && filteredReadings.length > 0
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "border-zinc-300 dark:border-zinc-700"
                            )}
                        >
                            {selectedIds.length === filteredReadings.length && filteredReadings.length > 0 && <Check size={12} strokeWidth={4} />}
                        </button>
                    </th>
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Meter Reading</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right pr-10">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                  {filteredReadings.map((item) => (
                    <tr
                        key={item.id}
                        className={cn(
                            "group transition-all cursor-pointer",
                            selectedIds.includes(item.id) ? "bg-blue-50/30 dark:bg-blue-900/10" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                        )}
                        onClick={() => toggleSelect(item.id)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => toggleSelect(item.id)}
                            className={cn(
                                "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                                selectedIds.includes(item.id)
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "border-zinc-200 dark:border-zinc-800 group-hover:border-blue-400"
                            )}
                        >
                            {selectedIds.includes(item.id) && <Check size={10} strokeWidth={4} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col text-left">
                            <span className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase leading-none">
                               {new Date(item.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                               {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <div className={cn(
                              "p-1.5 rounded-lg flex items-center justify-center",
                              item.category === "POWER" ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600"
                            )}>
                               {item.category === "POWER" ? <Zap size={12} /> : <Droplets size={12} />}
                            </div>
                            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">{item.category}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-base text-zinc-900 dark:text-white tracking-tighter">
                         {item.value.toFixed(2)}
                         <span className="text-[8px] text-zinc-400 ml-1 uppercase">{item.category === "POWER" ? "kWh" : "m³"}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex justify-center">
                            <div className={cn(
                              "p-1.5 rounded-lg flex items-center justify-center",
                              item.isEdited ? "bg-orange-50 text-orange-500" : "bg-green-50 text-green-500"
                            )}>
                               {item.isEdited ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right pr-10" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenDetails(item)}
                            className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center ml-auto shadow-sm border border-transparent hover:border-blue-100"
                          >
                             <Eye size={14} />
                          </button>
                      </td>
                    </tr>
                  ))}
                  {filteredReadings.length === 0 && (
                    <tr>
                        <td colSpan={6} className="p-20 text-center text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                            No archived readings found.
                        </td>
                    </tr>
                  )}
                </tbody>
             </table>
          </div>
        )}
      </Card>
    </div>
  );
}
