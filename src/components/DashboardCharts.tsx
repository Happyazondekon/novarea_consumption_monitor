"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

// --- BENCHMARKING : Horizontal Bar Chart pour éviter les chevauchements ---
export function ProjectsComparisonChart({ data }: { data: any[] }) {
  const sortedData = [...data].sort((a, b) => b.engagement - a.engagement).slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={sortedData}
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
        <XAxis type="number" unit="%" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
        <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 9, fontWeight: 'black' }}
            width={100}
        />
        <Tooltip
            cursor={{fill: 'transparent'}}
            contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
        />
        <Bar dataKey="engagement" name="Engagement" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={12} />
        <Bar dataKey="paiement" name="Paiement" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FunderPerformanceChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} unit="%" />
        <Tooltip />
        <Bar dataKey="mobilisation" name="Mobilisation" fill="#fcd116" radius={[4, 4, 0, 0]} />
        <Bar dataKey="consommation" name="Consommation" fill="#008751" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SectorRadarChart({ data }: { data: any[] }) {
    return null; // Supprimé si non utilisé pour plus de clarté
}
