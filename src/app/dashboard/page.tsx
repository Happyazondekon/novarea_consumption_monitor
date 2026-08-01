"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Zap,
  Droplets,
  Activity,
  TrendingUp,
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
  ClipboardCheck
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
  LabelList
} from 'recharts';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { resolvedTheme } = useTheme();
  const user = session?.user as any;
  const isAdmin = user?.role === 'ADMINISTRATEUR';

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [powerPeriod, setPowerPeriod] = useState<"WEEK" | "MONTH" | "YEAR">("WEEK");
  const [powerData, setPowerData] = useState<any[]>([]);
  const [powerEvents, setPowerEvents] = useState<any[]>([]);
  const [loadingPower, setLoadingPower] = useState(false);

  const [waterPeriod, setWaterPeriod] = useState<"WEEK" | "MONTH" | "YEAR">("WEEK");
  const [waterData, setWaterData] = useState<any[]>([]);
  const [waterEvents, setWaterEvents] = useState<any[]>([]);
  const [loadingWater, setLoadingWater] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const axisColor = isDark ? "#a1a1aa" : "#71717a";
  const tooltipBg = isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 1)";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)";

  const fetchData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.error("KPI Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPowerChart = async () => {
    if (!isAdmin) return;
    setLoadingPower(true);
    try {
        const res = await fetch(`/api/dashboard/stats?resource=POWER&period=${powerPeriod}`);
        if (res.ok) {
            const data = await res.json();
            setPowerData(data.chartData);
            setPowerEvents(data.eventTypes);
            if (!stats) setStats(data);
        }
    } catch (err) {
        console.error("Power Chart Error:", err);
    } finally {
        setLoadingPower(false);
    }
  };

  const fetchWaterChart = async () => {
    if (!isAdmin) return;
    setLoadingWater(true);
    try {
        const res = await fetch(`/api/dashboard/stats?resource=WATER&period=${waterPeriod}`);
        if (res.ok) {
            const data = await res.json();
            setWaterData(data.chartData);
            setWaterEvents(data.eventTypes);
        }
    } catch (err) {
        console.error("Water Chart Error:", err);
    } finally {
        setLoadingWater(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
        fetchData();
        fetchPowerChart();
        fetchWaterChart();
    }
  }, [status, isAdmin]);

  useEffect(() => {
    if (status === "authenticated" && isAdmin) fetchPowerChart();
  }, [powerPeriod]);

  useEffect(() => {
    if (status === "authenticated" && isAdmin) fetchWaterChart();
  }, [waterPeriod]);

  if (status === "loading") return (
    <div className="h-full flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  if (!isAdmin) return <TechnicianDashboard isDark={isDark} />;

  return (
    <div className="w-full space-y-6 md:space-y-10 animate-fade-in pb-20 md:pb-6 px-0 md:px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-6 md:pb-10 px-4 md:px-2">
        <div>
          <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px] mb-2">System Analytics</p>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">
             Operational Insights
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-[8px] md:text-[9px] tracking-widest mt-2 md:mt-3">Strict Database-Validated Monitoring</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
           <Link href="/dashboard/reports" className="flex-1 md:flex-initial btn-outline px-4 md:px-8 py-2.5 md:py-3 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
             <FileText size={14} /> Reports
           </Link>
           <Link href="/dashboard/reports/generator" className="flex-1 md:flex-initial btn-primary px-4 md:px-10 py-2.5 md:py-3 text-[9px] md:text-[10px] shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest">
             <Calendar size={14} /> Generator
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-2">
        <KPICard title="Electricity Usage" value={stats?.powerToday || "0.00"} unit="kWh" sub="Total Today" icon={Zap} color="blue" loading={loading} />
        <KPICard title="Water Usage" value={stats?.waterToday || "0.00"} unit="m³" sub="Total Today" icon={Droplets} color="cyan" loading={loading} />
        <KPICard title="Active Events" value={stats?.eventsToday || "0"} unit="Notes" sub="Anomalies logged" icon={Activity} color="purple" loading={loading} />
        <KPICard title="Daily Average" value={stats?.dailyAverage || "0.00"} unit="kWh/d" sub="Verified (30d)" icon={TrendingUp} color="green" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 px-4 md:px-2">
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter">Electricity</h2>
                </div>
                <PeriodSelector active={powerPeriod} onChange={setPowerPeriod} />
            </div>
            <Card className="apple-card p-4 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-none shadow-sm min-h-[400px] md:min-h-[450px] flex flex-col">
                {loadingPower ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-4">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Compiling...</span>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 min-h-[250px] md:min-h-[300px]">
                            <ResponsiveContainer width="100%" height={320}>
                                <ComposedChart data={powerData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: axisColor }} dy={10} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: axisColor }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#ef4444' }} />
                                    <Tooltip content={<CustomTooltip theme={{ bg: tooltipBg, border: tooltipBorder, isDark }} />} />
                                    <Bar yAxisId="left" dataKey="consumption" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={powerPeriod === "YEAR" ? 30 : 12} />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="events"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                                    >
                                        <LabelList dataKey="eventCodes" position="top" style={{ fontSize: '9px', fontStyle: 'italic', fontWeight: 900, fill: '#ef4444' }} />
                                    </Line>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-zinc-200 dark:border-zinc-800">
                             <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Anomalies</p>
                             <div className="flex flex-wrap gap-2 md:gap-4">
                                {powerEvents.length > 0 ? powerEvents.map(type => (
                                    <div key={type.id} className="flex items-center gap-1.5 md:gap-2 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-[9px] font-black text-blue-600">{type.code}</span>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase truncate max-w-[80px] md:max-w-none">{type.description}</span>
                                    </div>
                                )) : (
                                    <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">No anomalies recorded</span>
                                )}
                             </div>
                        </div>
                    </>
                )}
            </Card>
        </div>

        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
                    <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter">Water</h2>
                </div>
                <PeriodSelector active={waterPeriod} onChange={setWaterPeriod} />
            </div>
            <Card className="apple-card p-4 md:p-8 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-none shadow-sm min-h-[400px] md:min-h-[450px] flex flex-col">
                {loadingWater ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 gap-4">
                        <Loader2 className="animate-spin text-cyan-600" size={32} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Analysing...</span>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 min-h-[250px] md:min-h-[300px]">
                            <ResponsiveContainer width="100%" height={320}>
                                <ComposedChart data={waterData} margin={{ top: 20, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: axisColor }} dy={10} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: axisColor }} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 900, fill: '#ef4444' }} />
                                    <Tooltip content={<CustomTooltip theme={{ bg: tooltipBg, border: tooltipBorder, isDark }} />} />
                                    <Bar yAxisId="left" dataKey="consumption" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={waterPeriod === "YEAR" ? 30 : 12} />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="events"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                                    >
                                        <LabelList dataKey="eventCodes" position="top" style={{ fontSize: '9px', fontStyle: 'italic', fontWeight: 900, fill: '#ef4444' }} />
                                    </Line>
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-zinc-200 dark:border-zinc-800">
                             <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-4">Anomalies</p>
                             <div className="flex flex-wrap gap-2 md:gap-4">
                                {waterEvents.length > 0 ? waterEvents.map(type => (
                                    <div key={type.id} className="flex items-center gap-1.5 md:gap-2 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-[9px] font-black text-cyan-600">{type.code}</span>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase truncate max-w-[80px] md:max-w-none">{type.description}</span>
                                    </div>
                                )) : (
                                    <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">No anomalies recorded</span>
                                )}
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

