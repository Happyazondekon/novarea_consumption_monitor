import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  description?: string;
  className?: string;
}

export function KpiCard({ title, value, icon: Icon, trend, description, className }: KpiCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md",
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500">
          <Icon size={20} />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full",
            trend.positive
              ? "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-500"
              : "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500"
          )}>
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">{value}</h3>
        {description && (
          <p className="text-[10px] text-zinc-500 mt-2 font-medium">{description}</p>
        )}
      </div>
    </div>
  );
}
