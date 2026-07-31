"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    Briefcase,
    Building2,
    Plus,
    Search,
    ChevronDown,
    ChevronRight,
    ArrowUpRight,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [entites, setEntites] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSecteur, setFilterSecteur] = useState("all");
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['AGENCE', 'PROJET']);

    const user = session?.user as any;
    const isAdmin = user?.role === 'ADMINISTRATEUR' || user?.role === 'MINISTRE';

    const fetchEntites = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/projets');
            if (res.ok) setEntites(await res.json());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) fetchEntites();
    }, [session]);

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const filtered = entites.filter(e => {
        const matchesSearch = e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             e.responsableNom?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSecteur = filterSecteur === "all" || e.secteur === filterSecteur;
        return matchesSearch && matchesSecteur;
    });

    const agencies = filtered.filter(e => e.type === 'AGENCE');
    const projects = filtered.filter(e => e.type === 'PROJET');

    const secteurs = ["EMPLOI", "PME", "ARTISANAT", "FORMATION_PROFESSIONNELLE"];

    if (loading && entites.length === 0) return <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"><Loader2 className="animate-spin text-benin-green" size={40} /></div>;

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter uppercase leading-none">Répertoire</h2>
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1.5">
                        {isAdmin ? "Portefeuille Global Ministériel" : "Structures sous votre supervision"}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <select
                            value={filterSecteur}
                            onChange={(e) => setFilterSecteur(e.target.value)}
                            className="bg-transparent border-none outline-none text-[9px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 px-3 py-1 cursor-pointer"
                        >
                            <option value="all">Tous les secteurs</option>
                            {secteurs.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    {isAdmin && (
                        <Link href="/dashboard/projets/nouveau" className="btn-primary">
                            <Plus size={14} /> <span>Nouveau</span>
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 flex items-center gap-3 shadow-sm">
                <Search size={16} className="text-zinc-400 ml-3" />
                <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Chercher structure ou responsable..."
                    className="flex-1 bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 py-2.5 focus:ring-4 focus:ring-benin-green/5 rounded-xl transition-all"
                />
            </div>

            <div className="space-y-3">
                {agencies.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                        <button onClick={() => toggleCategory('AGENCE')} className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-blue-600"><Building2 size={16} /></div>
                                <div className="text-left">
                                    <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Agences Nationales</span>
                                    <p className="text-[8px] text-zinc-400 font-bold uppercase">{agencies.length} structure(s)</p>
                                </div>
                            </div>
                            {expandedCategories.includes('AGENCE') ? <ChevronDown size={18} className="text-zinc-300" /> : <ChevronRight size={18} className="text-zinc-300" />}
                        </button>
                        {expandedCategories.includes('AGENCE') && (
                            <div className="divide-y divide-zinc-50 dark:divide-zinc-800 border-t border-zinc-50 dark:border-zinc-800">
                                {agencies.map(e => <ProjectRow key={e.id} entity={e} />)}
                            </div>
                        )}
                    </div>
                )}

                {projects.length > 0 && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                        <button onClick={() => toggleCategory('PROJET')} className="w-full p-4 md:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-emerald-600"><Briefcase size={16} /></div>
                                <div className="text-left">
                                    <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Unités de Gestion de Projets</span>
                                    <p className="text-[8px] text-zinc-400 font-bold uppercase">{projects.length} structure(s)</p>
                                </div>
                            </div>
                            {expandedCategories.includes('PROJET') ? <ChevronDown size={18} className="text-zinc-300" /> : <ChevronRight size={18} className="text-zinc-300" />}
                        </button>
                        {expandedCategories.includes('PROJET') && (
                            <div className="divide-y divide-zinc-50 dark:divide-zinc-800 border-t border-zinc-50 dark:border-zinc-800">
                                {projects.map(e => <ProjectRow key={e.id} entity={e} />)}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ProjectRow({ entity }: { entity: any }) {
    return (
        <Link href={`/dashboard/projets/${entity.id}`} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-all group">
            <div className="flex items-center gap-4 min-w-0">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all shadow-sm border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:text-benin-green")}>
                    {entity.type === 'AGENCE' ? <Building2 size={16} /> : <Briefcase size={16} />}
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-100 uppercase truncate group-hover:text-benin-green transition-colors">{entity.nom}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-400 uppercase">{entity.secteur}</span>
                        <span className="text-[8px] text-zinc-400 font-bold uppercase">• {entity.responsableNom || "—"}</span>
                    </div>
                </div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-300 group-hover:text-benin-green group-hover:bg-benin-green/5 transition-all">
                <ArrowUpRight size={16} />
            </div>
        </Link>
    );
}
