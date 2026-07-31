"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import {
  Zap, Droplets, Filter,
  ChevronRight, Search,
  CheckCircle2, AlertCircle, Loader2, X, Clock, User, Camera, ArrowLeft, Pencil, Save, Trash2, Upload, Check, FileText, Eye, Calendar, MousePointer2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';
import { format, isSameDay } from "date-fns";

export default function ReportsPage() {
  const [filter, setFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "edit">("table");
  const [selectedReading, setSelectedReading] = useState<any>(null);

  // Batch State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  // Edit State
  const [editValue, setEditValue] = useState("");
  const [editPhotoData, setEditPhotoData] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/readings");
      if (res.ok) setReadings(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const handleOpenEdit = (reading: any) => {
    setSelectedReading(reading);
    setEditValue(reading.value.toString());
    setEditPhotoData(reading.photoUrl || null);
    setEditFileName(null);
    setViewMode("edit");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (reading: any, validateOnly = false) => {
    const targetId = validateOnly ? reading.id : selectedReading.id;
    const targetValue = validateOnly ? reading.value : editValue;
    const targetPhoto = validateOnly ? reading.photoUrl : editPhotoData;

    setUpdating(true);
    try {
      const res = await fetch(`/api/readings/${targetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: targetValue,
          photoUrl: targetPhoto,
          isEdited: !validateOnly
        })
      });

      if (res.ok) {
        Swal.fire({ title: 'Success', text: validateOnly ? 'Reading validated' : 'Reading updated', icon: 'success', timer: 1500, showConfirmButton: false });
        setViewMode("table");
        fetchReadings();
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This reading will be permanently removed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`/api/readings/${id}`, { method: "DELETE" });
            if (res.ok) {
                Swal.fire('Deleted!', 'Record removed.', 'success');
                if (viewMode === "edit") setViewMode("table");
                fetchReadings();
            }
        } catch (err) {
            Swal.fire('Error', 'Failed to delete record', 'error');
        }
    }
  };

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

  const handleBatchAction = async (action: "DELETE" | "VALIDATE") => {
    const result = await Swal.fire({
        title: 'Batch Action',
        text: `Proceed with ${action.toLowerCase()} for ${selectedIds.length} records?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: action === "DELETE" ? '#ef4444' : '#22c55e'
    });

    if (result.isConfirmed) {
        setUpdating(true);
        try {
            const res = await fetch("/api/readings/batch", {
                method: "POST",
                body: JSON.stringify({ ids: selectedIds, action })
            });
            if (res.ok) {
                Swal.fire('Success', 'Bulk processing complete.', 'success');
                setSelectedIds([]);
                fetchReadings();
            }
        } finally {
            setUpdating(false);
        }
    }
  };

  if (viewMode === "edit" && selectedReading) {
    return (
        <div className="w-full space-y-6 animate-fade-in py-4 lg:py-8 px-4 lg:px-6 text-left relative">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg lg:text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Edit Submission</h2>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Audit Mode</p>
                </div>
                <button onClick={() => setViewMode("table")} className="btn-outline px-3 lg:px-4 py-1.5 lg:py-2 text-[9px] lg:text-[10px] font-black uppercase tracking-widest">
                    <ArrowLeft size={12} className="mr-1 lg:mr-2"/> Back
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-6 flex flex-col justify-between">
                    <Card className="p-6 lg:p-8 space-y-6 lg:space-y-8 bg-white dark:bg-zinc-900 rounded-[2rem] border-none shadow-sm flex flex-col justify-center">
                        <div className="space-y-4 lg:space-y-6 text-center">
                            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Adjust Meter Index</label>
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full text-5xl lg:text-6xl font-black text-center bg-transparent border-none outline-none text-zinc-900 dark:text-white"
                                />
                                <div className="mt-2 lg:mt-4 text-blue-600 font-black text-lg tracking-widest uppercase">
                                    {selectedReading.category === "POWER" ? "kWh" : "m³"}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-50 dark:border-zinc-800 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest text-left">Technician</p>
                                <p className="text-[10px] lg:text-[11px] font-bold uppercase text-left truncate">{selectedReading.user?.name}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Recorded At</p>
                                <p className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase">{new Date(selectedReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    </Card>

                    <div className="flex gap-3 lg:gap-4 items-center">
                        <button
                            onClick={() => handleUpdate(selectedReading, true)}
                            className="flex-1 py-4 lg:py-5 flex items-center justify-center gap-2 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 border border-green-100 rounded-2xl hover:bg-green-100 transition-all"
                        >
                            <Check className="w-3.5 h-3.5 lg:w-4 lg:h-4"/> Validate
                        </button>
                        <button
                            disabled={updating}
                            onClick={handleUpdate}
                            className="flex-[1.5] btn-primary py-4 lg:py-5 shadow-2xl shadow-blue-500/20 text-[9px] lg:text-[10px] rounded-2xl"
                        >
                            {updating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4 mr-1"/>} Update Record
                        </button>
                    </div>
                    <button
                        onClick={() => handleDelete(selectedReading.id)}
                        className="w-full py-3 lg:py-4 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 rounded-xl transition-all"
                    >
                        <Trash2 size={14}/> Permanent Deletion
                    </button>
                </div>

                <Card className="p-6 lg:p-8 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-none shadow-sm flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4 lg:mb-6">
                        <div className="flex items-center gap-3">
                            <Camera size={16} className="text-zinc-400" />
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Visual Evidence</h3>
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} className="btn-outline px-3 lg:px-4 py-1 rounded-lg text-[8px]">
                            REPLACE
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" className="hidden" />
                    </div>

                    <div className={cn(
                        "w-full py-12 lg:py-16 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-4 overflow-hidden relative shadow-inner",
                        (editFileName || editPhotoData) ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10" : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50"
                    )}>
                        <button type="button" onClick={() => setShowPreview(true)} className="w-14 lg:w-16 h-14 lg:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all">
                            <FileText size={28} />
                        </button>
                        <div className="text-center px-4">
                            <p className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-tight truncate max-w-full">
                                {editFileName || (selectedReading.photoUrl ? "Archived_Meter_Proof.png" : "No_Image.png")}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {showPreview && editPhotoData && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl animate-in fade-in duration-300 p-4 lg:p-8">
                    <button onClick={() => setShowPreview(false)} className="absolute top-6 lg:top-8 right-6 lg:right-8 w-10 lg:w-14 h-10 lg:h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                        <X className="w-6 h-6 lg:w-8 lg:h-8" />
                    </button>
                    <div className="relative w-full max-w-4xl h-full max-h-[80vh] rounded-3xl lg:rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10">
                        <img src={editPhotoData} alt="Meter Preview" className="w-full h-full object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in py-4 lg:py-6 px-4 lg:px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 px-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-600 mb-0.5">Audit Logs</p>
          <h1 className="text-2xl lg:text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Submission Audit</h1>
          <p className="text-zinc-500 font-bold uppercase text-[8px] lg:text-[9px] tracking-widest mt-1">Verify and manage field readings</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <Calendar className="text-blue-600" size={16} />
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none font-black uppercase text-[10px] tracking-widest py-1"
                />
                {dateFilter && <button onClick={() => setDateFilter("")} className="text-zinc-400"><X size={14}/></button>}
            </div>
           <div className="relative group flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="SEARCH..."
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-600/10 transition-all min-w-[150px]"
              />
           </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div className="flex gap-1 overflow-x-auto custom-scrollbar no-scrollbar">
            {["ALL", "POWER", "WATER"].map((t) => (
                <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                    "px-4 py-2 text-[8px] lg:text-[9px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0",
                    filter === t ? "border-blue-600 text-blue-600" : "border-transparent text-zinc-400"
                    )}
                >
                    {t}
                </button>
            ))}
          </div>

          {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300 ml-auto">
                  <button
                    onClick={() => handleBatchAction("VALIDATE")}
                    className="p-2 bg-green-50 text-green-600 rounded-lg border border-green-100"
                    title="Validate Selected"
                  >
                    <CheckCircle2 size={16}/>
                  </button>
                  <button
                    onClick={() => handleBatchAction("DELETE")}
                    className="p-2 bg-red-50 text-red-500 rounded-lg border border-red-100"
                    title="Delete Selected"
                  >
                    <Trash2 size={16}/>
                  </button>
                  <button onClick={() => setSelectedIds([])} className="p-2 text-zinc-400"><X size={16}/></button>
              </div>
          )}
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="lg:hidden space-y-3 px-2 pb-10">
          {filteredReadings.map(item => (
              <div
                key={item.id}
                className={cn(
                    "p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm relative overflow-hidden transition-all active:scale-[0.98]",
                    selectedIds.includes(item.id) && "ring-2 ring-blue-600/50 bg-blue-50/20"
                )}
                onClick={() => toggleSelect(item.id)}
              >
                  <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                         <div className={cn(
                             "p-2 rounded-lg",
                             item.category === "POWER" ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600"
                         )}>
                             {item.category === "POWER" ? <Zap size={14}/> : <Droplets size={14}/>}
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase text-zinc-900 dark:text-white leading-none">{item.user?.name}</p>
                            <p className="text-[8px] text-zinc-400 font-bold uppercase mt-1">{format(new Date(item.timestamp), 'dd MMM, HH:mm')}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.isEdited ? <AlertCircle size={14} className="text-orange-500" /> : <CheckCircle2 size={14} className="text-green-500" />}
                        <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }} className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400"><Pencil size={14}/></button>
                      </div>
                  </div>
                  <div className="flex items-end justify-between">
                      <p className="text-2xl font-black tracking-tighter">
                          {item.value.toFixed(2)}
                          <span className="text-[10px] text-zinc-400 ml-1 uppercase">{item.category === "POWER" ? "kWh" : "m³"}</span>
                      </p>
                      {selectedIds.includes(item.id) && <div className="p-1 rounded-full bg-blue-600 text-white"><Check size={10} strokeWidth={4}/></div>}
                  </div>
              </div>
          ))}
          {filteredReadings.length === 0 && <p className="py-20 text-center text-[10px] font-black text-zinc-300 uppercase tracking-widest">No entries found.</p>}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm mx-2">
        {loading ? (
           <div className="p-20 flex flex-col items-center justify-center gap-4 text-zinc-400">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-[9px] font-black uppercase tracking-widest">Fetching Logs...</p>
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
                    <th className="px-6 py-4">Technician</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Meter Reading</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right pr-10">Actions</th>
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
                      <td className="px-6 py-4 text-left">
                         <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase leading-none">{new Date(item.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                            <span className="text-[8px] text-zinc-400 font-bold uppercase mt-1">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-black uppercase overflow-hidden border border-zinc-50 dark:border-zinc-700">
                                {item.user?.avatar ? <img src={item.user.avatar} className="w-full h-full object-cover" /> : item.user?.name?.substring(0,2)}
                            </div>
                            <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase truncate max-w-[120px]">{item.user?.name}</span>
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
                         <span className="text-[8px] text-zinc-400 ml-1.5 uppercase">{item.category === "POWER" ? "kWh" : "m³"}</span>
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
                          <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleUpdate(item, true)} title="Validate Reading" className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                                 <Check size={16} />
                              </button>
                              <button onClick={() => handleOpenEdit(item)} title="Audit Record" className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                                 <Pencil size={14} />
                              </button>
                              <button onClick={() => handleDelete(item.id)} title="Delete Record" className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm">
                                 <Trash2 size={14} />
                              </button>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}