function KPICard({ title, value, unit, sub, icon: Icon, color, loading }: any) {
    const colors: any = {
        blue: "text-blue-600 bg-blue-50/50 dark:bg-blue-900/10",
        cyan: "text-cyan-600 bg-cyan-50/50 dark:bg-cyan-900/10",
        purple: "text-purple-600 bg-purple-50/50 dark:bg-purple-900/10",
        green: "text-green-600 bg-green-50/50 dark:bg-green-900/10"
    };

    return (
        <Card className="apple-card p-5 md:p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-none shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className={cn("p-2 md:p-2.5 rounded-xl", colors[color])}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="flex items-center gap-1.5 text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    Live
                </div>
            </div>
            <div>
                <p className="text-[8px] md:text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1.5 md:mb-2">{title}</p>
                {loading ? (
                    <div className="h-8 md:h-10 w-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
                ) : (
                    <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none uppercase">
                        {value} <span className="text-xs md:text-sm text-zinc-400 ml-1">{unit}</span>
                    </h3>
                )}
                <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase mt-2 tracking-widest opacity-60">{sub}</p>
            </div>
        </Card>
    );
}

function PeriodSelector({ active, onChange }: any) {
    return (
        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-full sm:w-auto overflow-hidden">
            {["WEEK", "MONTH", "YEAR"].map((p) => (
                <button
                    key={p}
                    onClick={() => onChange(p)}
                    className={cn(
                        "flex-1 sm:flex-initial px-3 md:px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                        active === p ? "bg-white dark:bg-zinc-700 text-blue-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                    )}
                >
                    {p}
                </button>
            ))}
        </div>
    );
}

