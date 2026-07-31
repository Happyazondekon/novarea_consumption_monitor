import { prisma } from "@/lib/prisma";
import { FileText, Plus, ArrowUpRight, Clock, Calendar, Filter, Layers, Pencil } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { DeleteSubmissionBtn } from "@/components/DeleteSubmissionBtn";

export default async function SoumissionsPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const session = await auth();
  const user = session?.user as any;
  const entiteId = user?.entiteId;
  const userRole = user?.role;
  const isAdmin = userRole === 'ADMINISTRATEUR' || userRole === 'MINISTRE';

  const filter = searchParams.filter || "all";

  let whereClause: any = {};
  if (userRole === 'RESPONSABLE') {
    whereClause.entiteId = entiteId;
  }

  if (filter === "current_week") {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    whereClause.semaineDu = { gte: startOfWeek };
  }

  const soumissions = await prisma.soumissionHebdomadaire.findMany({
    where: whereClause,
    include: { entite: true },
    orderBy: { dateSoumission: 'desc' },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase tracking-tighter">Journal des Transmissions</h2>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest mt-1">
             {filter === 'current_week' ? "Focus : Rapports de la semaine en cours" : "Historique chronologique complet"}
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl">
                <Link
                    href="/dashboard/soumissions?filter=all"
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        filter === 'all' ? "bg-zinc-900 text-white shadow-md" : "text-zinc-400 hover:text-zinc-600"
                    )}
                >Tout</Link>
                <Link
                    href="/dashboard/soumissions?filter=current_week"
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        filter === 'current_week' ? "bg-benin-green text-white shadow-md" : "text-zinc-400 hover:text-zinc-600"
                    )}
                >Cette Semaine</Link>
            </div>

            {userRole === 'RESPONSABLE' && (
                <Link href="/dashboard/soumissions/nouvelle" className="btn-success">
                    <Plus size={16} /> <span>Nouvelle</span>
                </Link>
            )}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <th className="p-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Entité</th>
                <th className="p-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Date & Heure de Soumission</th>
                <th className="p-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Statut</th>
                <th className="p-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Engagement %</th>
                <th className="p-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {soumissions.length > 0 ? (
                soumissions.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors group">
                    <td className="p-6">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">{s.entite.nom}</p>
                    </td>
                    <td className="p-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-black text-[11px] uppercase tracking-tighter">
                                <Calendar size={12} className="text-benin-green" />
                                <span>{new Date(s.dateSoumission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-[9px]">
                                <Clock size={11} />
                                <span>à {new Date(s.dateSoumission).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </td>
                    <td className="p-6 text-center">
                        <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border",
                            s.statut === 'BROUILLON'
                                ? "bg-amber-50 text-amber-600 border-amber-100"
                                : "bg-benin-green/5 text-benin-green border-benin-green/10"
                        )}>
                            {s.statut}
                        </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100">{Number(s.tauxEngagement || 0)}%</span>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.statut === 'BROUILLON' && userRole === 'RESPONSABLE' ? (
                            <Link
                                href={`/dashboard/soumissions/nouvelle?draftId=${s.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[9px] font-black uppercase hover:bg-amber-600 transition-all shadow-md active:scale-95"
                            >
                                <Pencil size={12} />
                                <span>Continuer</span>
                            </Link>
                        ) : (
                            <Link
                                href={`/dashboard/soumissions/${s.id}`}
                                className="inline-flex p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-benin-green hover:border-benin-green/30 transition-all"
                            >
                                <ArrowUpRight size={14} />
                            </Link>
                        )}
                        {(isAdmin || (s.statut === 'BROUILLON' && userRole === 'RESPONSABLE')) && (
                            <DeleteSubmissionBtn id={s.id} entiteName={s.entite.nom} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-zinc-300 uppercase text-[10px] font-black tracking-widest">Aucun rapport trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
