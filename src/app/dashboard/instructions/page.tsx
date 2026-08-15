"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Users,
  Send,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';
import { Card } from "@/components/ui/Card";

export default function InstructionsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMINISTRATEUR';

  const [instructions, setInstructions] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [instructionText, setInstructionText] = useState("");
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchInstructions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/instructions", { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setInstructions(data);
      }

      if (isAdmin) {
          // IMPORTANT: Explicitly fetch technicians with their emails for notification mapping
          const techRes = await fetch("/api/users?role=ELECTRICIEN");
          if (techRes.ok) setTechnicians(await techRes.json());
      }
    } catch (err) {
        console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTechIds.length === 0) {
        Swal.fire('Error', 'Select at least one technician', 'error');
        return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/instructions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: instructionText,
            userIds: selectedTechIds
          })
      });

      if (res.ok) {
          Swal.fire({ title: 'Success', text: 'Missions Dispatched', icon: 'success', timer: 1500, showConfirmButton: false });
          setShowForm(false);
          setInstructionText("");
          setSelectedTechIds([]);
          fetchInstructions();
      } else {
          throw new Error("Dispatch failed");
      }
    } catch (err) {
        Swal.fire('Error', 'Could not broadcast instructions', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'PENDING' ? 'DONE' : 'PENDING';
    try {
        const res = await fetch(`/api/instructions/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            fetchInstructions();
            window.dispatchEvent(new Event('refreshNotifications'));
        } else {
            Swal.fire('Error', 'Update failed', 'error');
        }
    } catch (err) {
        Swal.fire('Error', 'Connection error', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Remove Instruction?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
          const res = await fetch(`/api/instructions/${id}`, {
              method: "DELETE"
          });
          if (res.ok) {
            Swal.fire({ title: 'Deleted!', icon: 'success', timer: 1000, showConfirmButton: false });
            fetchInstructions();
          } else {
            Swal.fire('Error', 'Delete failed', 'error');
          }
      } catch (err) {
          Swal.fire('Error', 'Connection error', 'error');
      }
    }
  };

  const toggleTechId = (id: string) => {
    setSelectedTechIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="w-full space-y-6 md:space-y-10 animate-fade-in py-4 lg:py-6 px-4 lg:px-6 text-left selection:bg-blue-500/30">
      <div id="mission-header" className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6 px-2">
        <div>
          <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[9px] mb-1">Mission Control</p>
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">
             {isAdmin ? "Dispatch Hub" : "My Missions"}
          </h1>
        </div>
        {isAdmin && !showForm && (
            <button id="add-mission-btn" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 text-[10px] font-black uppercase">
                <Plus size={16} /> New Broadcast
            </button>
        )}
      </div>

      {showForm && isAdmin ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 lg:p-10 space-y-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-500 mx-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">Dispatch Directive</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Target Personnel</p>
                    <div className="flex flex-wrap gap-2">
                        {technicians.map(tech => (
                            <button type="button" key={tech.id} onClick={() => toggleTechId(tech.id)} className={cn("p-2.5 rounded-xl border-2 transition-all flex items-center gap-2 text-[10px] font-bold uppercase", selectedTechIds.includes(tech.id) ? "bg-blue-600 border-blue-600 text-white shadow-lg" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 text-zinc-400")}>
                                <div className="flex flex-col items-start">
                                    <div className="flex items-center gap-2">
                                        <Users size={14} />
                                        <span>{tech.name}</span>
                                    </div>
                                    <span className="text-[7px] opacity-60 ml-5">{tech.email || "No email"}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Instruction Details</p>
                    <textarea required value={instructionText} onChange={e => setInstructionText(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl p-6 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all outline-none min-h-[120px] text-zinc-900 dark:text-white" placeholder="Type operational directive here..." />
                </div>
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                    <button type="submit" disabled={submitting} className="btn-primary px-12 py-4 rounded-2xl text-xs font-black shadow-xl shadow-blue-500/10">
                        {submitting ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
                        Broadcast Mission
                    </button>
                </div>
            </form>
        </div>
      ) : (
        <div id="mission-list" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 px-2 pb-20">
            {instructions.map(mission => (
                <div key={mission.id} className={cn("p-4 md:p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between group hover:shadow-xl transition-all h-full", mission.status === 'DONE' && "opacity-60")}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", mission.status === 'DONE' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600")}>
                                {mission.status === 'DONE' ? <ShieldCheck size={20} /> : <MessageSquare size={20} />}
                            </div>
                            <div className="flex items-center gap-2">
                                <span id={`status-${mission.id}`} className={cn("text-[7px] font-black uppercase px-2 py-0.5 rounded-full", mission.status === 'DONE' ? "bg-green-500 text-white" : "bg-orange-500 text-white animate-pulse")}>{mission.status}</span>
                                {isAdmin && (
                                    <button onClick={() => handleDelete(mission.id)} className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black text-zinc-900 dark:text-white uppercase leading-tight">{mission.text}</p>
                            {isAdmin && <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-2 flex items-center gap-1.5"><Users size={8}/> Assigned: {mission.user?.name || "Unknown"}</p>}
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                         <div className="flex items-center gap-2 text-zinc-400">
                            <Clock size={12}/>
                            <span className="text-[8px] font-black uppercase">{new Date(mission.createdAt).toLocaleDateString()}</span>
                         </div>
                         {!isAdmin && mission.status === 'PENDING' && (
                            <button id={`action-${mission.id}`} onClick={() => toggleStatus(mission.id, mission.status)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
                                Mark as Done <ChevronRight size={12}/>
                            </button>
                         )}
                         {mission.status === 'DONE' && (
                             <div className="flex items-center gap-1.5 text-green-500">
                                 <CheckCircle2 size={12}/>
                                 <span className="text-[8px] font-black uppercase">Completed</span>
                             </div>
                         )}
                    </div>
                </div>
            ))}

            {instructions.length === 0 && !loading && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] opacity-30">
                    <ClipboardList size={48} className="mx-auto text-zinc-400 mb-4" />
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Zero active missions detected</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
