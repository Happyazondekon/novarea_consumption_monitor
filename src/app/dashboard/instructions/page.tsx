"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import {
  Clock,
  Loader2,
  Plus,
  Send,
  Trash2,
  Check,
  X,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  User,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import { format } from "date-fns";

export default function InstructionsPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const isAdmin = sessionUser?.role === 'ADMINISTRATEUR';

  const [missions, setMissions] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [instructionText, setInstructionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/instructions");
      if (res.ok) setMissions(await res.json());

      if (isAdmin) {
          const techRes = await fetch("/api/users");
          if (techRes.ok) {
              const allUsers = await techRes.json();
              setTechnicians(allUsers.filter((u: any) => u.role === 'ELECTRICIEN'));
          }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const toggleTechId = (id: string) => {
    setSelectedTechIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTechIds.length === 0 || !instructionText.trim()) return;

    setSubmitting(true);
    try {
        const res = await fetch("/api/instructions", {
            method: "POST",
            body: JSON.stringify({ userIds: selectedTechIds, text: instructionText })
        });

        if (res.ok) {
            Swal.fire({ title: 'Success', text: 'Missions Broadcasted', icon: 'success', timer: 1500, showConfirmButton: false });
            setShowForm(false);
            setInstructionText("");
            setSelectedTechIds([]);
            fetchData();
        }
    } finally {
      setSubmitting(false);
    }
  };

  const updateMissionStatus = async (id: string, status: "DONE" | "PENDING") => {
    const res = await fetch("/api/instructions", {
        method: "PATCH",
        body: JSON.stringify({ id, status })
    });
    if (res.ok) {
        Swal.fire({ title: status === "DONE" ? "Completed" : "Restored", icon: 'success', timer: 1000, showConfirmButton: false });
        fetchData();
    }
  };

  const removeMission = async (id: string) => {
    const res = await fetch("/api/instructions", {
        method: "DELETE",
        body: JSON.stringify({ id })
    });
    if (res.ok) fetchData();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in py-4 lg:py-6 px-4 lg:px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 px-2">
        <div>
          <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[9px] mb-1">Mission Control</p>
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">
             {isAdmin ? "Dispatch Hub" : "My Missions"}
          </h1>
        </div>
        {isAdmin && !showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 text-[10px] font-black uppercase">
                <Plus size={16} /> New Broadcast
            </button>
        )}
      </div>

      {showForm && isAdmin ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 lg:p-8 space-y-8 shadow-xl animate-in slide-in-from-bottom-4 duration-500 mx-2">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">Compose Broadcast</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"><X size={18}/></button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-6">
                <div className="space-y-3">
                    <p className="text-[8px] font-black uppercase text-zinc-400 tracking-widest ml-1">1. Select Recipient(s)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        {technicians.map(tech => (
                            <button type="button" key={tech.id} onClick={() => toggleTechId(tech.id)} className={cn("p-2.5 rounded-xl border transition-all text-left group", selectedTechIds.includes(tech.id) ? "bg-blue-600 border-blue-600 text-white" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700")}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className={cn("w-6 h-6 rounded-md flex items-center justify-center font-black text-[8px] uppercase", selectedTechIds.includes(tech.id) ? "bg-white/20" : "bg-white dark:bg-zinc-900 text-blue-600")}>{tech.name.substring(0,2)}</div>
                                    {selectedTechIds.includes(tech.id) && <Check size={12} strokeWidth={4} />}
                                </div>
                                <p className="text-[9px] font-black uppercase truncate leading-none">{tech.name.split(' ')[0]}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest ml-1">2. Mission Details</label>
                    <textarea required value={instructionText} onChange={e => setInstructionText(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl p-6 text-[11px] font-bold focus:ring-4 focus:ring-blue-600/5 outline-none resize-none min-h-[100px]" placeholder="E.g. Verify all Sector B-12 meters..." />
                </div>

                <div className="pt-4 border-t border-zinc-50 dark:border-zinc-800 flex justify-end">
                    <button disabled={submitting || selectedTechIds.length === 0} type="submit" className="btn-primary flex items-center gap-2 px-10 py-3 text-[10px] font-black rounded-xl">
                        {submitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                        PUBLISH
                    </button>
                </div>
            </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 px-2 pb-20 lg:pb-0">
          {missions.map((mission) => (
            <div key={mission.id} className={cn(
                "p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between group hover:shadow-md transition-all gap-4",
                mission.status === 'DONE' && "opacity-60 grayscale-[0.5]"
            )}>
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shadow-inner shrink-0",
                    mission.status === 'DONE' ? "bg-green-50 text-green-500" : "bg-blue-50 text-blue-600"
                )}>
                    {mission.status === 'DONE' ? <CheckCircle2 size={18} /> : <ClipboardList size={18} />}
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-3">
                        <p className={cn("text-[12px] font-bold uppercase leading-tight truncate", mission.status === 'DONE' ? "line-through text-zinc-400" : "text-zinc-900 dark:text-zinc-100")}>{mission.text}</p>
                        <span className={cn("text-[7px] font-black uppercase px-1.5 py-0.5 rounded", mission.status === 'DONE' ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-500")}>{mission.status}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 shrink-0"><Clock size={10} /> {format(new Date(mission.createdAt), 'dd MMM, HH:mm')}</span>
                        {isAdmin && (
                            <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 truncate"><User size={10} /> {mission.user.name}</span>
                        )}
                    </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                {!isAdmin && mission.status === 'PENDING' && (
                    <button onClick={() => updateMissionStatus(mission.id, 'DONE')} className="btn-success px-4 py-2 rounded-lg text-[9px] font-black flex items-center gap-1.5 shadow-sm">
                        <Check size={14} /> DONE
                    </button>
                )}
                {!isAdmin && mission.status === 'DONE' && (
                    <button onClick={() => updateMissionStatus(mission.id, 'PENDING')} className="text-[9px] font-black text-zinc-400 uppercase hover:text-blue-600 px-3">UNDO</button>
                )}
                {isAdmin && (
                    <button onClick={() => removeMission(mission.id)} className="p-2 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all sm:opacity-0 sm:group-hover:opacity-100"><Trash2 size={16} /></button>
                )}
              </div>
            </div>
          ))}

          {missions.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
                <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest leading-none">No active missions</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
