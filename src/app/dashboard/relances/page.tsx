"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
    Clock,
    Search,
    Send,
    CheckCircle2,
    Building2,
    Briefcase,
    User,
    ChevronDown,
    ChevronRight,
    X,
    Check,
    Loader2,
    BellRing,
    Zap,
    History
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

export default function RelancesPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [lateEntities, setLateEntities] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [filterType, setFilterType] = useState("all");
    const [showEntityDropdown, setShowEntityDropdown] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isAdmin = (session?.user as any)?.role === 'ADMINISTRATEUR' || (session?.user as any)?.role === 'MINISTRE';

    const fetchLateData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/dashboard/stats');
            if (res.ok) {
                const data = await res.json();
                setLateEntities(data.lateProjects || []);
                setSelectedIds(data.lateProjects?.map((e: any) => e.id) || []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLateData();
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

    const toggleEntity = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === lateEntities.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(lateEntities.map(e => e.id));
        }
    };

    const handleSendRelance = async () => {
        if (selectedIds.length === 0) return;

        const { isConfirmed } = await Swal.fire({
            title: 'Lancer les relances ?',
            text: `${selectedIds.length} structures recevront un email officiel.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#18181b',
            confirmButtonText: 'Confirmer l\'envoi'
        });

        if (isConfirmed) {
            setLoading(true);
            try {
                const res = await fetch('/api/notifications/relance', {
                    method: 'POST',
                    body: JSON.stringify({ projectIds: selectedIds })
                });
                if (res.ok) {
                    Swal.fire({ title: 'Relances envoyées !', icon: 'success', timer: 2000 });
                    fetchLateData();
                }
            } finally {
                setLoading(false);
            }
        }
    };

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const filteredEntities = lateEntities.filter(e => {
        const matchesSearch = e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             e.responsable.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || e.type === filterType;
        return matchesSearch && matchesType;
    });

    const agencies = filteredEntities.filter(e => e.type === 'AGENCE');
    const projects = filteredEntities.filter(e => e.type === 'PROJET');

    const selectedEntitiesText = selectedIds.length === 0
        ? "AUCUNE SÉLECTION"
        : selectedIds.length === lateEntities.length
            ? "TOUTES LES STRUCTURES"
            : `${selectedIds.length} SÉLECTIONNÉE(S)`;

    if (!isAdmin) return <div className="p-20 text-center uppercase font-black text-red-500">Accès restreint</div>;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter uppercase leading-none">Centre de Relance</h2>
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1.5">Interpellation des structures en retard</p>
                </div>
                <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    {["all", "AGENCE", "PROJET"].map((t) => (
                        <button key={t} onClick={() => setFilterType(t)} className={cn("px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", filterType === t ? "bg-zinc-900 text-white shadow-md" : "text-zinc-400 hover:text-zinc-600")}>{t === 'all' ? 'Tout' : t === 'AGENCE' ? 'Agences' : 'Projets'}</button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-zinc-100"><BellRing size={18} className="text-benin-green" /><h3 className="text-sm font-black uppercase tracking-tight">Configuration du Rappel</h3></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
                    <div className="lg:col-span-2 space-y-2 relative" ref={dropdownRef}>
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Cibles de la relance</label>
                        <div onClick={() => setShowEntityDropdown(!showEntityDropdown)} className="w-full p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between cursor-pointer group hover:border-benin-green transition-all">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-1.5 rounded-lg bg-benin-green/10 text-benin-green shrink-0"><Clock size={16} /></div>
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 truncate uppercase">{selectedEntitiesText}</span>
                            </div>
                            <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", showEntityDropdown && "rotate-180")} />
                        </div>
                        {showEntityDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-2 border-b border-zinc-50 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30">
                                    <button onClick={handleSelectAll} className="px-3 py-1.5 text-[9px] font-black text-benin-green uppercase hover:bg-white dark:hover:bg-zinc-800 rounded-lg transition-all">{selectedIds.length === lateEntities.length ? "Désélectionner tout" : "Tout cocher"}</button>
                                    <span className="text-[8px] font-black text-zinc-400 uppercase pr-3">{selectedIds.length} sélectionné(s)</span>
                                </div>
                                <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
                                    {lateEntities.map(e => (
                                        <div key={e.id} onClick={() => toggleEntity(e.id)} className={cn("flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all", selectedIds.includes(e.id) ? "bg-benin-green/5 text-benin-green" : "hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500")}>
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all", selectedIds.includes(e.id) ? "bg-benin-green border-benin-green text-white" : "border-zinc-200")}>{selectedIds.includes(e.id) && <Check size={10} strokeWidth={4} />}</div>
                                                <span className="text-[10px] font-black uppercase truncate">{e.nom}</span>
                                            </div>
                                            <span className="text-[7px] font-black px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-400 uppercase ml-2">{e.type.substring(0,3)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button disabled={loading || selectedIds.length === 0} onClick={handleSendRelance} className="btn-primary w-full py-4"><Zap size={16} /> <span>Lancer la Relance</span></button>
                </div>
            </div>

            <div className="space-y-4 pt-2">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-2">
                    <div className="flex items-center gap-2"><History size={16} className="text-zinc-400" /><h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Détails des manquements</h3></div>
                    <div className="relative flex-1 max-w-sm"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={14} /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Chercher structure..." className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold outline-none focus:ring-4 focus:ring-benin-green/5 transition-all" /></div>
                </div>
                <div className="space-y-3">
                    {loading && lateEntities.length === 0 ? (
                        <div className="p-20 flex justify-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800"><Loader2 className="animate-spin text-benin-green" size={32} /></div>
                    ) : lateEntities.length > 0 ? (
                        <>
                            {agencies.length > 0 && <CollapsibleSection title="Agences Nationales" icon={Building2} count={agencies.length} isOpen={expandedCategories.includes('AGENCE')} onToggle={() => toggleCategory('AGENCE')} color="text-zinc-600">{agencies.map(e => (<EntityRow key={e.id} entity={e} isSelected={selectedIds.includes(e.id)} onToggle={() => toggleEntity(e.id)} />))}</CollapsibleSection>}
                            {projects.length > 0 && <CollapsibleSection title="Unités de Gestion de Projets" icon={Briefcase} count={projects.length} isOpen={expandedCategories.includes('PROJET')} onToggle={() => toggleCategory('PROJET')} color="text-zinc-600">{projects.map(e => (<EntityRow key={e.id} entity={e} isSelected={selectedIds.includes(e.id)} onToggle={() => toggleEntity(e.id)} />))}</CollapsibleSection>}
                        </>
                    ) : (<div className="py-20 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800"><CheckCircle2 size={40} className="text-benin-green mx-auto mb-3" /><p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Portefeuille conforme</p></div>)}
                </div>
            </div>
        </div>
    );
}

function CollapsibleSection({ title, icon: Icon, count, isOpen, onToggle, children, color }: any) {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
            <button onClick={onToggle} className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-all">
                <div className="flex items-center gap-3"><div className={cn("p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800", color)}><Icon size={16} /></div><div className="text-left"><span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{title}</span><p className="text-[8px] text-zinc-400 font-bold uppercase">{count} manquement(s)</p></div></div>
                {isOpen ? <ChevronDown size={18} className="text-zinc-300" /> : <ChevronRight size={18} className="text-zinc-300" />}
            </button>
            {isOpen && <div className="divide-y divide-zinc-50 dark:divide-zinc-800 animate-in slide-in-from-top-1 duration-200">{children}</div>}
        </div>
    );
}

function EntityRow({ entity, isSelected, onToggle }: any) {
    return (
        <div className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-all group">
            <div className="flex items-center gap-4 min-w-0">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all shadow-sm border border-zinc-100 dark:border-zinc-800", isSelected ? "bg-benin-green/10 text-benin-green" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400")}>{entity.type === 'AGENCE' ? <Building2 size={16} /> : <Briefcase size={16} />}</div>
                <div className="min-w-0"><p className="text-[11px] font-black text-zinc-800 dark:text-zinc-100 uppercase truncate">{entity.nom}</p><div className="flex items-center gap-2 mt-0.5"><span className="text-[8px] font-black px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-400 uppercase">{entity.secteur}</span><span className="text-[8px] text-zinc-400 font-bold uppercase">• {entity.responsable}</span></div></div>
            </div>
            <button onClick={onToggle} className={cn("p-2 rounded-lg border transition-all", isSelected ? "bg-benin-green border-benin-green text-white shadow-lg" : "bg-white dark:bg-zinc-900 border-zinc-200 text-zinc-300 hover:border-benin-green hover:text-benin-green")}><Check size={12} strokeWidth={isSelected ? 4 : 2} /></button>
        </div>
    );
}
