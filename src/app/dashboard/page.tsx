"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Zap,
  Droplets,
  Activity,
  TrendingUp,
  TrendingDown,
  Plus,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Clock,
  ChevronRight,
  Loader2,
  Filter,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  ClipboardCheck,
  Hash,
  ArrowRight,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { Card } from "@/components/ui/Card";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { format, differenceInDays } from 'date-fns';
import { INDUSTRIAL_COLORS } from '@/lib/constants/colors';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { resolvedTheme } = useTheme();
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMINISTRATEUR';

  const [activeResource, setActiveResource] = useState<"POWER" | "WATER">("POWER");
  const [activePeriod, setActivePeriod] = useState<"WEEK" | "MONTH" | "YEAR" | "CUSTOM">("WEEK");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activeAggregation, setActiveAggregation] = useState<"DAY" | "WEEK" | "MONTH">("DAY");

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const axisColor = isDark ? "#71717a" : "#a1a1aa";

  const getAllowedAggregations = () => {
    let days = 0;
    if (activePeriod === "WEEK") days = 7;
    else if (activePeriod === "MONTH") days = 31;
    else if (activePeriod === "YEAR") days = 365;
    else if (customStart && customEnd) {
        days = differenceInDays(new Date(customEnd), new Date(customStart)) + 1;
    }
    if (days <= 7) return ["DAY"];
    if (days <= 31) return ["DAY", "WEEK"];
    return ["MONTH", "WEEK"];
  };

  const allowedAggs = getAllowedAggregations();

  useEffect(() => {
    if (!allowedAggs.includes(activeAggregation)) {
        setActiveAggregation(allowedAggs[0] as any);
    }
  }, [activePeriod, customStart, customEnd]);

  const fetchDashboardData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      let url = `/api/dashboard/stats?resource=${activeResource}&period=${activePeriod}&aggregation=${activeAggregation}`;
      if (activePeriod === "CUSTOM" && customStart && customEnd) {
          url += `&customStart=${customStart}&customEnd=${customEnd}`;
      }
      const res = await fetch(url);
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error("Dashboard Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
        if (activePeriod === "CUSTOM" && (!customStart || !customEnd)) return;
        fetchDashboardData();
    }
  }, [status, isAdmin, activeResource, activePeriod, customStart, customEnd, activeAggregation]);

  if (status === "loading") return (
    <div className="h-full flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  if (!isAdmin) return <TechnicianDashboard isDark={isDark} />;

  return (
    <div className="w-full space-y-6 md:space-y-10 animate-fade-in pb-20 md:pb-6 px-0 md:px-6 text-left selection:bg-blue-500/30">

      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-zinc-200 dark:border-zinc-800 pb-8 px-4 md:px-2">
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px] mb-2">Command Center</p>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">
               Operational Insights
            </h1>
          </div>

          <div className="flex flex-wrap gap-4">
              <div id="active-resource-toggle" className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <ResourceBtn active={activeResource === "POWER"} onClick={() => setActiveResource("POWER")} label="Electricity" icon={Zap} color="blue" />
                <ResourceBtn active={activeResource === "WATER"} onClick={() => setActiveResource("WATER")} label="Water" icon={Droplets} color="cyan" />
              </div>

              <div id="period-shortcuts" className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                {["WEEK", "MONTH", "YEAR"].map(p => (
                    <button
                        key={p}
                        onClick={() => setActivePeriod(p as any)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                            activePeriod === p ? "bg-white dark:bg-zinc-700 text-blue-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => setActivePeriod("CUSTOM")}
                    className={cn(
                        "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                        activePeriod === "CUSTOM" ? "bg-white dark:bg-zinc-700 text-blue-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                    )}
                >
                    CUSTOM
                </button>
              </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 w-full xl:w-auto">
            {activePeriod === "CUSTOM" && (
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-inner animate-in slide-in-from-right-4 duration-300">
                    <div className="flex flex-col px-2">
                        <span className="text-[7px] font-black text-zinc-400 uppercase">Start</span>
                        <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-transparent border-none outline-none text-[10px] font-black uppercase w-28" />
                    </div>
                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex flex-col px-2">
                        <span className="text-[7px] font-black text-zinc-400 uppercase">End</span>
                        <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-transparent border-none outline-none text-[10px] font-black uppercase w-28" />
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2 md:gap-3 flex-1 sm:flex-initial">
                <Link href="/dashboard/reports" className="flex-1 sm:flex-initial btn-outline px-6 py-3 text-[10px] font-black uppercase">
                    <FileText size={14} /> Reports
                </Link>
                <Link href="/dashboard/reports/generator" className="flex-1 sm:flex-initial btn-primary px-8 py-3 text-[10px] shadow-xl shadow-blue-500/20 font-black uppercase">
                    <Calendar size={14} /> Generator
                </Link>
            </div>
        </div>
      </div>

      <div id="kpi-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-2">
        <KPICard title="Last Reading" value={stats?.lastReading || "0.00"} unit={activeResource === 'POWER' ? 'kWh' : 'm³'} sub="Current Index" icon={Hash} color={activeResource === 'POWER' ? 'blue' : 'cyan'} loading={loading} />
        <KPICard title={activeResource === 'POWER' ? 'Electricity Usage' : 'Water Usage'} value={stats?.usageToday || "0.00"} unit={activeResource === 'POWER' ? 'kWh' : 'm³'} sub="Total for Period" icon={activeResource === 'POWER' ? Zap : Droplets} color={activeResource === 'POWER' ? 'blue' : 'cyan'} loading={loading} />
        <KPICard title="Active Events" value={stats?.eventsToday || "0"} unit="Notes" sub="Operational Context" icon={Activity} color="purple" loading={loading} />
        <KPICard title="Baseline Average" value={stats?.dailyAverage || "0.00"} unit={activeResource === 'POWER' ? 'kWh/d' : 'm³/d'} sub="30-Day Verified" icon={TrendingUp} color="green" loading={loading} />
      </div>

      <div className="px-4 md:px-2">
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                    <div className={cn("w-1.5 h-6 rounded-full shadow-lg", activeResource === 'POWER' ? "bg-yellow-500 shadow-yellow-500/20" : "bg-blue-500 shadow-blue-500/20")} />
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Consumption Trends</h2>
                </div>
                <div id="aggregation-selector" className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                    {allowedAggs.map(agg => (
                        <button key={agg} onClick={() => setActiveAggregation(agg as any)} className={cn("px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all", activeAggregation === agg ? "bg-white dark:bg-zinc-700 text-blue-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600")}>BY {agg}</button>
                    ))}
                </div>
            </div>

            <Card id="trends-chart" className="apple-card p-6 md:p-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-none shadow-sm min-h-[500px] flex flex-col">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-4">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                        <span className="text-[11px] font-black uppercase tracking-widest italic opacity-40">Synchronizing industrial data...</span>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 min-h-[350px]">
                            <ResponsiveContainer width="100%" height={380}>
                                <ComposedChart data={stats?.chartData || []} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: axisColor }} dy={12} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: axisColor }} />
                                    <Tooltip content={<CustomTooltip theme={{ isDark }} />} />
                                    <ReferenceLine y={stats?.referenceAverage || 0} stroke={INDUSTRIAL_COLORS.REFERENCE_LINE} strokeDasharray="5 5" strokeWidth={2} label={{ position: 'right', value: `AVG: ${stats?.referenceAverage}`, fill: INDUSTRIAL_COLORS.REFERENCE_LINE, fontSize: 9, fontWeight: 900 }} />
                                    <Bar dataKey="consumption" radius={[6, 6, 0, 0]} barSize={activeAggregation === 'MONTH' ? 40 : activeAggregation === 'WEEK' ? 25 : 14}>
                                        { (stats?.chartData || []).map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={activeResource === 'POWER' ? INDUSTRIAL_COLORS.POWER : INDUSTRIAL_COLORS.WATER}
                                                fillOpacity={entry.source === 'INTERPOLATED' ? 0.4 : (entry.consumption >= stats?.referenceAverage ? 1 : 0.7)}
                                                stroke={entry.source === 'INTERPOLATED' ? (activeResource === 'POWER' ? INDUSTRIAL_COLORS.POWER : INDUSTRIAL_COLORS.WATER) : 'none'}
                                                strokeDasharray={entry.source === 'INTERPOLATED' ? "4 4" : "0"}
                                            />
                                        ))}
                                    </Bar>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                             <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 px-4 py-2 rounded-xl border border-red-100 dark:border-red-900/20">
                                    <TrendingUp size={16} className="text-red-500" />
                                    <span className="text-base font-black text-red-600">{stats?.eventSummary?.ie || 0} IE</span>
                                </div>
                                <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/10 px-4 py-2 rounded-xl border border-green-100 dark:border-green-900/20">
                                    <TrendingDown size={16} className="text-green-500" />
                                    <span className="text-base font-black text-green-600">{stats?.eventSummary?.de || 0} DE</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                <Sparkles size={12} className="text-blue-600" />
                                <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Standard Protocol Active</span>
                             </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
}

