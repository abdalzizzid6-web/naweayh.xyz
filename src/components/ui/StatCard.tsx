import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  changePercent?: number;
  period?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  changePercent,
  period,
  icon,
}) => {
  const isPositive = changePercent !== undefined && changePercent > 0;
  const isNegative = changePercent !== undefined && changePercent < 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <div className="p-2 bg-slate-50 rounded-lg text-slate-600 border border-slate-100">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {changePercent !== undefined && (
          <div
            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : isNegative
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-slate-50 text-slate-600 border border-slate-100'
            }`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : isNegative ? (
              <ArrowDownRight className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            <span>{Math.abs(changePercent)}%</span>
          </div>
        )}
      </div>
      {period && <p className="text-xs text-slate-400 mt-1">{period}</p>}
    </div>
  );
};
