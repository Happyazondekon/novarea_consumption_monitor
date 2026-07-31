import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  User,
  Info,
  Users,
  Target,
  BarChart4,
  ShieldCheck,
  Paperclip,
  Download,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function SubmissionDetailsPage({ params }: { params: { id: string, submissionId: string } }) {
  const submission = await prisma.soumissionHebdomadaire.findUnique({
    where: { id: params.submissionId },
    include: {
      entite: true,
      soumisPar: true,
      indicateurs: true,
      instructions: true,
      marches: true,
      financementsExterieurs: true,
      piecesJointes: true
    }
  });

  if (!submission) notFound();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <Link
        href={`/dashboard/projets/${params.id}`}
        className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-benin-green transition-colors w-fit"
      >
        <ChevronLeft size={14} />
        <span>Retour au projet</span>
      </Link>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 rounded-lg bg-benin-green/10 text-benin-green text-[10px] font-black uppercase tracking-widest">Consultation Rapport</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Semaine du {submission.semaineDu.toLocaleDateString('fr-FR')}</span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter leading-tight">
              {submission.entite.nom}
            </h2>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {/* MODULE 1.2 : FINANCES */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm space-y-8">
          <SectionTitle icon={TrendingUp} title="Module 1.2 : Ressources Financières" />
          <DataTable headers={["Axe", "Taux / Montant"]}>
            <DataRow label="Taux d'Engagement" value={`${Number(submission.tauxEngagement || 0)}%`} />
            <DataRow label="Taux d'Ordonnancement" value={`${Number(submission.tauxOrdonnancement || 0)}%`} />
            <DataRow label="Taux de Paiement" value={`${Number(submission.tauxPaiement || 0)}%`} />
          </DataTable>
        </section>

        {/* MODULE 4 : INSTRUCTIONS */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-sm space-y-6">
          <SectionTitle icon={ShieldCheck} title="Module 4 : Suivi des Instructions" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {submission.instructions.map((inst, i) => (
              <div key={i} className="p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 space-y-4">
                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500 border border-red-100 dark:border-red-500/20">{inst.axe}</span>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 italic">"{inst.instructionsDonnees}"</p>
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">État de réalisation</p>
                  <p className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 leading-normal">{inst.tachesExecutees}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-zinc-400 uppercase">Taux d'exécution</span>
                  <span className="text-xs font-black text-benin-green">{Number(inst.tauxExecution)}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: any, title: string }) {
  return (
    <div className="flex items-center gap-3 border-l-4 border-benin-yellow pl-4">
      <Icon size={20} className="text-benin-green" />
      <h3 className="font-black text-sm uppercase tracking-tight">{title}</h3>
    </div>
  );
}

function DataTable({ headers, children }: { headers: string[], children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100 dark:border-zinc-800">
      <table className="w-full text-left text-[10px] border-collapse">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-800/50 uppercase font-black text-zinc-400">
            {headers.map((h, i) => <th key={i} className="p-4">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</tbody>
      </table>
    </div>
  );
}

function DataRow({ label, value }: { label: string, value: string }) {
  return (
    <tr>
      <td className="p-4 font-bold text-zinc-500 uppercase w-1/3">{label}</td>
      <td className="p-4 font-black text-zinc-900 dark:text-zinc-100 uppercase">{value}</td>
    </tr>
  );
}