function ResourceBtn({ active, onClick, label, icon: Icon, color }: any) {
    const activeStyles: any = { blue: "bg-white dark:bg-zinc-700 text-blue-600 shadow-md scale-[1.02]", cyan: "bg-white dark:bg-zinc-700 text-cyan-500 shadow-md scale-[1.02]" };
    return (
        <button onClick={onClick} className={cn("flex-1 md:flex-initial flex items-center justify-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300", active ? activeStyles[color] : "text-zinc-400 hover:text-zinc-600")}>
            <Icon size={14} className={cn("transition-transform", active && "scale-110")} /> {label}
        </button>
    );
}

function KPICard({ title, value, unit, sub, icon: Icon, color, loading }: any) {
    const colors: any = { blue: "text-blue-600 bg-blue-50/50 dark:bg-blue-900/10", cyan: "text-cyan-600 bg-cyan-50/50 dark:bg-cyan-900/10", purple: "text-purple-600 bg-purple-50/50 dark:bg-purple-900/10", green: "text-green-600 bg-green-50/50 dark:bg-green-900/10" };
    return (
        <Card className="apple-card p-5 md:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-none shadow-sm flex flex-col justify-between hover:shadow-md transition-all h-full">
            <div className="flex items-center justify-between mb-6 md:mb-10">
                <div className={cn("p-2.5 rounded-2xl shadow-sm", colors[color])}><Icon className="w-5 h-5" /></div>
                <div className="flex items-center gap-1.5 text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]" /> Live
                </div>
            </div>
            <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">{title}</p>
                {loading ? <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" /> : <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none uppercase truncate">{value} <span className="text-xs md:text-sm text-zinc-400 ml-1 font-bold">{unit}</span></h3>}
                <p className="text-[10px] font-bold text-zinc-400 uppercase mt-3 tracking-widest opacity-60 truncate">{sub}</p>
            </div>
        </Card>
    );
}

