"use client";

import { Search, Filter, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function ProjectFilters({
  query,
  secteurFilter,
  typeFilter,
  secteurs
}: {
  query: string;
  secteurFilter: string;
  typeFilter: string;
  secteurs: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    router.push(`/dashboard/projets?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q); else params.delete("q");
    router.push(`/dashboard/projets?${params.toString()}`);
  };

  const isFiltered = query || secteurFilter !== "all" || typeFilter !== "all";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-4 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
      <form onSubmit={handleSearch} className="flex-1 w-full relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-benin-green transition-colors" size={18} />
        <input
          name="q"
          defaultValue={query}
          placeholder="Rechercher par nom de projet ou responsable..."
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-benin-green/20 transition-all"
        />
      </form>

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
        {/* Filtre Secteur */}
        <div className="relative">
          <select
            value={secteurFilter}
            onChange={(e) => handleFilterChange("secteur", e.target.value)}
            className="appearance-none bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl py-2.5 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-benin-green/20 transition-all cursor-pointer"
          >
            <option value="all">Secteur : TOUS</option>
            {secteurs.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
          </select>
          <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
        </div>

        {/* Filtre Type */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => handleFilterChange("type", e.target.value)}
            className="appearance-none bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl py-2.5 pl-4 pr-10 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-benin-green/20 transition-all cursor-pointer"
          >
            <option value="all">Type : TOUS</option>
            <option value="AGENCE">AGENCE</option>
            <option value="PROJET">PROJET</option>
          </select>
          <Filter size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
        </div>

        {isFiltered && (
          <Link href="/dashboard/projets" className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
            <X size={18} />
          </Link>
        )}
      </div>
    </div>
  );
}
