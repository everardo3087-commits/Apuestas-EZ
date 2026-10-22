import React from 'react';
import { Search, Filter, Shield, Zap, Calendar, ArrowRight, X } from 'lucide-react';
import { Competition, StrategicTier } from '../types/odds';

export type DateFilterMode = 'all' | 'today' | 'next_7_days' | 'custom_range';

export interface FilterState {
  tier: 'ALL' | StrategicTier;
  competitionId: string;
  searchQuery: string;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  smallBankrollMode: boolean;
  minEvThreshold: number;
  autoRefreshEnabled: boolean;
  dateFilter: DateFilterMode;
  customStartDate?: string;
  customEndDate?: string;
}

interface FilterBarProps {
  filters: FilterState;
  competitions: Competition[];
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  bankroll: number;
  onBankrollChange: (newBankroll: number) => void;
  matchesCount?: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  competitions,
  onFilterChange,
  bankroll,
  onBankrollChange,
  matchesCount,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const in7DaysStr = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Row 1: Search & League Selector */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Team Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por equipo (ej. Leeds, América, River, Feyenoord)..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Tier Filter */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onFilterChange({ tier: 'ALL', competitionId: 'all' })}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filters.tier === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            Todas las Ligas
          </button>
          <button
            onClick={() => onFilterChange({ tier: 'TOP_VALOR', competitionId: 'all' })}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filters.tier === 'TOP_VALOR'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            🔥 Top Valor
          </button>
          <button
            onClick={() => onFilterChange({ tier: 'ALTO_VALOR', competitionId: 'all' })}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filters.tier === 'ALTO_VALOR'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-950/60'
            }`}
          >
            📈 Alto Valor
          </button>
        </div>

        {/* Competition Dropdown */}
        <div className="w-full md:w-64 shrink-0">
          <select
            value={filters.competitionId}
            onChange={(e) => onFilterChange({ competitionId: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
          >
            <option value="all">Todas las 16 competencias curadas</option>
            {competitions.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.tierLabel} · {comp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Date Filters (Hoy, Próximos 7 días, Selección de rango de fecha) */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium text-[11px] uppercase tracking-wider mr-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filtro de Fecha:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onFilterChange({ dateFilter: 'all' })}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filters.dateFilter === 'all'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => onFilterChange({ dateFilter: 'today' })}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filters.dateFilter === 'today'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => onFilterChange({ dateFilter: 'next_7_days' })}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filters.dateFilter === 'next_7_days'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Próximos 7 Días
            </button>
            <button
              onClick={() =>
                onFilterChange({
                  dateFilter: 'custom_range',
                  customStartDate: filters.customStartDate || todayStr,
                  customEndDate: filters.customEndDate || in7DaysStr,
                })
              }
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filters.dateFilter === 'custom_range'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rango de Fecha
            </button>
          </div>

          {/* Date Picker Range Inputs when custom_range is selected */}
          {filters.dateFilter === 'custom_range' && (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs">
              <span className="text-slate-400 text-[11px]">Desde:</span>
              <input
                type="date"
                value={filters.customStartDate || todayStr}
                onChange={(e) => onFilterChange({ customStartDate: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
              <span className="text-slate-400 text-[11px]">Hasta:</span>
              <input
                type="date"
                value={filters.customEndDate || in7DaysStr}
                onChange={(e) => onFilterChange({ customEndDate: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
              {(filters.customStartDate || filters.customEndDate) && (
                <button
                  onClick={() => onFilterChange({ dateFilter: 'all' })}
                  title="Limpiar rango"
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {matchesCount !== undefined && (
          <div className="text-[11px] text-slate-400 font-mono">
            {matchesCount} partidos coinciden con los filtros
          </div>
        )}
      </div>

      {/* Row 3: Risk Profile, Small Bankroll Mode & Live Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
        {/* Risk Profile Selection */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Perfil de Riesgo:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onFilterChange({ riskProfile: 'conservative', minEvThreshold: 7.0 })}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filters.riskProfile === 'conservative'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🛡️ Conservador (EV ≥ 7%)
            </button>
            <button
              onClick={() => onFilterChange({ riskProfile: 'moderate', minEvThreshold: 5.0 })}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filters.riskProfile === 'moderate'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚖️ Moderado (EV ≥ 5%)
            </button>
            <button
              onClick={() => onFilterChange({ riskProfile: 'aggressive', minEvThreshold: 3.0 })}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                filters.riskProfile === 'aggressive'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ Agresivo (EV ≥ 3%)
            </button>
          </div>
        </div>

        {/* Small Bankroll Mode Toggle (<$25) & Live Ticker */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Bankroll: $</span>
            <input
              type="number"
              min="1"
              max="50000"
              step="1"
              value={bankroll}
              onChange={(e) => onBankrollChange(Number(e.target.value) || 100)}
              className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono text-right"
            />
          </div>

          <button
            onClick={() => onFilterChange({ smallBankrollMode: !filters.smallBankrollMode })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              filters.smallBankrollMode
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Modo Bankroll Pequeño (&lt;$25)</span>
          </button>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => onFilterChange({ autoRefreshEnabled: !filters.autoRefreshEnabled })}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              filters.autoRefreshEnabled
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{filters.autoRefreshEnabled ? 'Ticker En Vivo (15s)' : 'Pausado'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