const CustomTooltip = ({ active, payload, label, theme }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={cn("backdrop-blur-xl border p-4 rounded-[1.5rem] shadow-2xl transition-all duration-300", theme.isDark ? "bg-zinc-900/90 border-white/10" : "bg-white/90 border-zinc-200")}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-zinc-400 border-b border-zinc-100 dark:border-white/5 pb-2">{label}</p>
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between gap-8">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Usage</span>
                <span className={cn("text-sm font-black", theme.isDark ? "text-white" : "text-zinc-900")}>{payload[0].value.toFixed(2)}{data.source === 'INTERPOLATED' ? '*' : ''}</span>
            </div>
            {data.source === 'INTERPOLATED' && (
                <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                    <p className="text-[8px] font-black text-blue-500 uppercase flex items-center gap-1.5"><Sparkles size={8}/> Estimated Value</p>
                    <p className="text-[7px] font-bold text-zinc-400 mt-1 leading-tight">No reading captured this day. Gap distributed between {format(new Date(data.gapStart), 'dd MMM')} and {format(new Date(data.gapEnd), 'dd MMM')}.</p>
                </div>
            )}
            {data.eventCodes && (
                <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-1"><Activity size={10} className="text-red-500" /><span className="text-[8px] font-black text-red-500 uppercase">Context Log</span></div>
                    <p className="text-[9px] font-bold text-zinc-400 italic max-w-[150px] leading-tight">{data.eventCodes}</p>
                </div>
            )}
          </div>
        </div>
      );
    }
    return null;
};

