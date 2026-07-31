"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import {
  Calendar as CalendarIcon,
  Zap,
  Droplets,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Info,
  TrendingUp,
  TrendingDown,
  Loader2,
  X,
  CheckCircle2,
  Save,
  Check,
  Layers,
  Activity,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';
import { format } from "date-fns";

const steps = [
  { id: 0, name: "Resource", icon: Layers },
  { id: 1, name: "Events Log", icon: Activity },
  { id: 2, name: "Finalize", icon: CheckCircle2 },
];

export default function DailyEventsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  // Wizard State
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<"POWER" | "WATER" | null>(null);
  const [selectedIds, setSelectedTypeIds] = useState<string[]>([]);
  const [customDescriptions, setCustomDescriptions] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.dailyEvents);
        setEventTypes(data.types);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const openNewEventModal = () => {
    setActiveStep(0);
    setSelectedCategory(null);
    setSelectedTypeIds([]);
    setCustomDescriptions({});
    setShowWizard(true);
  };

  const toggleTypeId = (id: string) => {
    setSelectedTypeIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const updateCustomDescription = (id: string, text: string) => {
    setCustomDescriptions(prev => ({ ...prev, [id]: text }));
  };

  const handleSaveEvents = async () => {
    if (selectedIds.length === 0) return;

    const missingDesc = selectedIds.some(id => {
        const type = eventTypes.find(t => t.id === id);
        return type?.code.startsWith('OTH') && !customDescriptions[id]?.trim();
    });

    if (missingDesc) {
        Swal.fire('Incomplete', 'Provide descriptions for "Other" events.', 'warning');
        return;
    }

    setSubmitting(true);
    try {
      const promises = selectedIds.map(typeId =>
        fetch("/api/events", {
          method: "POST",
          body: JSON.stringify({
            date: selectedDate,
            eventTypeId: typeId,
            comment: customDescriptions[typeId] || null
          })
        })
      );
      await Promise.all(promises);
      setShowWizard(false);
      fetchEvents();
      Swal.fire({ title: 'Success', text: 'Events recorded', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Error', 'Failed to save events', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch("/api/events", {
        method: "DELETE",
        body: JSON.stringify({ id })
    });
    if (res.ok) fetchEvents();
  };

  if (showWizard) {
    return (
      <div className="w-full space-y-4 lg:space-y-6 animate-fade-in pb-20 px-4 lg:px-6 text-left">
        <div className="flex items-center justify-between">
           <div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tighter uppercase leading-none">New Context</h2>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mt-0.5">Anomaly Configuration</p>
           </div>
           <button onClick={() => setShowWizard(false)} className="btn-outline px-3 py-1.5 text-[9px]">
              CANCEL
           </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {steps.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl border transition-all duration-300",
                activeStep === s.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                  : activeStep > s.id
                    ? "bg-blue-50 text-blue-600 border-blue-100"
                    : "bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-100 dark:border-zinc-800"
              )}
            >
              <s.icon size={16} className="mb-1" />
              <span className="text-[8px] font-black uppercase tracking-widest hidden sm:inline">{s.name}</span>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-6 lg:p-8 flex-1">
             {activeStep === 0 && (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 text-center">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black uppercase tracking-tighter">Choose Resource</h3>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Utility selection</p>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                      <SelectionCard
                        label="Electricity"
                        icon={Zap}
                        active={selectedCategory === "POWER"}
                        onClick={() => { setSelectedCategory("POWER"); setActiveStep(1); }}
                        color="text-blue-600"
                      />
                      <SelectionCard
                        label="Water"
                        icon={Droplets}
                        active={selectedCategory === "WATER"}
                        onClick={() => { setSelectedCategory("WATER"); setActiveStep(1); }}
                        color="text-cyan-600"
                      />
                   </div>
                </div>
             )}

             {activeStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-50 dark:border-zinc-800 pb-4 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                           {selectedCategory === 'POWER' ? <Zap size={20}/> : <Droplets size={20}/>}
                        </div>
                        <div>
                           <h3 className="text-base font-black uppercase tracking-tighter leading-none">{selectedCategory} Anomalies</h3>
                        </div>
                      </div>
                      <div className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest self-start">
                         {selectedIds.length} SELECTED
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 flex items-center gap-2">
                            <TrendingUp size={12}/> Increases
                         </p>
                         <div className="space-y-2">
                            {eventTypes.filter(t => t.category === selectedCategory && t.type === 'INCREASE').map(type => (
                               <div key={type.id} className="space-y-2">
                                    <TypeRow type={type} selected={selectedIds.includes(type.id)} onToggle={() => toggleTypeId(type.id)} />
                                    {selectedIds.includes(type.id) && type.code.startsWith('OTH') && (
                                        <input
                                            autoFocus
                                            value={customDescriptions[type.id] || ""}
                                            onChange={(e) => updateCustomDescription(type.id, e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-b border-blue-600 p-2 text-[9px] font-bold outline-none"
                                            placeholder="DESCRIBE..."
                                        />
                                    )}
                               </div>
                            ))}
                         </div>
                      </div>
                      <div className="space-y-3">
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500 flex items-center gap-2">
                            <TrendingDown size={12}/> Decreases
                         </p>
                         <div className="space-y-2">
                            {eventTypes.filter(t => t.category === selectedCategory && t.type === 'DECREASE').map(type => (
                               <div key={type.id} className="space-y-2">
                                    <TypeRow type={type} selected={selectedIds.includes(type.id)} onToggle={() => toggleTypeId(type.id)} />
                                    {selectedIds.includes(type.id) && type.code.startsWith('OTH') && (
                                        <input
                                            autoFocus
                                            value={customDescriptions[type.id] || ""}
                                            onChange={(e) => updateCustomDescription(type.id, e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-b border-blue-600 p-2 text-[9px] font-bold outline-none"
                                            placeholder="DESCRIBE..."
                                        />
                                    )}
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             )}

             {activeStep === 2 && (
                <div className="space-y-6 py-4 flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 text-center">
                   <div className="w-16 h-16 rounded-[1.2rem] bg-blue-600 text-white flex items-center justify-center shadow-lg">
                      <CheckCircle2 size={32} />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-xl font-black uppercase tracking-tighter">Ready to Publish</h3>
                      <p className="text-zinc-500 font-bold uppercase text-[8px] tracking-widest">
                        Review for {format(new Date(selectedDate), 'MMM do')}
                      </p>
                   </div>
                   <div className="w-full max-w-xs space-y-2">
                        {selectedIds.map(id => (
                            <div key={id} className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700 text-left">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span className="text-[9px] font-black uppercase truncate">{eventTypes.find(t => t.id === id)?.description}</span>
                            </div>
                        ))}
                   </div>
                </div>
             )}
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 lg:p-6 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
             <button onClick={() => setActiveStep(prev => prev - 1)} disabled={activeStep === 0} className="text-[9px] font-black uppercase tracking-widest text-zinc-400 disabled:opacity-0 transition-all">PREVIOUS</button>
             {activeStep < 2 ? (
                <button onClick={() => setActiveStep(prev => prev + 1)} disabled={activeStep === 0 && !selectedCategory} className="btn-primary px-8 py-2.5 rounded-xl text-[9px] font-black uppercase">NEXT STEP</button>
             ) : (
                <button onClick={handleSaveEvents} disabled={submitting} className="btn-success px-10 py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2">
                   {submitting ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                   PUBLISH
                </button>
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in py-4 lg:py-6 px-4 lg:px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 px-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-600 mb-0.5">Audit Log</p>
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Daily Context</h1>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <CalendarIcon className="text-blue-600" size={16} />
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent border-none outline-none font-black uppercase text-[10px] tracking-widest py-1"
                />
            </div>
            <button onClick={openNewEventModal} className="btn-primary p-2.5 rounded-xl shadow-lg"><Plus size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 pb-20 lg:pb-0">
        <ResourceBlock title="Electricity" icon={Zap} color="blue" increaseEvents={events.filter(e => e.eventType.category === 'POWER' && e.eventType.type === 'INCREASE')} decreaseEvents={events.filter(e => e.eventType.category === 'POWER' && e.eventType.type === 'DECREASE')} onDelete={handleDelete} />
        <ResourceBlock title="Water" icon={Droplets} color="cyan" increaseEvents={events.filter(e => e.eventType.category === 'WATER' && e.eventType.type === 'INCREASE')} decreaseEvents={events.filter(e => e.eventType.category === 'WATER' && e.eventType.type === 'DECREASE')} onDelete={handleDelete} />
      </div>
    </div>
  );
}

function ResourceBlock({ title, icon: Icon, color, increaseEvents, decreaseEvents, onDelete }: any) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 px-1">
                <div className={cn("p-2 rounded-xl border shadow-sm", color === 'blue' ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600")}>
                    <Icon size={16}/>
                </div>
                <h2 className="text-lg font-black uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">{title}</h2>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {[...increaseEvents, ...decreaseEvents].map((ev: any) => (
                    <div key={ev.id} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-50 dark:border-zinc-800 flex items-center justify-between group shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[7px] font-black uppercase shrink-0", ev.eventType.type === 'INCREASE' ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500")}>
                                {ev.eventType.type === 'INCREASE' ? "INC" : "DEC"}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] font-bold text-zinc-900 dark:text-white uppercase leading-none truncate">{ev.eventType.description}</p>
                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1.5 truncate">{ev.eventType.code} {ev.comment ? `• ${ev.comment}` : ''}</p>
                            </div>
                        </div>
                        <button onClick={() => onDelete(ev.id)} className="p-1.5 text-zinc-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                    </div>
                ))}
                {increaseEvents.length === 0 && decreaseEvents.length === 0 && (
                    <div className="py-8 text-center border-2 border-dashed border-zinc-50 dark:border-zinc-800 rounded-2xl">
                        <p className="text-[9px] font-black text-zinc-300 uppercase">Empty Log</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function SelectionCard({ label, icon: Icon, active, onClick, color }: any) {
    return (
        <button onClick={onClick} className={cn("p-6 flex flex-col items-center gap-4 rounded-3xl border-2 transition-all group", active ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10" : "border-zinc-50 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-blue-200")}>
            <div className={cn("p-4 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm transition-transform group-hover:scale-105", color)}><Icon size={32} /></div>
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );
}

function TypeRow({ type, selected, onToggle }: any) {
    return (
        <button onClick={onToggle} className={cn("w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group", selected ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50")}>
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-black text-[8px] shrink-0", selected ? "bg-white/20" : "bg-zinc-50 dark:bg-zinc-900 text-blue-600")}>{type.code}</div>
                <span className="text-[9px] font-black uppercase tracking-tight leading-none truncate">{type.description}</span>
            </div>
            {selected && <Check size={14} strokeWidth={4} />}
        </button>
    );
}
