import React from 'react';
import { TrendingUp, Target, Percent, Scale, ShieldCheck } from 'lucide-react';

interface TopKpiStripProps {
  totalMatches: number;
  evOpportunitiesCount: number;
  surebetsCount: number;
  averageOverround: number;
  bestEVValue: number;
  smallBankrollMode: boolean;
}

export const TopKpiStrip: React.FC<TopKpiStripProps> = ({
  totalMatches,
  evOpportunitiesCount,
  surebetsCount,
  averageOverround,
  bestEVValue,
  smallBankrollMode,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* Metric 1 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Partidos Analizados</span>
          <Scale className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white font-mono tabular-nums">{totalMatches}</span>
          <span className="text-xs text-slate-500">16 Ligas</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">10 casas monitorizadas</div>
      </div>

      {/* Metric 2 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-emerald-400">Líneas con Valor (EV+)</span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-emerald-400 font-mono tabular-nums">{evOpportunitiesCount}</span>
          <span className="text-xs text-emerald-500 font-mono font-semibold">Edge Positivo</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">Consenso vig-free superado</div>
      </div>

      {/* Metric 3 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-amber-400">Surebets (Arbitraje)</span>
          <Target className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">{surebetsCount}</span>
          <span className="text-xs text-amber-500 font-mono">Retorno 100% Garantizado</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">Discrepancia entre casas</div>
      </div>

      {/* Metric 4 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Overround Promedio</span>
          <Percent className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-200 font-mono tabular-nums">{averageOverround.toFixed(2)}%</span>
          <span className="text-xs text-slate-500">Margen casa</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-1">Calibrado con Pinnacle & Betfair</div>
      </div>

      {/* Metric 5 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px]">Mejor Edge Disponible</span>
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-cyan-400 font-mono tabular-nums">
            {bestEVValue > 0 ? `+${bestEVValue.toFixed(1)}%` : 'N/D'}
          </span>
          <span className="text-xs text-slate-500">EV máx</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          {smallBankrollMode ? 'Modo <$25 activo' : 'Kelly Estándar'}
        </div>
      </div>
    </div>
  );
};