function TechnicianDashboard({ isDark }: { isDark: boolean }) {
    const { data: session } = useSession();
    const [readings, setReadings] = useState<any[]>([]);
    const [techStats, setTechStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchTechData = async () => {
      setLoading(true);
      try {
          const [readingsRes, statsRes] = await Promise.all([fetch("/api/readings?limit=5"), fetch("/api/technician/stats")]);
          if (readingsRes.ok) setReadings(await readingsRes.json());
          if (statsRes.ok) setTechStats(await statsRes.json());
      } catch (err) { console.error("Tech Fetch error:", err); } finally { setLoading(false); }
    };
    useEffect(() => { fetchTechData(); }, []);
    return (
      <div className="w-full space-y-6 md:space-y-10 animate-fade-in pb-20 md:pb-6 px-0 md:px-6 text-left">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-6 md:pb-10 px-4 md:px-2">
          <div><p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px] mb-2">Operational Hub</p><h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">Daily Deployment</h1><p className="text-zinc-500 font-bold uppercase text-[8px] md:text-[9px] tracking-widest mt-2 md:mt-3">Technician Monitoring Access</p></div>
          <Link id="new-reading-btn" href="/dashboard/new-reading" className="btn-primary w-full md:w-auto px-8 md:px-12 py-3 md:py-4 text-xs font-black shadow-xl shadow-blue-500/20"><Plus className="w-4 h-4 md:w-5 md:h-5" /> NEW READING</Link>
        </div>
        <div id="tech-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 px-4 md:px-2">
          <KPICard title="Missions" value={techStats?.newInstructions || "0"} unit="Active" sub="Directives" icon={MessageSquare} color="blue" loading={loading} />
          <KPICard title="Verified" value={techStats?.validatedCount || "0"} unit="Logs" sub="Audited" icon={ShieldCheck} color="green" loading={loading} />
          <KPICard title="Pending" value={techStats?.pendingCount || "0"} unit="Review" sub="Waiting" icon={AlertCircle} color="purple" loading={loading} />
          <KPICard title="Total" value={techStats?.totalReadings || "0"} unit="Records" sub="Global" icon={ClipboardCheck} color="cyan" loading={loading} />
        </div>
        <div id="recent-submissions" className="space-y-6 px-4 md:px-2 pt-4">
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-1.5 h-6 rounded-full bg-blue-600" /><h2 className="text-lg md:text-xl font-black uppercase tracking-tighter">Your Last Submissions</h2></div><Link href="/dashboard/history" className="text-[10px] font-black uppercase text-blue-600 hover:underline">History</Link></div>
          <div className="md:hidden grid grid-cols-1 gap-3">
              {readings.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", r.category === 'POWER' ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600")}>{r.category === 'POWER' ? <Zap size={14}/> : <Droplets size={14}/>}</div>
                          <div><p className="text-[11px] font-black text-zinc-900 dark:text-white uppercase leading-none">{r.value.toFixed(2)} {r.category === 'POWER' ? 'kWh' : 'm³'}</p><p className="text-[8px] font-bold text-zinc-400 uppercase mt-1">{format(new Date(r.timestamp), 'dd MMM, HH:mm')}</p></div>
                      </div>
                      {r.isEdited ? <AlertCircle size={14} className="text-orange-400" /> : <CheckCircle2 size={14} className="text-green-500" />}
                  </div>
              ))}
          </div>
          <div className="hidden md:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
             <table className="w-full text-left border-collapse">
                <thead><tr className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] bg-zinc-100 dark:bg-zinc-800/20"><th className="px-8 py-4">Timestamp</th><th className="px-8 py-4 resource-col">Resource</th><th className="px-8 py-4 text-right">Captured Index</th><th className="px-8 py-4 text-center">Status</th></tr></thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {readings.map((r) => (
                    <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                      <td className="px-8 py-4"><div className="flex flex-col"><span className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase leading-none">{format(new Date(r.timestamp), 'dd MMM yyyy')}</span><span className="text-[8px] text-zinc-400 font-bold uppercase mt-1">{format(new Date(r.timestamp), 'HH:mm')} • {r.timeOfDay}</span></div></td>
                      <td className="px-8 py-4"><span className={cn("px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest", r.category === 'POWER' ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-cyan-50 text-cyan-600 border border-cyan-100")}>{r.category}</span></td>
                      <td className="px-8 py-4 text-right font-black text-xs uppercase">{r.value.toFixed(2)}</td>
                      <td className="px-8 py-4"><div className="flex justify-center">{r.isEdited ? <AlertCircle size={14} className="text-orange-400" /> : <CheckCircle2 size={14} className="text-green-500" />}</div></td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
          {readings.length === 0 && <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl"><p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">No recent data entries</p></div>}
        </div>
      </div>
    );
}
