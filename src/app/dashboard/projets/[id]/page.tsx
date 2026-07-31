import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import {
    Building2,
    Briefcase,
    Calendar,
    MapPin,
    User,
    Mail,
    ChevronLeft,
    TrendingUp,
    CreditCard,
    FileText,
    ArrowUpRight,
    Trash2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { DeleteSubmissionBtn } from "@/components/DeleteSubmissionBtn";

export default async function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");
  const isAdmin = (session.user as any)?.role === 'ADMINISTRATEUR' || (session.user as any)?.role === 'MINISTRE';

  const entite = await prisma.entite.findUnique({
    where: { id: params.id },
    include: {
      agenceTutelle: true,
      projetsRattaches: true,
      soumissions: {
        where: { statut: "SOUMIS" },
        orderBy: { dateSoumission: 'desc' },
      },
      _count: {
        select: { soumissions: true }
      }
    }
  });

  if (!entite) notFound();

  const lastSub = entite.soumissions[0];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/projets" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors w-fit">
            <ChevronLeft size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Retour au répertoire</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-xl md:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter uppercase leading-tight">
                {entite.nom}
            </h1>
            <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest w-fit",
                entite.statut === 'EN_COURS' ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-500"
            )}>
                {entite.statut}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Colonne de gauche : Infos */}
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-8 shadow-sm">
                <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Building2 size={16} className="text-benin-green" /> Fiche d'Identité
                </h3>
                <div className="space-y-4 md:space-y-6">
                    <InfoRow icon={MapPin} label="Localisation" value={entite.localisation || "—"} />
                    <InfoRow icon={Briefcase} label="Secteur" value={entite.secteur || "—"} />
                    {entite.agenceTutelle && (
                        <InfoRow icon={Building2} label="Tutelle" value={entite.agenceTutelle.nom} isLink href={`/dashboard/projets/${entite.agenceTutelle.id}`} />
                    )}
                    <InfoRow icon={User} label="Responsable" value={entite.responsableNom || "Non désigné"} />
                    <InfoRow icon={Mail} label="Contact" value={entite.emailContactFallback || "—"} />
                    <InfoRow icon={Calendar} label="Démarrage" value={entite.dateDemarrage ? new Date(entite.dateDemarrage).toLocaleDateString('fr-FR') : "—"} />
                    <InfoRow icon={Calendar} label="Clôture prévue" value={entite.dateCloture ? new Date(entite.dateCloture).toLocaleDateString('fr-FR') : "—"} />
                </div>
            </div>

            {/* Statistiques rapides */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 md:p-8 text-white shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-zinc-500 uppercase">Coût Global</p>
                        <p className="text-sm font-black text-white">
                            {entite.coutGlobalProjet ? `${(Number(entite.coutGlobalProjet) / 1e9).toFixed(1)} Md` : '—'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-black text-zinc-500 uppercase">Budget 2026</p>
                        <p className="text-sm font-black text-white">
                            {entite.budget2026 ? `${(Number(entite.budget2026) / 1e6).toFixed(0)} M` : '—'}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Colonne de droite : Performance et Projets rattachés */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
            {/* KPIs de performance actuelle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SmallKpi icon={TrendingUp} label="Engagement" value={lastSub?.tauxEngagement ? `${lastSub.tauxEngagement}%` : "—"} color="indigo" />
                <SmallKpi icon={CreditCard} label="Paiement" value={lastSub?.tauxPaiement ? `${lastSub.tauxPaiement}%` : "—"} color="emerald" />
                <SmallKpi icon={FileText} label="Rapports" value={`${entite._count.soumissions}`} color="amber" />
            </div>

            {/* Projets sous tutelle (si c'est une agence) */}
            {entite.type === 'AGENCE' && entite.projetsRattaches.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                    <h3 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Briefcase size={16} className="text-benin-green" /> Portefeuille de Projets ({entite.projetsRattaches.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {entite.projetsRattaches.map(p => (
                            <Link key={p.id} href={`/dashboard/projets/${p.id}`} className="p-4 rounded-2xl border border-zinc-50 dark:border-zinc-800 hover:border-benin-green/30 transition-all flex items-center justify-between group">
                                <span className="text-[11px] font-black uppercase text-zinc-700 dark:text-zinc-300 truncate">{p.nom}</span>
                                <ArrowUpRight size={14} className="text-zinc-300 group-hover:text-benin-green" />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Historique récent */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                <h3 className="font-black text-xs uppercase tracking-widest mb-6">Historique des transmissions</h3>
                {entite.soumissions.length > 0 ? (
                    <div className="space-y-4">
                        {entite.soumissions.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl group/item">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase">Semaine du {new Date(s.semaineDu).toLocaleDateString()}</p>
                                    <p className="text-[9px] text-zinc-400 font-bold uppercase">Soumis le {new Date(s.dateSoumission).toLocaleDateString()} à {new Date(s.dateSoumission).toLocaleTimeString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-benin-green">{Number(s.tauxEngagement)}% Eng.</p>
                                    </div>
                                    <Link
                                        href={`/dashboard/soumissions/${s.id}`}
                                        className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-benin-green transition-all"
                                    >
                                        <ArrowUpRight size={14} />
                                    </Link>
                                    {isAdmin && <DeleteSubmissionBtn id={s.id} entiteName={entite.nom} />}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center text-zinc-400 text-[10px] font-black uppercase">Aucune soumission conforme</div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, isLink, href }: { icon: any, label: string, value: string, isLink?: boolean, href?: string }) {
    const content = (
        <div className="flex items-start gap-3 group">
            <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-400 group-hover:text-benin-green transition-colors">
                <Icon size={14} />
            </div>
            <div className="min-w-0">
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 break-words leading-tight">{value}</p>
            </div>
        </div>
    );
    if (isLink && href) return <Link href={href} className="block">{content}</Link>;
    return content;
}

function SmallKpi({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: 'indigo' | 'emerald' | 'amber' }) {
    const colors = {
        indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
    };
    return (
        <div className={cn("p-6 rounded-[2rem] border flex flex-col items-center gap-3 transition-all hover:scale-105", colors[color])}>
            <Icon size={20} />
            <div className="text-center">
                <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">{label}</p>
                <p className="text-lg font-black tracking-tighter">{value}</p>
            </div>
        </div>
    );
}
