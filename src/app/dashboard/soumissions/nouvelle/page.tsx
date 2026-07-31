"use client";

import { useState, useEffect, Suspense } from "react";
import {
  Users,
  Target,
  BarChart4,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  Info,
  Paperclip,
  Loader2,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import Swal from "sweetalert2";
import { useRouter, useSearchParams } from "next/navigation";
import { useTutorial } from "@/components/TutorialProvider";

const modules = [
  { id: 0, name: "Identification", icon: Info },
  { id: 1, name: "Gestion des Ressources", icon: Users },
  { id: 2, name: "Activités PTA", icon: Target },
  { id: 3, name: "Performances", icon: BarChart4 },
  { id: 4, name: "Instructions Cabinet", icon: ShieldCheck },
];

// --- TYPES ---
type ChampLibre = { label: string; valeur: string };
type ReponseObs = { reponse: string; observations: string; fichier: File | null };
type ReponsePrecObs = { reponse: string; precisions: string; observations: string; fichier: File | null };
type LigneFinanciere = { taux: string; montantPeriode: string; montantCumule: string };

type Bailleur = {
  nom: string;
  tauxMobilise: string;
  montantMobilisePeriode: string;
  montantMobiliseCumule: string;
  tauxConsomme: string;
  montantConsommePeriode: string;
  montantConsommeCumule: string;
};

type MarcheEnCours = {
  libelle: string;
  etape: string;
  modePassation: string;
  montantPrevisionnel: string;
  dateLancementOffre: string;
  observations: string;
};

type MarcheALancer = {
  libelle: string;
  modePassation: string;
  montantPrevisionnel: string;
  dateLancement: string;
  observations: string;
};

type MarcheExecution = {
  libelle: string;
  dateOrdreService: string;
  dateLivraisonPrevisionnelle: string;
  tauxExecution: string;
  observations: string;
};

type IndicateurPerformance = {
  indicateur: string;
  unite: string;
  cible2026: string;
  tauxAtteinte: string;
  commentaire: string;
};

type AxePerformance = {
  axe: string;
  indicateurs: IndicateurPerformance[];
};

type InstructionCabinet = {
  instructionDonnee: string;
  tachesExecutees: string;
  tauxExecution: string;
};

type AxeCabinet = {
  axe: string;
  instructions: InstructionCabinet[];
};

// Composant interne pour utiliser useSearchParams en toute sécurité avec Suspense
function SubmissionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const { startIdentificationTour } = useTutorial();
  const [activeModule, setActiveModule] = useState(0);
  const [fetchingInfo, setFetchingInfo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- ÉTATS DU FORMULAIRE ---
  const [identification, setIdentification] = useState({
    nomEntite: "", localisation: "", nomResponsable: "", dateNomination: "", contactResponsable: "",
    agentsFonctionnaires: "", agentsACPDE: "", agentsAutres: "",
    coutGlobalProjet: "", montantBudget2026: "", dateCreation: "", dateDemarrageActivites: "", dateCloture: "",
    commentaires: {} as Record<string, string>,
  });
  const [identificationExtra, setIdentificationExtra] = useState<ChampLibre[]>([]);

  const [rh, setRh] = useState({
    effectifARecruter: "", effectifRecrute: "", departRetraite: "", demission: "", licenciement: "", finContrat: "",
    tauxExecutionFormation: "", observations: {} as Record<string, string>,
  });

  const emptyLigneFinanciere: LigneFinanciere = { taux: "", montantPeriode: "", montantCumule: "" };
  const [financier, setFinancier] = useState({
    budgetTotalAlloue: { ...emptyLigneFinanciere },
    tauxEngagement: { ...emptyLigneFinanciere },
    tauxOrdonnancement: { ...emptyLigneFinanciere },
    tauxPaiement: { ...emptyLigneFinanciere },
    montantDettes: { ...emptyLigneFinanciere, montantPeriode: "" },
    ressourcesPropres: { ...emptyLigneFinanciere, montantCumule: "" },
  });
  const [bailleurs, setBailleurs] = useState<Bailleur[]>([{ nom: "", tauxMobilise: "", montantMobilisePeriode: "", montantMobiliseCumule: "", tauxConsomme: "", montantConsommePeriode: "", montantConsommeCumule: "" }]);

  const [materiel, setMateriel] = useState({
    nouvellesAcquisitions: { reponse: "", observations: "", fichier: null } as ReponseObs,
    prestationsImmaterielles: { reponse: "", observations: "", fichier: null } as ReponseObs,
    systemesInfoFonctionnels: { reponse: "", observations: "" },
  });

  const [gouvernance, setGouvernance] = useState({
    comiteDirectionReuni: { reponse: "", precisions: "", observations: "", fichier: null } as ReponsePrecObs,
    nouvellesConventions: { reponse: "", precisions: "", observations: "", fichier: null } as ReponsePrecObs,
    conseilAdminCoPilAJour: { reponse: "", precisions: "", observations: "", fichier: null } as ReponsePrecObs,
  });

  const [marchesEnCours, setMarchesEnCours] = useState<MarcheEnCours[]>([{ libelle: "", etape: "", modePassation: "", montantPrevisionnel: "", dateLancementOffre: "", observations: "" }]);
  const [marchesALancer, setMarchesALancer] = useState<MarcheALancer[]>([{ libelle: "", modePassation: "", montantPrevisionnel: "", dateLancement: "", observations: "" }]);
  const [marchesExecution, setMarchesExecution] = useState<MarcheExecution[]>([{ libelle: "", dateOrdreService: "", dateLivraisonPrevisionnelle: "", tauxExecution: "", observations: "" }]);
  const [statistiquesMarches, setStatistiquesMarches] = useState({ montantTotalMarchesPasses: "", observationsMontantTotal: "", tauxRealisationPPPM: "", observationsTauxPPPM: "" });

  const [module1Extra, setModule1Extra] = useState<ChampLibre[]>([]);

  const [pta, setPta] = useState({ activitesRealisees: "", observationsRealisees: "", activitesClesTexte: "", activitesClesFichier: null as File | null, facteursBloquants: "", observationsFacteurs: "" });
  const [module2Extra, setModule2Extra] = useState<ChampLibre[]>([]);

  const [axesPerformance, setAxesPerformance] = useState<AxePerformance[]>([
    { axe: "Ressources humaines, financières et matérielles", indicateurs: [{ indicateur: "", unite: "", cible2026: "", tauxAtteinte: "", commentaire: "" }] },
    { axe: "Gouvernance", indicateurs: [{ indicateur: "", unite: "", cible2026: "", tauxAtteinte: "", commentaire: "" }] },
    { axe: "Activités prévues au PTA", indicateurs: [{ indicateur: "", unite: "", cible2026: "", tauxAtteinte: "", commentaire: "" }] },
    { axe: "Amélioration de la performance", indicateurs: [{ indicateur: "", unite: "", cible2026: "", tauxAtteinte: "", commentaire: "" }] },
  ]);
  const [module3Extra, setModule3Extra] = useState<ChampLibre[]>([]);

  const [axesCabinet, setAxesCabinet] = useState<AxeCabinet[]>([
    { axe: "Ressources humaines, financières et matérielles", instructions: [{ instructionDonnee: "", tachesExecutees: "", tauxExecution: "" }] },
    { axe: "Gouvernance", instructions: [{ instructionDonnee: "", tachesExecutees: "", tauxExecution: "" }] },
    { axe: "Activités prévues au PTA", instructions: [{ instructionDonnee: "", tachesExecutees: "", tauxExecution: "" }] },
    { axe: "Amélioration de la performance", instructions: [{ instructionDonnee: "", tachesExecutees: "", tauxExecution: "" }] },
  ]);
  const [module4Extra, setModule4Extra] = useState<ChampLibre[]>([]);

  // CHARGEMENT DES DONNÉES (INFO PERSO + BROUILLON SI EXISTE)
  useEffect(() => {
    const initForm = async () => {
      setFetchingInfo(true);
      try {
        // 1. Infos de base de l'entité
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const data = await meRes.json();
          setIdentification(prev => ({
            ...prev,
            nomEntite: data.nom || "",
            nomResponsable: data.responsableNom || "",
            coutGlobalProjet: data.coutGlobalProjet ? data.coutGlobalProjet.toString() : "",
            dateCloture: data.dateCloture ? data.dateCloture.split('T')[0] : "",
            localisation: data.localisation || "",
          }));
        }

        // 2. Chargement du brouillon si draftId est présent
        if (draftId) {
            const draftRes = await fetch(`/api/soumissions/${draftId}`);
            if (draftRes.ok) {
                const s = await draftRes.json();

                // M0
                setIdentification(p => ({
                    ...p,
                    dateNomination: s.entite.dateNominationResp?.split('T')[0] || "",
                    contactResponsable: s.entite.emailContactFallback || "",
                    montantBudget2026: s.entite.budget2026?.toString() || "",
                    dateCreation: s.entite.dateCreationEntite?.split('T')[0] || "",
                    dateDemarrageActivites: s.entite.dateDemarrage?.split('T')[0] || "",
                }));

                // M1 RH
                setRh({
                    effectifARecruter: s.effectifARecruter?.toString() || "",
                    effectifRecrute: s.effectifRecrute?.toString() || "",
                    departRetraite: s.departRetraite?.toString() || "",
                    demission: s.departDemission?.toString() || "",
                    licenciement: s.departLicenciement?.toString() || "",
                    finContrat: s.departFinContrat?.toString() || "",
                    tauxExecutionFormation: s.tauxExecutionPlanFormation?.toString() || "",
                    observations: JSON.parse(s.observationsJSON || "{}").rh || {}
                });

                // M1 FIN
                setFinancier({
                    budgetTotalAlloue: { ...emptyLigneFinanciere, montantCumule: s.budgetTotalAlloue?.toString() || "" },
                    tauxEngagement: { ...emptyLigneFinanciere, taux: s.tauxEngagement?.toString() || "" },
                    tauxOrdonnancement: { ...emptyLigneFinanciere, taux: s.tauxOrdonnancement?.toString() || "" },
                    tauxPaiement: { ...emptyLigneFinanciere, taux: s.tauxPaiement?.toString() || "" },
                    montantDettes: { ...emptyLigneFinanciere, montantPeriode: s.montantDettes?.toString() || "" },
                    ressourcesPropres: { ...emptyLigneFinanciere, montantCumule: s.ressourcesPropres?.toString() || "" },
                });

                if (s.financementsExterieurs?.length > 0) {
                    setBailleurs(s.financementsExterieurs.map((b:any) => ({
                        nom: b.bailleur,
                        tauxMobilise: b.tauxMobilise?.toString() || "",
                        montantMobilisePeriode: b.montantMobilisePeriode?.toString() || "",
                        montantMobiliseCumule: b.montantMobiliseCumule?.toString() || "",
                        tauxConsomme: b.tauxConsomme?.toString() || "",
                        montantConsommePeriode: b.montantConsommePeriode?.toString() || "",
                        montantConsommeCumule: b.montantConsommeCumule?.toString() || "",
                    })));
                }

                // M1 MARCHES
                if (s.marches?.length > 0) {
                    setMarchesEnCours(s.marches.filter((m:any) => m.phase === 'PASSATION_EN_COURS').map((m:any) => ({
                        libelle: m.libelle, etape: m.etape || "", modePassation: m.modePassation || "", montantPrevisionnel: m.montantPrevisionnel?.toString() || "", dateLancementOffre: m.dateLancementOffre?.split('T')[0] || "", observations: m.observations || ""
                    })));
                    setMarchesALancer(s.marches.filter((m:any) => m.phase === 'A_LANCER').map((m:any) => ({
                        libelle: m.libelle, modePassation: m.modePassation || "", montantPrevisionnel: m.montantPrevisionnel?.toString() || "", dateLancement: m.dateLancementOffre?.split('T')[0] || "", observations: m.observations || ""
                    })));
                    setMarchesExecution(s.marches.filter((m:any) => m.phase === 'EN_EXECUTION').map((m:any) => ({
                        libelle: m.libelle, dateOrdreService: m.dateOrdreService?.split('T')[0] || "", dateLivraisonPrevisionnelle: m.dateLivraisonPrevisionnelle?.split('T')[0] || "", tauxExecution: m.tauxExecution?.toString() || "", observations: m.observations || ""
                    })));
                }
                setStatistiquesMarches({
                    montantTotalMarchesPasses: s.montantTotalMarchesPasses?.toString() || "",
                    observationsMontantTotal: "",
                    tauxRealisationPPPM: s.tauxRealisationPPPM?.toString() || "",
                    observationsTauxPPPM: ""
                });

                // M2 PTA
                setPta(p => ({
                    ...p,
                    activitesRealisees: s.activitesPTARealisees ? "Oui" : "Non",
                    activitesClesTexte: s.activitesClesRealisees || "",
                    facteursBloquants: s.facteursBloquants || "",
                    observationsRealisees: JSON.parse(s.observationsJSON || "{}").pta || ""
                }));

                // M3 PERF
                if (s.indicateurs?.length > 0) {
                    const uniqueAxes = Array.from(new Set(s.indicateurs.map((i:any) => i.programmeAxe))) as string[];
                    setAxesPerformance(uniqueAxes.map(axe => ({
                        axe,
                        indicateurs: s.indicateurs.filter((i:any) => i.programmeAxe === axe).map((i:any) => ({
                            indicateur: i.indicateur, unite: i.unite, cible2026: i.cible?.toString() || "", tauxAtteinte: i.tauxAtteinte?.toString() || "", commentaire: i.commentaire || ""
                        }))
                    })));
                }

                // M4 CABINET
                if (s.instructions?.length > 0) {
                    const uniqueAxes = Array.from(new Set(s.instructions.map((i:any) => i.axe))) as string[];
                    setAxesCabinet(uniqueAxes.map(axe => ({
                        axe,
                        instructions: s.instructions.filter((i:any) => i.axe === axe).map((i:any) => ({
                            instructionDonnee: i.instructionsDonnees, tachesExecutees: i.tachesExecutees || "", tauxExecution: i.tauxExecution?.toString() || ""
                        }))
                    })));
                }
            }
        }
      } finally {
        setFetchingInfo(false);
      }
    };
    initForm();
  }, [draftId]);

  // TOUR INTERACTIF
  useEffect(() => {
    if (!fetchingInfo && activeModule === 0) {
        const hasSeenIdTour = localStorage.getItem('tutorial_id_seen');
        if (!hasSeenIdTour) {
            startIdentificationTour();
            localStorage.setItem('tutorial_id_seen', 'true');
        }
    }
  }, [fetchingInfo, activeModule]);

  const nextModule = () => setActiveModule((prev) => Math.min(prev + 1, 4));
  const prevModule = () => setActiveModule((prev) => Math.max(prev - 1, 0));

  const buildPayload = () => ({
    identification: { ...identification, champsAdditionnels: identificationExtra },
    module1: {
      ressourcesHumaines: rh,
      ressourcesFinancieres: financier,
      bailleurs,
      ressourcesMaterielles: materiel,
      gouvernance,
      marches: { enCoursPassation: marchesEnCours, aLancerSousHuitaine: marchesALancer, enCoursExecution: marchesExecution, statistiques: statistiquesMarches },
      champsAdditionnels: module1Extra,
    },
    module2: { ...pta, champsAdditionnels: module2Extra },
    module3: { axes: axesPerformance, champsAdditionnels: module3Extra },
    module4: { axes: axesCabinet, champsAdditionnels: module4Extra },
  });

  const handleAction = async (isDraft: boolean) => {
    if (!identification.nomEntite) {
      Swal.fire({ icon: "warning", title: "Identification requise", text: "Veuillez vérifier le nom de votre structure au Module 0.", confirmButtonColor: "#008751" });
      setActiveModule(0);
      return;
    }

    setSubmitting(true);
    const payload = buildPayload();
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    formData.append("isDraft", isDraft.toString());
    if (draftId) formData.append("draftId", draftId);

    // Fichiers
    if (materiel.nouvellesAcquisitions.fichier) formData.append("m1_acquisitions", materiel.nouvellesAcquisitions.fichier);
    if (materiel.prestationsImmaterielles.fichier) formData.append("m1_immaterielles", materiel.prestationsImmaterielles.fichier);
    if (gouvernance.comiteDirectionReuni.fichier) formData.append("m1_codir", gouvernance.comiteDirectionReuni.fichier);
    if (gouvernance.nouvellesConventions.fichier) formData.append("m1_conventions", gouvernance.nouvellesConventions.fichier);
    if (pta.activitesClesFichier) formData.append("m2_pta", pta.activitesClesFichier);

    try {
      const res = await fetch("/api/soumissions", { method: "POST", body: formData });
      if (res.ok) {
        await Swal.fire({ icon: "success", title: isDraft ? "Enregistré" : "Transmis", text: isDraft ? "Brouillon sauvegardé avec succès." : "Votre rapport est maintenant au Cabinet.", confirmButtonColor: "#008751" });
        router.push("/dashboard/soumissions");
      } else {
        const error = await res.json();
        throw new Error(error.error || "Échec");
      }
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Erreur", text: error.message, confirmButtonColor: "#d33" });
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchingInfo) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-benin-green" size={40} /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase tracking-tighter">
            {draftId ? "Continuer la Saisie" : "Outil de Suivi Hebdomadaire"}
          </h2>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
             {draftId ? "Reprise du brouillon en cours" : "Saisie des indicateurs de performance structurelle"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {draftId && <div className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[9px] font-black uppercase mr-2 shadow-sm border border-amber-200">Brouillon Actif</div>}
          <button
            id="btn-save-draft"
            onClick={() => handleAction(true)}
            disabled={submitting}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{draftId ? "Mettre à jour Brouillon" : "Enregistrer Brouillon"}</span>
          </button>
        </div>
      </div>

      {/* Stepper */}
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
          {activeModule === 0 && <ModuleIdentification data={identification} setData={setIdentification} extra={identificationExtra} setExtra={setIdentificationExtra} />}
          {activeModule === 1 && (
            <div className="space-y-6">
              <CollapsibleSection title="Section 1.1 — Ressources Humaines" defaultOpen={true}>
                <ModuleRH rh={rh} setRh={setRh} />
              </CollapsibleSection>
              <CollapsibleSection title="Section 1.2 — Ressources Financières">
                <ModuleFinancier financier={financier} setFinancier={setFinancier} bailleurs={bailleurs} setBailleurs={setBailleurs} />
              </CollapsibleSection>
              <CollapsibleSection title="Section 1.3 — Ressources Matérielles et Système d'Information">
                <ModuleMateriel materiel={materiel} setMateriel={setMateriel} />
              </CollapsibleSection>
              <CollapsibleSection title="Section 1.4 — Gouvernance et Coordination">
                <ModuleGouvernance gouvernance={gouvernance} setGouvernance={setGouvernance} />
              </CollapsibleSection>
              <CollapsibleSection title="Section 1.5 — Passation des marchés">
                <ModuleMarches
                  marchesEnCours={marchesEnCours} setMarchesEnCours={setMarchesEnCours}
                  marchesALancer={marchesALancer} setMarchesALancer={setMarchesALancer}
                  marchesExecution={marchesExecution} setMarchesExecution={setMarchesExecution}
                  statistiquesMarches={statistiquesMarches} setStatistiquesMarches={setStatistiquesMarches}
                />
              </CollapsibleSection>
              <ChampsAdditionnels extra={module1Extra} setExtra={setModule1Extra} />
            </div>
          )}
          {activeModule === 2 && <ModulePTA data={pta} setData={setPta} extra={module2Extra} setExtra={setModule2Extra} />}
          {activeModule === 3 && <ModulePerformance data={axesPerformance} setData={setAxesPerformance} extra={module3Extra} setExtra={setModule3Extra} />}
          {activeModule === 4 && <ModuleCabinet data={axesCabinet} setData={setAxesCabinet} extra={module4Extra} setExtra={setModule4Extra} />}
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
          <button onClick={prevModule} disabled={activeModule === 0} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 disabled:opacity-20 uppercase tracking-widest transition-all">
            <ChevronLeft size={16} /> <span>Précédent</span>
          </button>

          {activeModule < 4 ? (
            <button id="btn-next-module" onClick={nextModule} className="flex items-center gap-2 px-8 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all clickable-scale">
              <span>Suivant</span> <ChevronRight size={16} />
            </button>
          ) : (
            <button
                id="btn-submit-final"
                onClick={() => handleAction(false)}
                disabled={submitting}
                className="flex items-center gap-2 px-10 py-3 rounded-xl bg-benin-green text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-benin-green/20 clickable-scale disabled:opacity-50"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              <span>{submitting ? "Transmission..." : "Transmettre au Cabinet"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900/50 transition-all duration-300 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-grid-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-1.5 h-6 rounded-full", isOpen ? "bg-benin-green" : "bg-zinc-300 dark:bg-zinc-700")} />
          <span className="font-black text-xs uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      <div className={cn("p-6 pt-0 space-y-8", isOpen ? "block animate-fade-in" : "hidden")}>
        <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 mb-8" />
        {children}
      </div>
    </div>
  );
}

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

function TableInput({ value, onChange, placeholder, type = "text", disabled = false }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; }) {
  return (
    <div className="relative group">
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={cn("w-full bg-transparent outline-none text-xs font-medium py-1 transition-all", disabled && "text-zinc-400 cursor-not-allowed select-none")} />
      {disabled && <Lock size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );
}

function TableTextArea({ value, onChange, placeholder, rows = 2 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; }) {
  return <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-transparent outline-none text-xs font-medium resize-none py-1" />;
}

function TableOuiNon({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {["Oui", "Non"].map((opt) => (
        <button key={opt} onClick={() => onChange(opt)} className={cn("px-2.5 py-1 rounded-lg border text-[9px] font-black transition-all", value === opt ? "bg-benin-green text-white border-benin-green" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-benin-green")}>{opt}</button>
      ))}
    </div>
  );
}

function TableFileChip({ file, onChange, label }: { file: File | null; onChange: (f: File | null) => void; label: string }) {
  return (
    <label className="mt-1 flex items-center gap-1.5 cursor-pointer text-zinc-400 hover:text-benin-green transition-all w-fit">
      {file ? <Paperclip size={12} /> : <Upload size={12} />}
      <span className="text-[9px] font-black uppercase truncate max-w-[120px]">{file ? file.name : label}</span>
      <input type="file" className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </label>
  );
}

function ChampsAdditionnels({ extra, setExtra }: { extra: ChampLibre[]; setExtra: React.Dispatch<React.SetStateAction<ChampLibre[]>>; }) {
  const update = (i: number, key: keyof ChampLibre, value: string) => setExtra((prev) => prev.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const add = () => setExtra((prev) => [...prev, { label: "", valeur: "" }]);
  const remove = (i: number) => setExtra((prev) => prev.filter((_, idx) => idx !== i));
  return (
    <div className="mt-6 p-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 space-y-3">
      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Champs additionnels libres (facultatif)</p>
      {extra.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={item.label} onChange={(e) => update(i, "label", e.target.value)} placeholder="Nom du champ" className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-[10px] outline-none" />
          <input value={item.valeur} onChange={(e) => update(i, "valeur", e.target.value)} placeholder="Valeur / réponse" className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-[10px] outline-none" />
          <button onClick={() => remove(i)} className="text-zinc-300 hover:text-red-500"><Trash2 size={14} /></button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1 text-[9px] font-black text-benin-green uppercase"><Plus size={12} /> Ajouter un champ</button>
    </div>
  );
}

// --- MODULE 0 ---
function ModuleIdentification({ data, setData, extra, setExtra }: { data: any; setData: (u: any) => void; extra: ChampLibre[]; setExtra: React.Dispatch<React.SetStateAction<ChampLibre[]>>; }) {
  const set = (key: string, value: string) => setData((prev: any) => ({ ...prev, [key]: value }));
  const setComment = (key: string, value: string) => setData((prev: any) => ({ ...prev, commentaires: { ...prev.commentaires, [key]: value } }));
  return (
    <div className="space-y-10" id="module-0-content">
      <section>
        <SectionHeader title="Module 0 : Identification et Informations Générales" subtitle="Vérifiez ces données stratégiques. Elles impactent les calculs du Cabinet." />
        <DataTable headers={["N°", "Éléments", "Données", "Commentaires"]}>
          <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">1.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Nom de l'entité</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={data.nomEntite} onChange={(v) => set("nomEntite", v)} /></td><td className="p-3"><TableInput value={data.commentaires.nomEntite} onChange={(v) => setComment("nomEntite", v)} /></td></tr>
          <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">2.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Localisation</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={data.localisation} onChange={(v) => set("localisation", v)} /></td><td className="p-3"><TableInput value={data.commentaires.localisation} onChange={(v) => setComment("localisation", v)} /></td></tr>
          <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">3.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Nom et Prénoms du Responsable</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={data.nomResponsable} onChange={(v) => set("nomResponsable", v)} /></td><td className="p-3"><TableInput value={data.commentaires.nomResponsable} onChange={(v) => setComment("nomResponsable", v)} /></td></tr>
          <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">4.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Date de nomination</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput type="date" value={data.dateNomination} onChange={(v) => set("dateNomination", v)} /></td><td className="p-3"><TableInput value={data.commentaires.dateNomination} onChange={(v) => setComment("dateNomination", v)} /></td></tr>
          <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">5.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Contact (Tél/Email)</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={data.contactResponsable} onChange={(v) => set("contactResponsable", v)} /></td><td className="p-3"><TableInput value={data.commentaires.contactResponsable} onChange={(v) => setComment("contactResponsable", v)} /></td></tr>
          <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">6.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Coût global projet (FCFA)</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={data.coutGlobalProjet} onChange={(v) => set("coutGlobalProjet", v)} /></td><td className="p-3"><TableInput value={data.commentaires.coutGlobalProjet} onChange={(v) => setComment("coutGlobalProjet", v)} /></td></tr>
          <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">7.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Budget 2026 (FCFA)</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput type="number" value={data.montantBudget2026} onChange={(v) => set("montantBudget2026", v)} /></td><td className="p-3"><TableInput value={data.commentaires.montantBudget2026} onChange={(v) => setComment("montantBudget2026", v)} /></td></tr>
          <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">8.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Démarrage activité</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput type="date" value={data.dateDemarrageActivites} onChange={(v) => set("dateDemarrageActivites", v)} /></td><td className="p-3"><TableInput value={data.commentaires.dateDemarrageActivites} onChange={(v) => setComment("dateDemarrageActivites", v)} /></td></tr>
          <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">9.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Clôture prévue</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput type="date" value={data.dateCloture} onChange={(v) => set("dateCloture", v)} /></td><td className="p-3"><TableInput value={data.commentaires.dateCloture} onChange={(v) => setComment("dateCloture", v)} /></td></tr>
        </DataTable>
        <ChampsAdditionnels extra={extra} setExtra={setExtra} />
      </section>
    </div>
  );
}

function ModuleRH({ rh, setRh }: { rh: any; setRh: (u: any) => void }) {
  const setRhField = (key: string, value: string) => setRh((prev: any) => ({ ...prev, [key]: value }));
  const setRhObs = (key: string, value: string) => setRh((prev: any) => ({ ...prev, observations: { ...prev.observations, [key]: value } }));
  return (
    <DataTable headers={["N°", "Donnée à collecter", "Réponse", "Observations"]}>
      <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">1.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Effectif à recruter</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput type="number" value={rh.effectifARecruter} onChange={(v) => setRhField("effectifARecruter", v)} /></td><td className="p-3"><TableInput value={rh.observations.effectifARecruter} onChange={(v) => setRhObs("effectifARecruter", v)} /></td></tr>
      <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">2.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Effectif recruté (Semaine)</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput type="number" value={rh.effectifRecrute} onChange={(v) => setRhField("effectifRecrute", v)} /></td><td className="p-3"><TableInput value={rh.observations.effectifRecrute} onChange={(v) => setRhObs("effectifRecrute", v)} /></td></tr>
      <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">3.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Departs</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><div className="space-y-1"><TableInput type="number" value={rh.departRetraite} onChange={(v) => setRhField("departRetraite", v)} placeholder="Retraite" /><TableInput type="number" value={rh.demission} onChange={(v) => setRhField("demission", v)} placeholder="Démission" /></div></td><td className="p-3"><TableInput value={rh.observations.departs} onChange={(v) => setRhObs("departs", v)} /></td></tr>
    </DataTable>
  );
}

function ModuleFinancier({ financier, setFinancier, bailleurs, setBailleurs }: { financier: any; setFinancier: (u: any) => void; bailleurs: Bailleur[]; setBailleurs: React.Dispatch<React.SetStateAction<Bailleur[]>>; }) {
  const setFinLigne = (k: string, f: keyof LigneFinanciere, v: string) => setFinancier((p: any) => ({ ...p, [k]: { ...p[k], [f]: v } }));
  const updateBailleur = (i: number, key: keyof Bailleur, value: string) => setBailleurs((prev) => prev.map((b, idx) => (idx === i ? { ...b, [key]: value } : b)));
  return (
    <div className="space-y-10">
      <DataTable headers={["N°", "Exécution Budgétaire", "Taux %", "Montant Période", "Montant Cumulé"]}>
        <LigneFinanciereRow n="1." label="Taux Engagement" data={financier.tauxEngagement} onChange={(f, v) => setFinLigne("tauxEngagement", f, v)} />
        <LigneFinanciereRow n="2." label="Taux Ordonnancement" data={financier.tauxOrdonnancement} onChange={(f, v) => setFinLigne("tauxOrdonnancement", f, v)} />
        <LigneFinanciereRow n="3." label="Taux Paiement" data={financier.tauxPaiement} onChange={(f, v) => setFinLigne("tauxPaiement", f, v)} />
      </DataTable>
      <div className="space-y-4">
          <SectionHeader title="Bailleurs de Fonds" />
          <DataTable headers={["Nom", "Taux Mob.", "Montant Mob.", "Taux Conso.", "Montant Conso.", ""]}>
            {bailleurs.map((b, i) => (
                <tr key={i}>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={b.nom} onChange={v => updateBailleur(i, "nom", v)} /></td>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={b.tauxMobilise} onChange={v => updateBailleur(i, "tauxMobilise", v)} /></td>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={b.montantMobiliseCumule} onChange={v => updateBailleur(i, "montantMobiliseCumule", v)} /></td>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={b.tauxConsomme} onChange={v => updateBailleur(i, "tauxConsomme", v)} /></td>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={b.montantConsommeCumule} onChange={v => updateBailleur(i, "montantConsommeCumule", v)} /></td>
                    <td className="p-2"><button onClick={() => setBailleurs(p => p.filter((_, idx) => idx !== i))} className="text-zinc-300 hover:text-red-500"><Trash2 size={12} /></button></td>
                </tr>
            ))}
          </DataTable>
          <button onClick={() => setBailleurs(p => [...p, { nom: "", tauxMobilise: "", montantMobilisePeriode: "", montantMobiliseCumule: "", tauxConsomme: "", montantConsommePeriode: "", montantConsommeCumule: "" }])} className="text-[9px] font-black text-benin-green uppercase flex items-center gap-1"><Plus size={12}/> Ajouter Bailleur</button>
      </div>
    </div>
  );
}

function LigneFinanciereRow({ n, label, data, onChange }: { n: string; label: string; data: LigneFinanciere; onChange: (field: keyof LigneFinanciere, value: string) => void }) {
  return (
    <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">{n}</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">{label}</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={data.taux} onChange={v => onChange("taux", v)} /></td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={data.montantPeriode} onChange={v => onChange("montantPeriode", v)} /></td><td className="p-3"><TableInput value={data.montantCumule} onChange={v => onChange("montantCumule", v)} /></td></tr>
  );
}

function ModuleMateriel({ materiel, setMateriel }: { materiel: any; setMateriel: (u: any) => void }) {
  const setField = (k: string, f: string, v: any) => setMateriel((p: any) => ({ ...p, [k]: { ...p[k], [f]: v } }));
  return (
    <DataTable headers={["N°", "Matériel & SI", "Réponse", "Observations"]}>
      <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">1.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Acquisitions de matières</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableOuiNon value={materiel.nouvellesAcquisitions.reponse} onChange={v => setField("nouvellesAcquisitions", "reponse", v)} /></td><td className="p-3"><TableTextArea value={materiel.nouvellesAcquisitions.observations} onChange={v => setField("nouvellesAcquisitions", "observations", v)} /><TableFileChip file={materiel.nouvellesAcquisitions.fichier} onChange={f => setField("nouvellesAcquisitions", "fichier", f)} label="PV" /></td></tr>
      <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">2.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">SI Fonctionnels</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableOuiNon value={materiel.systemesInfoFonctionnels.reponse} onChange={v => setField("systemesInfoFonctionnels", "reponse", v)} /></td><td className="p-3"><TableInput value={materiel.systemesInfoFonctionnels.observations} onChange={v => setField("systemesInfoFonctionnels", "observations", v)} /></td></tr>
    </DataTable>
  );
}

function ModuleGouvernance({ gouvernance, setGouvernance }: { gouvernance: any; setGouvernance: (u: any) => void }) {
  const setField = (k: string, f: string, v: any) => setGouvernance((p: any) => ({ ...p, [k]: { ...p[k], [f]: v } }));
  return (
    <DataTable headers={["N°", "Gouvernance", "Réponse", "Précisions", "Obs"]}>
      <tr><td className="p-3 font-black text-zinc-400 border-r border-zinc-200 dark:border-zinc-800 w-10">1.</td><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">CODIR réunit</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableOuiNon value={gouvernance.comiteDirectionReuni.reponse} onChange={v => setField("comiteDirectionReuni", "reponse", v)} /></td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={gouvernance.comiteDirectionReuni.precisions} onChange={v => setField("comiteDirectionReuni", "precisions", v)} /></td><td className="p-3"><TableFileChip file={gouvernance.comiteDirectionReuni.fichier} onChange={f => setField("comiteDirectionReuni", "fichier", f)} label="PV" /></td></tr>
    </DataTable>
  );
}

function ModuleMarches({ marchesEnCours, setMarchesEnCours, marchesALancer, setMarchesALancer, marchesExecution, setMarchesExecution, statistiquesMarches, setStatistiquesMarches }: { marchesEnCours: MarcheEnCours[]; setMarchesEnCours: any; marchesALancer: MarcheALancer[]; setMarchesALancer: any; marchesExecution: MarcheExecution[]; setMarchesExecution: any; statistiquesMarches: any; setStatistiquesMarches: any; }) {
  return (
    <div className="space-y-10">
        <DataTable headers={["Marché (Passation)", "Étape", "Mode", "Montant Previs.", "Lancement", ""]}>
            {marchesEnCours.map((r, i) => (
                <tr key={i}>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={r.libelle} onChange={v => setMarchesEnCours((p:any) => p.map((it:any, idx:any) => idx === i ? {...it, libelle: v} : it))} /></td>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={r.etape} onChange={v => setMarchesEnCours((p:any) => p.map((it:any, idx:any) => idx === i ? {...it, etape: v} : it))} /></td>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={r.modePassation} onChange={v => setMarchesEnCours((p:any) => p.map((it:any, idx:any) => idx === i ? {...it, modePassation: v} : it))} /></td>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={r.montantPrevisionnel} onChange={v => setMarchesEnCours((p:any) => p.map((it:any, idx:any) => idx === i ? {...it, montantPrevisionnel: v} : it))} /></td>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput type="date" value={r.dateLancementOffre} onChange={v => setMarchesEnCours((p:any) => p.map((it:any, idx:any) => idx === i ? {...it, dateLancementOffre: v} : it))} /></td>
                    <td className="p-2"><button onClick={() => setMarchesEnCours((p:any) => p.filter((_:any, idx:any) => idx !== i))} className="text-zinc-300 hover:text-red-500"><Trash2 size={12}/></button></td>
                </tr>
            ))}
        </DataTable>
        <button onClick={() => setMarchesEnCours((p:any) => [...p, { libelle: "", etape: "", modePassation: "", montantPrevisionnel: "", dateLancementOffre: "", observations: "" }])} className="text-[9px] font-black text-benin-green uppercase flex items-center gap-1"><Plus size={12}/> Ajouter Marché</button>

        <DataTable headers={["Marché (Exécution)", "Ordre Service", "Livraison", "Taux %", ""]}>
            {marchesExecution.map((r, i) => (
                <tr key={i}>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={r.libelle} onChange={v => setMarchesExecution((p:any) => p.map((it:any, idx:any) => idx === i ? {...it, libelle: v} : it))} /></td>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput type="date" value={r.dateOrdreService} onChange={v => setMarchesExecution((p:any) => p.map((it:any, idx:any) => idx === i ? {...it, dateOrdreService: v} : it))} /></td>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput type="date" value={r.dateLivraisonPrevisionnelle} onChange={v => setMarchesExecution((p:any) => p.map((it:any, idx:any) => idx === i ? {...it, dateLivraisonPrevisionnelle: v} : it))} /></td>
                    <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={r.tauxExecution} onChange={v => setMarchesExecution((p:any) => p.map((it:any, idx:any) => idx === i ? {...it, tauxExecution: v} : it))} /></td>
                    <td className="p-2"><button onClick={() => setMarchesExecution((p:any) => p.filter((_:any, idx:any) => idx !== i))} className="text-zinc-300 hover:text-red-500"><Trash2 size={12}/></button></td>
                </tr>
            ))}
        </DataTable>
        <button onClick={() => setMarchesExecution((p:any) => [...p, { libelle: "", dateOrdreService: "", dateLivraisonPrevisionnelle: "", tauxExecution: "", observations: "" }])} className="text-[9px] font-black text-benin-green uppercase flex items-center gap-1"><Plus size={12}/> Ajouter Marché</button>

        <div className="mt-8 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700 grid grid-cols-2 gap-6">
            <div className="space-y-1">
                <label className="text-[8px] font-black text-zinc-400 uppercase">Montant total marchés passés</label>
                <TableInput value={statistiquesMarches.montantTotalMarchesPasses} onChange={v => setStatistiquesMarches({...statistiquesMarches, montantTotalMarchesPasses: v})} />
            </div>
            <div className="space-y-1">
                <label className="text-[8px] font-black text-zinc-400 uppercase">Taux réalisation PPPM (%)</label>
                <TableInput value={statistiquesMarches.tauxRealisationPPPM} onChange={v => setStatistiquesMarches({...statistiquesMarches, tauxRealisationPPPM: v})} />
            </div>
        </div>
    </div>
  );
}

function ModulePTA({ data, setData, extra, setExtra }: { data: any; setData: (u: any) => void; extra: ChampLibre[]; setExtra: React.Dispatch<React.SetStateAction<ChampLibre[]>> }) {
  const set = (key: string, value: any) => setData((prev: any) => ({ ...prev, [key]: value }));
  return (
    <div className="space-y-10">
        <DataTable headers={["Objectif", "Réponse / Valeur", "Observations"]}>
          <tr><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Activités PTA réalisées ?</td><td className="p-3 border-r border-zinc-200 dark:border-zinc-800"><TableOuiNon value={data.activitesRealisees} onChange={v => set("activitesRealisees", v)} /></td><td className="p-3"><TableInput value={data.observationsRealisees} onChange={v => set("observationsRealisees", v)} /></td></tr>
          <tr><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Activités clés de la semaine</td><td className="p-3" colSpan={2}><TableTextArea value={data.activitesClesTexte} onChange={v => set("activitesClesTexte", v)} /><TableFileChip file={data.activitesClesFichier} onChange={f => set("activitesClesFichier", f)} label="Rapport" /></td></tr>
          <tr><td className="p-3 font-bold border-r border-zinc-200 dark:border-zinc-800">Facteurs bloquants</td><td className="p-3" colSpan={2}><TableTextArea value={data.facteursBloquants} onChange={v => set("facteursBloquants", v)} /></td></tr>
        </DataTable>
        <ChampsAdditionnels extra={extra} setExtra={setExtra} />
    </div>
  );
}

function ModulePerformance({ data, setData, extra, setExtra }: { data: AxePerformance[]; setData: React.Dispatch<React.SetStateAction<AxePerformance[]>>; extra: ChampLibre[]; setExtra: React.Dispatch<React.SetStateAction<ChampLibre[]>> }) {
  const updateIndicateur = (axeIdx: number, indIdx: number, key: keyof IndicateurPerformance, value: string) => setData((prev) => prev.map((axe, ai) => ai === axeIdx ? { ...axe, indicateurs: axe.indicateurs.map((ind, ii) => (ii === indIdx ? { ...ind, [key]: value } : ind)) } : axe));
  const addIndicateur = (axeIdx: number) => setData((prev) => prev.map((axe, ai) => ai === axeIdx ? { ...axe, indicateurs: [...axe.indicateurs, { indicateur: "", unite: "", cible2026: "", tauxAtteinte: "", commentaire: "" }] } : axe));
  const removeIndicateur = (axeIdx: number, indIdx: number) => setData((prev) => prev.map((axe, ai) => ai === axeIdx ? { ...axe, indicateurs: axe.indicateurs.filter((_, ii) => ii !== indIdx) } : axe));
  return (
    <div className="space-y-8">
      {data.map((axe, ai) => (
          <div key={ai} className="space-y-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl font-black text-[10px] uppercase text-zinc-500 border border-zinc-100 dark:border-zinc-700">{axe.axe}</div>
              <DataTable headers={["Indicateur", "Unité", "Cible 2026", "Atteinte %", "Commentaire", ""]}>
                {axe.indicateurs.map((ind, ii) => (
                    <tr key={ii}>
                        <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={ind.indicateur} onChange={v => updateIndicateur(ai, ii, "indicateur", v)} /></td>
                        <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={ind.unite} onChange={v => updateIndicateur(ai, ii, "unite", v)} /></td>
                        <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={ind.cible2026} onChange={v => updateIndicateur(ai, ii, "cible2026", v)} /></td>
                        <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={ind.tauxAtteinte} onChange={v => updateIndicateur(ai, ii, "tauxAtteinte", v)} /></td>
                        <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={ind.commentaire} onChange={v => updateIndicateur(ai, ii, "commentaire", v)} /></td>
                        <td className="p-2">{axe.indicateurs.length > 1 && <button onClick={() => removeIndicateur(ai, ii)} className="text-zinc-300 hover:text-red-500"><Trash2 size={12}/></button>}</td>
                    </tr>
                ))}
              </DataTable>
              <button onClick={() => addIndicateur(ai)} className="text-[9px] font-black text-benin-green uppercase flex items-center gap-1"><Plus size={12}/> Ajouter indicateur</button>
          </div>
      ))}
      <ChampsAdditionnels extra={extra} setExtra={setExtra} />
    </div>
  );
}

function ModuleCabinet({ data, setData, extra, setExtra }: { data: AxeCabinet[]; setData: React.Dispatch<React.SetStateAction<AxeCabinet[]>>; extra: ChampLibre[]; setExtra: React.Dispatch<React.SetStateAction<ChampLibre[]>> }) {
  const updateInstruction = (axeIdx: number, instrIdx: number, key: keyof InstructionCabinet, value: string) => setData((prev) => prev.map((axe, ai) => ai === axeIdx ? { ...axe, instructions: axe.instructions.map((instr, ii) => (ii === instrIdx ? { ...instr, [key]: value } : instr)) } : axe));
  const addInstruction = (axeIdx: number) => setData((prev) => prev.map((axe, ai) => ai === axeIdx ? { ...axe, instructions: [...axe.instructions, { instructionDonnee: "", tachesExecutees: "", tauxExecution: "" }] } : axe));
  const removeInstruction = (axeIdx: number, instrIdx: number) => setData((prev) => prev.map((axe, ai) => ai === axeIdx ? { ...axe, instructions: axe.instructions.filter((_, ii) => ii !== instrIdx) } : axe));
  return (
    <div className="space-y-8">
      {data.map((axe, ai) => (
          <div key={ai} className="space-y-4">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl font-black text-[10px] uppercase text-zinc-500 border border-zinc-100 dark:border-zinc-700">{axe.axe}</div>
              <DataTable headers={["Instructions données", "Tâches exécutées", "Taux %", ""]}>
                {axe.instructions.map((instr, ii) => (
                    <tr key={ii}>
                        <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableTextArea value={instr.instructionDonnee} onChange={v => updateInstruction(ai, ii, "instructionDonnee", v)} /></td>
                        <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableTextArea value={instr.tachesExecutees} onChange={v => updateInstruction(ai, ii, "tachesExecutees", v)} /></td>
                        <td className="p-2 border-r border-zinc-200 dark:border-zinc-800"><TableInput value={instr.tauxExecution} onChange={v => updateInstruction(ai, ii, "tauxExecution", v)} /></td>
                        <td className="p-2">{axe.instructions.length > 1 && <button onClick={() => removeInstruction(ai, ii)} className="text-zinc-300 hover:text-red-500"><Trash2 size={12}/></button>}</td>
                    </tr>
                ))}
              </DataTable>
              <button onClick={() => addInstruction(ai)} className="text-[9px] font-black text-benin-green uppercase flex items-center gap-1"><Plus size={12}/> Ajouter suivi</button>
          </div>
      ))}
      <ChampsAdditionnels extra={extra} setExtra={setExtra} />
    </div>
  );
}

export default function NewSubmissionPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"><Loader2 className="animate-spin text-benin-green" size={40} /></div>}>
            <SubmissionForm />
        </Suspense>
    );
}
