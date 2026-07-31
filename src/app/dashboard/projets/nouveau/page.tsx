"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Save, Key, Info, Eye, EyeOff, Loader2, Building2, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agences, setAgences] = useState<any[]>([]);

  useEffect(() => {
    const fetchAgences = async () => {
      const res = await fetch('/api/projets?type=AGENCE');
      if (res.ok) {
        const data = await res.json();
        setAgences(data);
      }
    };
    fetchAgences();
  }, []);

  const [formData, setFormData] = useState({
    nom: "",
    type: "PROJET",
    secteur: "EMPLOI",
    budgetGlobal: "",
    // Nouveaux champs
    dateSignature: "",
    dateMiseEnVigueur: "",
    dateDemarrageEffectif: "",
    datePremierDecaissement: "",
    dateCloture: "",

    identifiant: "",
    password: "",
    agenceTutelleId: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/projets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error();

      await Swal.fire({
        title: 'Entité Créée !',
        text: 'Le projet et son compte accès ont été configurés avec succès.',
        icon: 'success',
        confirmButtonColor: '#008751'
      });

      router.push("/dashboard/projets");
      router.refresh();
    } catch (error) {
      Swal.fire({
        title: 'Erreur',
        text: 'Impossible de créer l\'entité. L\'identifiant est peut-être déjà utilisé.',
        icon: 'error',
        confirmButtonColor: '#E8112D'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard/projets"
            className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-benin-green transition-colors w-fit mb-2"
          >
            <ChevronLeft size={14} />
            <span>Retour au répertoire</span>
          </Link>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter uppercase">Créer une Nouvelle Entité</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* INFORMATIONS GÉNÉRALES */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-l-4 border-benin-yellow pl-4">
                <Info size={20} className="text-benin-green" />
                <h3 className="font-black text-sm uppercase tracking-tight">Informations Générales</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Type d'entité</label>
                    <select
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none appearance-none"
                    >
                        <option value="PROJET">PROJET / PROGRAMME</option>
                        <option value="AGENCE">AGENCE / STRUCTURE</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Secteur</label>
                    <select
                        value={formData.secteur}
                        onChange={e => setFormData({...formData, secteur: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none appearance-none"
                    >
                        <option value="EMPLOI">EMPLOI</option>
                        <option value="PME">PME</option>
                        <option value="ARTISANAT">ARTISANAT</option>
                        <option value="FORMATION_PROFESSIONNELLE">FORMATION PRO</option>
                    </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nom de l'Entité</label>
                    <input
                        type="text"
                        value={formData.nom}
                        onChange={e => setFormData({...formData, nom: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none"
                        required
                    />
                </div>
                {formData.type === 'PROJET' && (
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Agence de Tutelle (Optionnel)</label>
                        <select
                            value={formData.agenceTutelleId}
                            onChange={e => setFormData({...formData, agenceTutelleId: e.target.value})}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none appearance-none"
                        >
                            <option value="">AUCUNE TUTELLE</option>
                            {agences.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                        </select>
                    </div>
                )}
            </div>
          </div>

          {/* DÉTAILS TECHNIQUES ET DATES */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-l-4 border-benin-yellow pl-4">
                <Calendar size={20} className="text-benin-green" />
                <h3 className="font-black text-sm uppercase tracking-tight">Dates Clés et Budget</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Coût global du projet (FCFA)</label>
                    <input
                        type="number"
                        value={formData.budgetGlobal}
                        onChange={e => setFormData({...formData, budgetGlobal: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none"
                        placeholder="ex: 35000000000"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Date de signature</label>
                    <input type="date" value={formData.dateSignature} onChange={e => setFormData({...formData, dateSignature: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Date de mise en vigueur</label>
                    <input type="date" value={formData.dateMiseEnVigueur} onChange={e => setFormData({...formData, dateMiseEnVigueur: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Démarrage effectif</label>
                    <input type="date" value={formData.dateDemarrageEffectif} onChange={e => setFormData({...formData, dateDemarrageEffectif: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">1er décaissement</label>
                    <input type="date" value={formData.datePremierDecaissement} onChange={e => setFormData({...formData, datePremierDecaissement: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 text-red-500">Date de clôture prévue</label>
                    <input type="date" value={formData.dateCloture} onChange={e => setFormData({...formData, dateCloture: e.target.value})} className="w-full bg-red-50/30 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 rounded-2xl py-4 px-5 text-xs font-bold outline-none" />
                </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* ACCÈS SÉCURITÉ */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-l-4 border-benin-yellow pl-4">
                <Key size={20} className="text-benin-green" />
                <h3 className="font-black text-sm uppercase tracking-tight">Accès Responsable</h3>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Identifiant</label>
                    <input type="text" value={formData.identifiant} onChange={e => setFormData({...formData, identifiant: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-mono outline-none" placeholder="ex: resp_psie" required />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Mot de Passe</label>
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 pr-12 text-xs outline-none" placeholder="••••••••" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-benin-green hover:bg-benin-green/90 py-6 rounded-[1.5rem] font-black uppercase text-xs text-white transition-all shadow-xl shadow-benin-green/20 flex items-center justify-center gap-3 clickable-scale"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            <span>Enregistrer l'Entité</span>
          </button>
        </div>
      </div>
    </form>
  );
}
