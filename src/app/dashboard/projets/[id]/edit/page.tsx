"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Building2, Save, Key, Info, ChevronLeft, AlertTriangle, Eye, EyeOff, Loader2, Calendar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Swal from 'sweetalert2';

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveModule] = useState("infos");
  const [showPassword, setShowPassword] = useState(false);
  const [agences, setAgences] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nom: "",
    type: "",
    secteur: "",
    budgetGlobal: "",
    // Nouveaux champs
    dateSignature: "",
    dateMiseEnVigueur: "",
    dateDemarrageEffectif: "",
    datePremierDecaissement: "",
    dateCloture: "",

    statut: "",
    identifiant: "",
    password: "",
    agenceTutelleId: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, agencesRes] = await Promise.all([
          fetch(`/api/projets/${params.id}`),
          fetch('/api/projets?type=AGENCE')
        ]);

        if (!projectRes.ok) throw new Error();
        const data = await projectRes.json();

        if (agencesRes.ok) {
          const agencesData = await agencesRes.json();
          setAgences(agencesData.filter((a: any) => a.id !== params.id));
        }

        setFormData({
          nom: data.nom || "",
          type: data.type || "PROJET",
          secteur: data.secteur || "",
          budgetGlobal: data.coutGlobalProjet ? data.coutGlobalProjet.toString() : "",

          dateSignature: data.dateSignature ? data.dateSignature.split('T')[0] : "",
          dateMiseEnVigueur: data.dateMiseEnVigueur ? data.dateMiseEnVigueur.split('T')[0] : "",
          dateDemarrageEffectif: data.dateDemarrageEffectif ? data.dateDemarrageEffectif.split('T')[0] : "",
          datePremierDecaissement: data.datePremierDecaissement ? data.datePremierDecaissement.split('T')[0] : "",
          dateCloture: data.dateCloture ? data.dateCloture.split('T')[0] : "",

          statut: data.statut || "EN_COURS",
          identifiant: data.utilisateur?.identifiant || "",
          password: "",
          agenceTutelleId: data.agenceTutelleId || ""
        });
      } catch (error) {
        Swal.fire('Erreur', 'Impossible de charger les données.', 'error');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [params.id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/projets/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error();

      await Swal.fire({
        title: 'Succès !',
        text: 'Les informations officielles ont été mises à jour.',
        icon: 'success',
        confirmButtonColor: '#008751'
      });

      router.refresh();
      router.push(`/dashboard/projets/${params.id}`);
    } catch (error) {
      Swal.fire('Erreur', 'Échec de la mise à jour.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-benin-green" size={40} /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
      <Link href={`/dashboard/projets/${params.id}`} className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-benin-green transition-colors w-fit">
        <ChevronLeft size={14} /><span>Retour aux détails</span>
      </Link>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button onClick={() => setActiveModule("infos")} className={cn("flex items-center gap-3 p-4 rounded-2xl border transition-all font-black text-[10px] uppercase", activeTab === "infos" ? "bg-benin-green text-white border-benin-green shadow-lg" : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800")}>
          <Info size={18} /><span>Informations</span>
        </button>
        <button onClick={() => setActiveModule("dates")} className={cn("flex items-center gap-3 p-4 rounded-2xl border transition-all font-black text-[10px] uppercase", activeTab === "dates" ? "bg-benin-yellow text-zinc-900 border-benin-yellow shadow-lg" : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800")}>
          <Calendar size={18} /><span>Calendrier & Budget</span>
        </button>
        <button onClick={() => setActiveModule("access")} className={cn("flex items-center gap-3 p-4 rounded-2xl border transition-all font-black text-[10px] uppercase", activeTab === "access" ? "bg-zinc-900 text-white border-zinc-900 shadow-lg" : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800")}>
          <Key size={18} /><span>Sécurité</span>
        </button>
      </div>

      <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "infos" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-3 border-l-4 border-benin-yellow pl-4">
                  <Info size={20} className="text-benin-green" />
                  <h3 className="font-black text-sm uppercase">Détails de l'Entité</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Type</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none appearance-none">
                        <option value="PROJET">PROJET</option>
                        <option value="AGENCE">AGENCE</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Secteur</label>
                    <select value={formData.secteur} onChange={e => setFormData({...formData, secteur: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none appearance-none uppercase">
                        <option value="EMPLOI">EMPLOI</option>
                        <option value="PME">PME</option>
                        <option value="ARTISANAT">ARTISANAT</option>
                        <option value="FORMATION_PROFESSIONNELLE">FORMATION PRO</option>
                    </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nom Officiel</label>
                    <input type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none uppercase" required />
                </div>
                {formData.type === 'PROJET' && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tutelle Administrative</label>
                    <select value={formData.agenceTutelleId} onChange={e => setFormData({...formData, agenceTutelleId: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none appearance-none uppercase">
                      <option value="">AUCUNE TUTELLE</option>
                      {agences.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "dates" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-3 border-l-4 border-benin-yellow pl-4">
                  <Calendar size={20} className="text-benin-green" />
                  <h3 className="font-black text-sm uppercase">Calendrier et Budget</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Budget Total du Projet (FCFA)</label>
                    <input type="number" value={formData.budgetGlobal} onChange={e => setFormData({...formData, budgetGlobal: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Date de signature</label>
                    <input type="date" value={formData.dateSignature} onChange={e => setFormData({...formData, dateSignature: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-bold outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Mise en vigueur</label>
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
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1 text-red-500">Clôture prévue</label>
                    <input type="date" value={formData.dateCloture} onChange={e => setFormData({...formData, dateCloture: e.target.value})} className="w-full bg-red-50/30 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 rounded-2xl py-4 px-5 text-xs font-bold outline-none" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "access" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <div className="flex items-center gap-3 border-l-4 border-benin-yellow pl-4">
                  <Key size={20} className="text-benin-green" />
                  <h3 className="font-black text-sm uppercase">Accès Responsable</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Identifiant</label>
                  <input type="text" value={formData.identifiant} onChange={e => setFormData({...formData, identifiant: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 text-xs font-mono font-bold outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nouveau Mot de Passe</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl py-4 px-5 pr-12 text-xs font-bold outline-none" placeholder="Laisser vide pour ne pas changer" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-benin-green rounded-[2rem] p-8 text-white shadow-xl shadow-benin-green/20">
            <button type="submit" disabled={loading} className="w-full bg-white text-benin-green hover:bg-zinc-50 py-5 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>Mettre à jour</span>
            </button>
          </div>

          <div className="p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-start gap-4">
             <AlertTriangle className="text-benin-yellow shrink-0" size={20} />
             <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed">
               Les modifications apportées ici impacteront les rapports consolidés et les fiches de soumission hebdomadaires.
             </p>
          </div>
        </div>
      </form>
    </div>
  );
}