const CustomTooltip = ({ active, payload, label, theme }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="backdrop-blur-md border p-3 md:p-4 rounded-xl shadow-2xl transition-colors duration-300"
          style={{ backgroundColor: theme.bg, borderColor: theme.border }}
        >
          <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: theme.isDark ? '#fff' : '#18181b' }}>{label}</p>
          <div className="space-y-1.5 md:space-y-2 text-left">
            <div className="flex items-center justify-between gap-4 md:gap-6">
                <span className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Usage</span>
                <span className="text-xs md:text-sm font-black" style={{ color: theme.isDark ? '#fff' : '#18181b' }}>{payload[0].value.toFixed(2)}</span>
            </div>
            {payload[1] && (
                <div className="flex items-center justify-between gap-4 md:gap-6 border-t border-zinc-200 dark:border-white/5 pt-1.5 md:pt-2">
                    <span className="text-[9px] md:text-[10px] font-bold text-red-400 uppercase tracking-widest">Events</span>
                    <span className="text-xs md:text-sm font-black text-red-500">{payload[1].value}</span>
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
  const user = session?.user as any;

  const [readings, setReadings] = useState<any[]>([]);
  const [techStats, setTechStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTechData = async () => {
    setLoading(true);
    try {
        const [readingsRes, statsRes] = await Promise.all([
            fetch("/api/readings?limit=5"),
            fetch("/api/technician/stats")
        ]);
        if (readingsRes.ok) setReadings(await readingsRes.json());
        if (statsRes.ok) setTechStats(await statsRes.json());
    } catch (err) {
        console.error("Tech Fetch error:", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechData();
  }, []);

  return (
    <div className="w-full space-y-6 md:space-y-10 animate-fade-in pb-20 md:pb-6 px-0 md:px-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-6 md:pb-10 px-4 md:px-2">
        <div>
          <p className="text-blue-600 font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px] mb-2">Operational Hub</p>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">
             Daily Deployment
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-[8px] md:text-[9px] tracking-widest mt-2 md:mt-3">Technician Monitoring Access</p>
        </div>
        <Link href="/dashboard/new-reading" className="btn-primary w-full md:w-auto px-8 md:px-12 py-3 md:py-4 text-xs font-black shadow-xl shadow-blue-500/20">
          <Plus className="w-4 h-4 md:w-5 md:h-5" /> NEW READING
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 px-4 md:px-2">
        <KPICard title="Missions" value={techStats?.newInstructions || "0"} unit="Active" sub="Directives" icon={MessageSquare} color="blue" loading={loading} />
        <KPICard title="Verified" value={techStats?.validatedCount || "0"} unit="Logs" sub="Audited" icon={ShieldCheck} color="green" loading={loading} />
        <KPICard title="Pending" value={techStats?.pendingCount || "0"} unit="Review" sub="Waiting" icon={AlertCircle} color="purple" loading={loading} />
        <KPICard title="Total" value={techStats?.totalReadings || "0"} unit="Records" sub="Global" icon={ClipboardCheck} color="cyan" loading={loading} />
      </div>

      <div className="space-y-6 px-4 md:px-2 pt-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full bg-blue-600" />
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter">Your Last Submissions</h2>
           </div>
           <Link href="/dashboard/history" className="text-[10px] font-black uppercase text-blue-600 hover:underline">History</Link>
        </div>

        {/* MOBILE CARDS FOR TECH DASHBOARD */}
        <div className="md:hidden grid grid-cols-1 gap-3">
            {readings.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", r.category === 'POWER' ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600")}>
                            {r.category === 'POWER' ? <Zap size={14}/> : <Droplets size={14}/>}
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-zinc-900 dark:text-white uppercase leading-none">{r.value.toFixed(2)} {r.category === 'POWER' ? 'kWh' : 'm³'}</p>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase mt-1">{format(new Date(r.timestamp), 'dd MMM, HH:mm')}</p>
                        </div>
                    </div>
                    {r.isEdited ? <AlertCircle size={14} className="text-orange-400" /> : <CheckCircle2 size={14} className="text-green-500" />}
                </div>
            ))}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] bg-zinc-100 dark:bg-zinc-800/20">
                  <th className="px-8 py-4">Timestamp</th>
                  <th className="px-8 py-4 resource-col">Resource</th>
                  <th className="px-8 py-4 text-right">Captured Index</th>
                  <th className="px-8 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {readings.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                    <td className="px-8 py-4">
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase leading-none">{format(new Date(r.timestamp), 'dd MMM yyyy')}</span>
                            <span className="text-[8px] text-zinc-400 font-bold uppercase mt-1">{format(new Date(r.timestamp), 'HH:mm')} • {r.timeOfDay}</span>
                        </div>
                    </td>
                    <td className="px-8 py-4">
                        <span className={cn("px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest", r.category === 'POWER' ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-cyan-50 text-cyan-600 border border-cyan-100")}>
                            {r.category}
                        </span>
                    </td>
                    <td className="px-8 py-4 text-right font-black text-xs uppercase">{r.value.toFixed(2)}</td>
                    <td className="px-8 py-4">
                        <div className="flex justify-center">
                            {r.isEdited ? (
                                <AlertCircle size={14} className="text-orange-400" />
                            ) : (
                                <CheckCircle2 size={14} className="text-green-500" />
                            )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
        {readings.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">No recent data entries</p>
            </div>
        )}
      </div>
    </div>
  );
}
