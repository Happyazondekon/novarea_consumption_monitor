"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Target,
  BarChart4,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Paperclip,
  Loader2,
  Lock,
  ExternalLink,
  Plus,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateSubmissionPDF } from "@/lib/pdf-generator";

const modules = [
  { id: 0, name: "Identification", icon: Info },
  { id: 1, name: "Gestion des Ressources", icon: Users },
  { id: 2, name: "Activités PTA", icon: Target },
  { id: 3, name: "Performances", icon: BarChart4 },
  { id: 4, name: "Instructions Cabinet", icon: ShieldCheck },
];

export default function SubmissionDetailsPage({ params }: { params: { id: string } }) {
  const [activeModule, setActiveModule] = useState(0);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await fetch(`/api/soumissions`);
        const all = await res.json();
        const found = all.find((s: any) => s.id === params.id);
        setSubmission(found);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [params.id]);

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-benin-green" size={40} /></div>;
  if (!submission) return <div className="p-20 text-center uppercase font-black text-zinc-400">Soumission introuvable</div>;

  const observations = submission.observationsJSON ? JSON.parse(submission.observationsJSON) : {};
  const nextModule = () => setActiveModule((prev) => Math.min(prev + 1, 4));
  const prevModule = () => setActiveModule((prev) => Math.max(prev - 1, 0));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard/soumissions" className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-benin-green mb-2 transition-colors">
            <ChevronLeft size={14} /><span>Retour à l'historique</span>
          </Link>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase tracking-tighter">
            Consultation du Rapport
          </h2>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
             Soumis le {new Date(submission.dateSoumission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} à {new Date(submission.dateSoumission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block px-4 py-2 border-l border-zinc-200 dark:border-zinc-800 mr-4">
              <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">ID Rapport</p>
              <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">#{submission.id.substring(0, 8)}</p>
          </div>
          <button onClick={() => generateSubmissionPDF(submission)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl">
            <Download size={14} />
            <span>Exporter PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {modules.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveModule(m.id)}
            className={cn(
              "flex flex-col items-center p-3 rounded-2xl border transition-all duration-300",
              activeModule === m.id
                ? "bg-benin-green text-white border-benin-green shadow-lg shadow-benin-green/20"
                : "bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
            )}
          >
            <m.icon size={18} className="mb-2" />
            <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight">{m.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl shadow-zinc-200/10 dark:shadow-none">
        <div className="p-6 md:p-10 space-y-12">
          {activeModule === 0 && <ViewIdentification submission={submission} observations={observations} />}
          {activeModule === 1 && (
            <div className="space-y-6">
              <CollapsibleSection title="Section 1.1 — Ressources Humaines" defaultOpen={true}>
                <ViewRH submission={submission} observations={observations} />
              </CollapsibleSection>
              <CollapsibleSection title="Section 1.2 — Ressources Financières">
                <ViewFinancier submission={submission} observations={observations} />
              </CollapsibleSection>
              <CollapsibleSection title="Section 1.3 — Ressources Matérielles et Système d'Information">
                <ViewMateriel submission={submission} />
              </CollapsibleSection>
              <CollapsibleSection title="Section 1.4 — Gouvernance et Coordination">
                <ViewGouvernance submission={submission} />
              </CollapsibleSection>
              <CollapsibleSection title="Section 1.5 — Passation des marchés">
                <ViewMarches submission={submission} />
              </CollapsibleSection>
            </div>
          )}
          {activeModule === 2 && <ViewPTA submission={submission} observations={observations} />}
          {activeModule === 3 && <ViewPerformance submission={submission} />}
          {activeModule === 4 && <ViewCabinet submission={submission} />}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
          <button onClick={prevModule} disabled={activeModule === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-20 uppercase tracking-widest transition-all">
            <ChevronLeft size={16} /> <span>Précédent</span>
          </button>
          <button onClick={nextModule} disabled={activeModule === 4} className="flex items-center gap-2 px-8 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all clickable-scale">
            <span>Suivant</span> <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-l-4 border-benin-yellow pl-4 mb-8">
      <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">{title}</h3>
      {subtitle && <p className="text-[10px] text-zinc-500 font-medium uppercase mt-1">{subtitle}</p>}
    </div>
  );
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <table className="w-full text-left text-[10px] border-collapse">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-800/50 uppercase font-black text-zinc-400 tracking-tighter border-b border-zinc-200 dark:border-zinc-800">
            {headers.map((h, i) => (
              <th key={i} className="p-3 align-top whitespace-normal border-r border-zinc-200 dark:border-zinc-800 last:border-0 min-w-[80px]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {children}
        </tbody>
      </table>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900/50 shadow-sm">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={cn("w-1.5 h-6 rounded-full", isOpen ? "bg-benin-green" : "bg-zinc-300")} />
          <span className="font-black text-xs uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <div className={cn("p-6 pt-0 space-y-6", isOpen ? "block animate-fade-in" : "hidden")}>
        <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 mb-6" />
        {children}
      </div>
    </div>
  );
}

function ReadOnlyCell({ value }: { value: any }) {
    return <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">{value === null || value === "" || value === undefined ? "N/A" : value.toString()}</span>;
}

function FileLink({ submission, fieldKey }: { submission: any, fieldKey: string }) {
    const file = submission.piecesJointes?.find((p: any) => p.typeDocument === fieldKey);
    if (!file) return <span className="text-[8px] font-black text-zinc-300 uppercase italic">Aucun document joint</span>;
    return (
        <a href={file.url} target="_blank" className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-benin-green/10 text-benin-green text-[9px] font-black uppercase hover:bg-benin-green hover:text-white transition-all shadow-sm">
            <Paperclip size={12} /><span>Consulter le Justificatif</span>
        </a>
    );
}

// --- MODULE 0 : IDENTIFICATION (VERBATIM) ---
function ViewIdentification({ submission, observations }: any) {
  return (
    <section>
        <SectionHeader title="Identification et Informations Générales" subtitle="Les informations bloquées proviennent du registre officiel." />
        <DataTable headers={["N°", "Éléments", "Données", "Commentaires"]}>
          <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">1.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Nom de l'entité</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.entite.nom} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.nomEntite || "N/A"}</td></tr>
          <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">2.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Localisation</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.entite.localisation} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.localisation || "N/A"}</td></tr>
          <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">3.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Nom et Prénoms du Responsable</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.entite.responsableNom} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.nomResponsable || "N/A"}</td></tr>
          <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">4.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Date de nomination du Responsable</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.entite.dateNominationResp ? new Date(submission.entite.dateNominationResp).toLocaleDateString() : null} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.dateNomination || "N/A"}</td></tr>
          <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">5.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Contact du Responsable (Tél et email)</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.entite.emailContactFallback} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.contactResponsable || "N/A"}</td></tr>
          <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">6.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Nombre d'agents</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs uppercase text-zinc-900 dark:text-zinc-100">Fct: {submission.effectifRecrute || 0} | ACPDE: 0 | Autres: 0</td><td className="p-3 italic text-zinc-500">{observations.rh?.agents || "N/A"}</td></tr>
          <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">7.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Cout global du projet par source de financement</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.entite.coutGlobalProjet ? `${Number(submission.entite.coutGlobalProjet).toLocaleString()} FCFA` : null} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.coutGlobalProjet || "N/A"}</td></tr>
          <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">8.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Montant total du budget 2026</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.entite.budget2026 ? `${Number(submission.entite.budget2026).toLocaleString()} FCFA` : null} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.montantBudget2026 || "N/A"}</td></tr>
          <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">9.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Date de création</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.entite.dateCreationEntite ? new Date(submission.entite.dateCreationEntite).toLocaleDateString() : null} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.dateCreation || "N/A"}</td></tr>
          <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">10.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Date de démarrage des activités</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.entite.dateDemarrage ? new Date(submission.entite.dateDemarrage).toLocaleDateString() : null} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.dateDemarrageActivites || "N/A"}</td></tr>
          <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">11.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Date de clôture</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.entite.dateCloture ? new Date(submission.entite.dateCloture).toLocaleDateString() : null} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.dateCloture || "N/A"}</td></tr>
        </DataTable>
    </section>
  );
}

// --- MODULE 1.1 ---
function ViewRH({ submission, observations }: any) {
    return (
        <DataTable headers={["N°", "Donnée à collecter", "Réponse", "Observations"]}>
            <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">1.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Effectif à recruter (les procédures à lancer la semaine prochaine)</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.effectifARecruter} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.effectifARecruter || "N/A"}</td></tr>
            <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">2.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Effectif recruté (Nouvelles recrues de la semaine)</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.effectifRecrute} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.effectifRecrute || "N/A"}</td></tr>
            <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">3.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Nombre de départ</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs uppercase text-zinc-900 dark:text-zinc-100">Retraite: {submission.departRetraite || 0} | Démission: {submission.departDemission || 0} | Licenc: {submission.departLicenciement || 0} | Fin: {submission.departFinContrat || 0}</td><td className="p-3 italic text-zinc-500">{observations.rh?.departs || "N/A"}</td></tr>
            <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">4.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Taux d'exécution du plan de formation</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.tauxExecutionPlanFormation ? `${submission.tauxExecutionPlanFormation}%` : null} /></td><td className="p-3 italic text-zinc-500">{observations.rh?.tauxExecutionFormation || "N/A"}</td></tr>
        </DataTable>
    );
}

// --- MODULE 1.2 ---
function ViewFinancier({ submission, observations }: any) {
    return (
        <div className="space-y-8">
            <div>
                <SectionHeader title="Section 1.2.1 : Ressources Financières et Exécution Budgétaire" />
                <DataTable headers={["N°", "Donnée à collecter", "taux", "Montant période", "Montant cumulé"]}>
                    <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">1.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Budget total alloué à la Direction/Agence (FCFA)</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><ReadOnlyCell value={submission.budgetTotalAlloue} /></td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">-</td><td className="p-3">-</td></tr>
                    <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">2.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Taux d'engagement budgétaire (%) à date</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-black text-benin-green text-xs">{submission.tauxEngagement || 0}%</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">-</td><td className="p-3">-</td></tr>
                    <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">3.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Taux d'ordonnancement / liquidation (%) à date</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-black text-xs">{submission.tauxOrdonnancement || 0}%</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">-</td><td className="p-3">-</td></tr>
                    <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">4.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Taux de paiement effectif (%) à date</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-black text-xs">{submission.tauxPaiement || 0}%</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">-</td><td className="p-3">-</td></tr>
                    <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">5.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Montant des dettes et arriérés envers les fournisseurs (FCFA)</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">-</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs">{Number(submission.montantDettes || 0).toLocaleString()}</td><td className="p-3">-</td></tr>
                    <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">6.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Ressources propres générées par les structures sous tutelle (FCFA) à date</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">-</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800">-</td><td className="p-3 font-bold text-xs">{Number(submission.ressourcesPropres || 0).toLocaleString()}</td></tr>
                </DataTable>
            </div>
            <div>
                <SectionHeader title="Section 1.2.2 : Mobilisation et Consommation de ressources des bailleurs" />
                <DataTable headers={["N°", "Bailleur", "Taux mobilisé à date", "Montant mobilisé de la période", "Montant mobilisé cumulé à date", "Taux consommé à date", "Montant consommé de la période", "Montant consommé cumulé à date"]}>
                    {submission.financementsExterieurs?.length > 0 ? submission.financementsExterieurs.map((b:any, i:number) => (
                        <tr key={i}>
                            <td className="p-2 border-r border-zinc-200 dark:border-zinc-800 font-black text-zinc-400">{i+1}.</td>
                            <td className="p-2 border-r border-zinc-200 dark:border-zinc-800 font-bold">{b.bailleur}</td>
                            <td className="p-2 border-r border-zinc-200 dark:border-zinc-800">{Number(b.tauxMobilise)}%</td>
                            <td className="p-2 border-r border-zinc-200 dark:border-zinc-800">{Number(b.montantMobilisePeriode).toLocaleString()}</td>
                            <td className="p-2 border-r border-zinc-200 dark:border-zinc-800">{Number(b.montantMobiliseCumule).toLocaleString()}</td>
                            <td className="p-2 border-r border-zinc-200 dark:border-zinc-800 font-black text-benin-green">{Number(b.tauxConsomme)}%</td>
                            <td className="p-2 border-r border-zinc-200 dark:border-zinc-800">{Number(b.montantConsommePeriode).toLocaleString()}</td>
                            <td className="p-2">{Number(b.montantConsommeCumule).toLocaleString()}</td>
                        </tr>
                    )) : <tr><td colSpan={8} className="p-4 text-center font-bold text-zinc-300 uppercase">Néant</td></tr>}
                </DataTable>
            </div>
        </div>
    );
}

// --- MODULE 1.3 ---
function ViewMateriel({ submission }: any) {
    return (
        <DataTable headers={["N°", "Donnée à collecter", "Réponse", "Observations"]}>
            <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">1.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Avez-vous réceptionné de nouvelles acquisitions de matières (actifs immobilisés) si oui faites le point des matériels livrés</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs">{submission.nouvellesAcquisitions ? 'OUI' : 'NON'}</td><td className="p-3 flex items-center gap-4"><span className="italic text-zinc-500">{submission.nouvellesAcquisitions || "N/A"}</span><FileLink submission={submission} fieldKey="m1_acquisitions" /></td></tr>
            <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">2.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Avez-vous réceptionné des prestations immatérielles ? (études, logiciels, et autres) Si oui faites le point</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs">{submission.prestationsImmaterielles ? 'OUI' : 'NON'}</td><td className="p-3 flex items-center gap-4"><span className="italic text-zinc-500">{submission.prestationsImmaterielles || "N/A"}</span><FileLink submission={submission} fieldKey="m1_immaterielles" /></td></tr>
            <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">3.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Les systèmes d’informations sont-ils fonctionnels ?</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs">{submission.systemeInfoFonctionnel ? 'OUI' : 'NON'}</td><td className="p-3 italic text-zinc-500">N/A</td></tr>
        </DataTable>
    );
}

// --- MODULE 1.4 ---
function ViewGouvernance({ submission }: any) {
    return (
        <DataTable headers={["N°", "Question", "Réponse", "Précisions", "Observations"]}>
            <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">1.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Le Comité de Direction s’est-il réunit ?</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs">{submission.comiteDirectionReuni ? 'OUI' : 'NON'}</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs">{submission.comiteDirectionPrecisions || "N/A"}</td><td className="p-3 flex items-center gap-4"><FileLink submission={submission} fieldKey="m1_codir" /></td></tr>
            <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">2.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Nouvelles conventions ou protocoles signés</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs">{submission.nouvellesConventions ? 'OUI' : 'NON'}</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs">{submission.nouvellesConventions || "N/A"}</td><td className="p-3 flex items-center gap-4"><FileLink submission={submission} fieldKey="m1_conventions" /></td></tr>
            <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">3.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Le Conseil d’administration ou le CoPil est il à jour des sessions ordinaires ?</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs">{submission.capCopilAJour ? 'OUI' : 'NON'}</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs">N/A</td><td className="p-3 italic text-zinc-500">N/A</td></tr>
        </DataTable>
    );
}

// --- MODULE 1.5 ---
function ViewMarches({ submission }: any) {
    const p = submission.marches?.filter((m:any) => m.phase === 'PASSATION_EN_COURS') || [];
    const l = submission.marches?.filter((m:any) => m.phase === 'A_LANCER') || [];
    const e = submission.marches?.filter((m:any) => m.phase === 'EN_EXECUTION') || [];

    return (
        <div className="space-y-12">
            <div>
                <p className="text-[9px] font-black uppercase text-zinc-400 mb-2">Les marchés dont la passation en cours pendant la période</p>
                <DataTable headers={["N°", "Libellé", "Étape", "Mode", "Montant prévisionnel", "Date lancement", "Obs"]}>
                    {p.length > 0 ? p.map((m:any, i:number) => (
                        <tr key={i}><td className="p-2 border-r border-zinc-200 dark:border-zinc-800">{i+1}</td><td className="p-2 border-r border-zinc-200 dark:border-zinc-800 font-bold">{m.libelle}</td><td className="p-2 border-r border-zinc-200 dark:border-zinc-800">{m.etape}</td><td className="p-2 border-r border-zinc-200 dark:border-zinc-800">{m.modePassation}</td><td className="p-2 border-r border-zinc-200 dark:border-zinc-800">{Number(m.montantPrevisionnel).toLocaleString()}</td><td className="p-2 border-r border-zinc-200 dark:border-zinc-800">{m.dateLancementOffre ? new Date(m.dateLancementOffre).toLocaleDateString() : "-"}</td><td className="p-2">{m.observations}</td></tr>
                    )) : <tr><td colSpan={7} className="p-4 text-center font-bold text-zinc-300 uppercase">Néant</td></tr>}
                </DataTable>
            </div>
            <div>
                <SectionHeader title="STATISTIQUES MARCHÉS" />
                <DataTable headers={["N°", "STATISTIQUES MARCHÉS", "VALEUR", "Observations"]}>
                    <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">1.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Montant total des marchés passés à date</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-black text-xs">{Number(submission.montantTotalMarchesPasses || 0).toLocaleString()} FCFA</td><td className="p-3 italic text-zinc-500">N/A</td></tr>
                    <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">2.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Taux de réalisation du PPPM</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-black text-benin-green text-xs">{submission.tauxRealisationPPPM || 0}%</td><td className="p-3 italic text-zinc-500">N/A</td></tr>
                </DataTable>
            </div>
        </div>
    );
}

// --- MODULE 2 ---
function ViewPTA({ submission, observations }: any) {
    return (
        <section>
            <SectionHeader title="Section 2.1 — l’exécution des activités prévues au PTA" />
            <DataTable headers={["N°", "Question / Donnée à collecter", "Réponse / Valeur", "Observations"]}>
                <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">1.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Les activités du PTA prévues pour la période ont-elles été réalisées ?</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold text-xs uppercase text-zinc-900 dark:text-zinc-100">{submission.activitesPTARealisees ? 'OUI' : 'NON'}</td><td className="p-3 italic text-zinc-500">{observations.pta || "N/A"}</td></tr>
                <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">2.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Quelles sont les activités clés réalisés ?</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 italic text-zinc-500">{submission.activitesClesRealisees || "N/A"}</td><td className="p-3"><FileLink submission={submission} fieldKey="m2_pta" /></td></tr>
                <tr><td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">3.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Quelles sont les facteurs bloquants</td><td className="p-3" colSpan={2}><ReadOnlyCell value={submission.facteursBloquants} /></td></tr>
            </DataTable>
        </section>
    );
}

// --- MODULE 3 ---
function ViewPerformance({ submission }: any) {
    return (
        <section>
            <SectionHeader title="Section 3.1 — Tableau de Bord des Indicateurs de Performance" />
            <DataTable headers={["N°", "Programme / Axe", "Indicateur de Performance", "Unité", "Cible 31/12/2026", "TAUX D'ATTEINTE A DATE (%)", "Commentaire"]}>
                {submission.indicateurs?.length > 0 ? submission.indicateurs.map((ind:any, i:number) => (
                    <tr key={i}>
                        <td className="p-3 border-r border-zinc-200 dark:border-zinc-800">{i+1}.</td>
                        <td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-black"><span className="text-[8px] px-2 py-1 rounded bg-red-50 text-red-600 uppercase">{ind.programmeAxe}</span></td>
                        <td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold">{ind.indicateur}</td>
                        <td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold">{ind.unite}</td>
                        <td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-black">{Number(ind.cible).toLocaleString()}</td>
                        <td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-black text-benin-green">{ind.tauxAtteinte}%</td>
                        <td className="p-3 italic text-zinc-500">"{ind.commentaire || "N/A"}"</td>
                    </tr>
                )) : <tr><td colSpan={7} className="p-8 text-center font-bold text-zinc-300 uppercase">Aucun indicateur de performance défini</td></tr>}
            </DataTable>
        </section>
    );
}

// --- MODULE 4 ---
function ViewCabinet({ submission }: any) {
    return (
        <section>
            <SectionHeader title="MODULE 4 — SUIVI DES INSTRUCTIONS DU CABINIET SUITE A LA REVUE" />
            <DataTable headers={["N°", "Axes concernés", "Instructions données", "Tâches exécutées", "Taux d’exécution"]}>
                {submission.instructions?.length > 0 ? submission.instructions.map((ins:any, i:number) => (
                    <tr key={i}>
                        <td className="p-3 border-r border-zinc-200 dark:border-zinc-800 w-10">{i+1}.</td>
                        <td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-black"><span className="text-[8px] px-2 py-1 rounded bg-zinc-100 text-zinc-600 uppercase">{ins.axe}</span></td>
                        <td className="p-3 border-r border-zinc-200 dark:border-zinc-800 font-bold italic">"{ins.instructionsDonnees}"</td>
                        <td className="p-3 border-r border-zinc-200 dark:border-zinc-800">{ins.tachesExecutees}</td>
                        <td className="p-3 font-black text-benin-green">{ins.tauxExecution}%</td>
                    </tr>
                )) : <tr><td colSpan={5} className="p-8 text-center font-bold text-zinc-300 uppercase">Aucune instruction de la revue n'est enregistrée pour cette période</td></tr>}
            </DataTable>
        </section>
    );
}
