import React from 'react';
import { RefreshCw, Radio, Shield, DollarSign, Bell, Box } from 'lucide-react';

export type ActiveTab = 'ev_bets' | 'surebets' | 'bookmakers_api' | 'steam_moves' | 'odds_matrix' | 'parlays' | 'tracker' | 'stadium_3d';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onRefreshOdds: () => void;
  isRefreshing: boolean;
  bankroll: number;
  smallBankrollMode: boolean;
  surebetsCount: number;
  evBetsCount: number;
  onOpenNotifications: () => void;
  notificationsActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onRefreshOdds,
  isRefreshing,
  bankroll,
  smallBankrollMode,
  surebetsCount,
  evBetsCount,
  onOpenNotifications,
  notificationsActive,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single element, clean typography) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-sm">
            ME
          </div>
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            SCANNER DE APUESTAS
          </span>
        </div>

        {/* Zone 2: Navigation Links / Segmented Tabs (single-line, concise) */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800/80 shrink-0">
          <button
            onClick={() => onSelectTab('ev_bets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'ev_bets'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Líneas EV+ {evBetsCount > 0 && <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30">{evBetsCount}</span>}
          </button>

          <button
            onClick={() => onSelectTab('surebets')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'surebets'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Arbitraje (Surebets) {surebetsCount > 0 && <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-200">{surebetsCount}</span>}
          </button>

          <button
            onClick={() => onSelectTab('bookmakers_api')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'bookmakers_api'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            APIs Casas (B365/WH/Bwin)
          </button>

          <button
            onClick={() => onSelectTab('steam_moves')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'steam_moves'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dropping Odds
          </button>

          <button
            onClick={() => onSelectTab('odds_matrix')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'odds_matrix'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Matriz de Cuotas
          </button>

          <button
            onClick={() => onSelectTab('parlays')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'parlays'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Combinadas
          </button>

          <button
            onClick={() => onSelectTab('tracker')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'tracker'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mi Cartera
          </button>

          <button
            onClick={() => onSelectTab('stadium_3d')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'stadium_3d'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Estadio 3D</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Update Odds) + Bankroll Pill + Notifications */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Bankroll:</span>
            <span className="font-mono font-bold text-white tabular-nums">${bankroll.toFixed(2)}</span>
            {smallBankrollMode && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-semibold ml-1">
                <Shield className="w-3 h-3" /> Seguro
              </span>
            )}
          </div>

          <button
            onClick={onOpenNotifications}
            title="Configurar Alertas de Surebets (Segundo Plano)"
            className={`p-2 rounded-lg border transition-colors relative ${
              notificationsActive
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            {notificationsActive && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-slate-950" />
            )}
          </button>

          <button
            onClick={onRefreshOdds}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Strip */}
      <div className="lg:hidden flex items-center overflow-x-auto px-4 py-2 bg-slate-900 border-t border-slate-800 gap-1 text-xs scrollbar-none">
        <button
          onClick={() => onSelectTab('ev_bets')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'ev_bets' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
        >
          Líneas EV+
        </button>
        <button
          onClick={() => onSelectTab('surebets')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'surebets' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
        >
          Surebets
        </button>
        <button
          onClick={() => onSelectTab('bookmakers_api')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'bookmakers_api' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
        >
          APIs Casas
        </button>
        <button
          onClick={() => onSelectTab('steam_moves')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'steam_moves' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
        >
          Dropping
        </button>
        <button
          onClick={() => onSelectTab('odds_matrix')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'odds_matrix' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
        >
          Matriz
        </button>
        <button
          onClick={() => onSelectTab('parlays')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'parlays' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
        >
          Combinadas
        </button>
        <button
          onClick={() => onSelectTab('tracker')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'tracker' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
        >
          Mi Cartera
        </button>
        <button
          onClick={() => onSelectTab('stadium_3d')}
          className={`px-3 py-1 rounded whitespace-nowrap ${activeTab === 'stadium_3d' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'}`}
        >
          Estadio 3D
        </button>
      </div>
    </header>
  );
};
