"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Download,
  FileText,
  Plus,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Calendar,
  Building2,
  Activity,
  X,
  History,
  Archive,
  Globe,
  Check,
  Search,
  Briefcase,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateGlobalPDF } from "@/lib/pdf-generator";
import Swal from 'sweetalert2';

export default function RapportsPage() {
  const { data: session } = useSession();
  const [rapports, setRapports] = useState<any[]>([]);
  const [entites, setEntites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([]);

  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [selectedEntite, setSelectedEntite] = useState("GLOBAL");
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = (session?.user as any)?.role === 'ADMINISTRATEUR' || (session?.user as any)?.role === 'MINISTRE';

  useEffect(() => {
    fetchHistory();
    fetchEntites();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setShowEntityDropdown(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/rapports/historique');
      if (res.ok) setRapports(await res.json());
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchEntites = async () => {
    const res = await fetch('/api/projets');
    if (res.ok) setEntites(await res.json());
  };

  const handleGenerate = async () => {
    setLoading(true);
    Swal.fire({
      title: 'Synthèse Stratégique...',
      text: 'Compilation des données en cours.',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const res = await fetch('/api/rapports/generer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entiteId: selectedEntite })
      });

      if (!res.ok) throw new Error();
      const reportData = await res.json();
      await generateGlobalPDF(reportData);

      Swal.close();
      Swal.fire({ title: 'Note Archivée !', icon: 'success', timer: 1500 });
      setShowGenerateForm(false);
      fetchHistory();
    } catch (error) {
      Swal.close();
      Swal.fire('Erreur', 'Échec de la génération.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { isConfirmed } = await Swal.fire({
        title: 'Supprimer ?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#18181b',
        confirmButtonText: 'Supprimer'
    });
    if (isConfirmed) {
      try {
        const res = await fetch(`/api/rapports/historique/${id}`, { method: 'DELETE' });
        if (res.ok) setRapports(prev => prev.filter(r => r.id !== id));
      } catch (error) {}
    }
  };

  const handleDownloadAgain = async (rapport: any) => {
    try {
      const data = JSON.parse(rapport.contenu);
      await generateGlobalPDF(data);
    } catch (e) {
      Swal.fire('Erreur', 'Données corrompues.', 'error');
    }
  };

  const groupedRapports = rapports.reduce((groups: any, r) => {
    const date = new Date(r.dateCreation);
    const weekLabel = `Semaine ${Math.ceil(date.getDate() / 7)} - ${date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    if (!groups[weekLabel]) groups[weekLabel] = [];
    groups[weekLabel].push(r);
    return groups;
  }, {});

  const selectedEntiteNom = selectedEntite === 'GLOBAL' ? 'PORTEFEUILLE GLOBAL' : entites.find(e => e.id === selectedEntite)?.nom || 'SÉLECTIONNER...';

  return (
    <div className="space-y-6 animate-fade-in pb-20">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter uppercase leading-none">Archives Stratégiques</h2>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1.5">Répertoire des notes de conjoncture et analyses SWOT</p>
        </div>

        {isAdmin && !showGenerateForm && (
            <button
                onClick={() => setShowGenerateForm(true)}
                className="btn-success"
            >
                <Plus size={14} />
                <span>Nouvelle Note</span>
            </button>
        )}
      </div>

      {showGenerateForm && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                    <Activity size={18} className="text-benin-green" />
                    <h3 className="text-sm font-black uppercase tracking-tight">Paramétrage de la Note</h3>
                </div>
                <button onClick={() => setShowGenerateForm(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
                <div className="lg:col-span-2 space-y-2 relative" ref={dropdownRef}>
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Périmètre de la synthèse</label>
                    <div
                        onClick={() => setShowEntityDropdown(!showEntityDropdown)}
                        className="w-full p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between cursor-pointer group hover:border-benin-green transition-all"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-1.5 rounded-lg bg-benin-green/10 text-benin-green shrink-0">
                                {selectedEntite === 'GLOBAL' ? <Globe size={16} /> : <Briefcase size={16} />}
                            </div>
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate uppercase">
                                {selectedEntiteNom}
                            </span>
                        </div>
                        <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", showEntityDropdown && "rotate-180")} />
                    </div>

                    {showEntityDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                                <div
                                    onClick={() => { setSelectedEntite("GLOBAL"); setShowEntityDropdown(false); }}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                                        selectedEntite === "GLOBAL" ? "bg-benin-green text-white shadow-md" : "hover:bg-zinc-50 dark:hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Globe size={14} />
                                        <span className="text-[10px] font-black uppercase">PORTEFEUILLE GLOBAL</span>
                                    </div>
                                    {selectedEntite === "GLOBAL" && <Check size={14} strokeWidth={3} />}
                                </div>
                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1.5 mx-3" />
                                {entites.map(e => (
                                    <div
                                        key={e.id}
                                        onClick={() => { setSelectedEntite(e.id); setShowEntityDropdown(false); }}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                                            selectedEntite === e.id ? "bg-zinc-900 text-white shadow-md" : "hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <Briefcase size={14} />
                                            <span className="text-[10px] font-black uppercase truncate">{e.nom}</span>
                                        </div>
                                        <span className="text-[6px] font-black px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-400 uppercase ml-2">{e.type.substring(0,3)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <button
                    disabled={loading}
                    onClick={handleGenerate}
                    className="btn-primary w-full py-4"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                    <span>Générer la Note</span>
                </button>
            </div>
            <p className="text-[8px] font-bold text-zinc-400 text-center uppercase tracking-widest mt-4">La synthèse consolide les performances techniques et financières.</p>
        </div>
      )}

      <div className="space-y-4 pt-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-2">
                <History size={16} className="text-zinc-400" />
                <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Archives des Notes</h3>
            </div>
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Filtrer les archives..." className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold outline-none focus:ring-4 focus:ring-benin-green/5 transition-all" />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            {loadingHistory ? (
                <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-benin-green" size={28} /></div>
            ) : Object.keys(groupedRapports).length > 0 ? (
                <div className="divide-y divide-zinc-50 dark:divide-zinc-800">
                    {Object.entries(groupedRapports).map(([week, items]: [string, any]) => (
                        <div key={week}>
                            <button
                                onClick={() => setExpandedWeeks(prev => prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week])}
                                className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400"><Calendar size={12} /></div>
                                    <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight">{week}</span>
                                </div>
                                <ChevronDown size={16} className={cn("text-zinc-300 transition-transform duration-300", expandedWeeks.includes(week) && "rotate-180")} />
                            </button>

                            {expandedWeeks.includes(week) && (
                                <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-1 duration-200">
                                    {items.map((r: any) => {
                                        let title = "Note Stratégique";
                                        try { title = JSON.parse(r.contenu).title; } catch(e) {}
                                        return (
                                            <div key={r.id} className="p-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-800/30 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-400 shadow-sm border border-zinc-100 dark:border-zinc-800 group-hover:text-benin-green transition-colors"><FileText size={14} /></div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase truncate pr-2">{title}</p>
                                                        <p className="text-[8px] text-zinc-400 font-bold uppercase mt-0.5">{new Date(r.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • Par {r.generePar.identifiant}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleDownloadAgain(r)} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-benin-green transition-all"><Download size={15}/></button>
                                                    {isAdmin && <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-all"><Trash2 size={15}/></button>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                    <FileText size={40} className="mx-auto text-zinc-100 dark:text-zinc-800" />
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Aucune archive stratégique</p>
                </div>
            )}
          </div>
      </div>
    </div>
  );
}
