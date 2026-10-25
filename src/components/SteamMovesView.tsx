import React from 'react';
import { SteamMove } from '../types/odds';
import { TrendingDown, ArrowDownRight, Activity, AlertTriangle, Clock } from 'lucide-react';
import { getPanamaTimeString } from '../utils/dateUtils';

interface SteamMovesViewProps {
  steamMoves: SteamMove[];
  onSelectMatch?: (matchId: string) => void;
}

export const SteamMovesView: React.FC<SteamMovesViewProps> = ({ steamMoves, onSelectMatch }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-400 mb-1">
          <Activity className="w-4 h-4 text-rose-400" />
          <span>Monitor de Líneas en Caída (Dropping Odds & Steam Moves)</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Seguimiento de Dinero Inteligente (Sharp Action)
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Un «Steam Move» ocurre cuando las casas de referencia sharp (Pinnacle o Betfair) desploman bruscamente una cuota debido a un gran volumen de apuestas profesionales o noticias de última hora (alineaciones, lesiones, clima). Las casas recreativas suelen tardar entre 2 y 10 minutos en replicar el movimiento, dejando cuotas infladas de alto valor.
        </p>
      </div>

      {steamMoves.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No hay caídas bruscas en los últimos minutos</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            El escáner analiza cada variación superior al 3.5% entre actualizaciones. En cuanto un bookmaker sharp ajuste agresivamente una línea, aparecerá de inmediato en este panel.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Detectados <strong className="text-white">{steamMoves.length}</strong> movimientos bruscos recientes
            </span>
            <span className="font-mono text-[11px] text-rose-400 font-semibold">Umbral: Caída ≥ 3.5%</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {steamMoves.map((move) => {
              const time = `${getPanamaTimeString(move.timestamp)} (Panamá)`;

              return (
                <div
                  key={move.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                      <TrendingDown className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-white text-sm">{move.matchTitle}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400 font-medium">Selección: <strong className="text-emerald-400">{move.selection}</strong></span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>Casa: <strong className="text-slate-300">{move.bookmaker}</strong></span>
                        <span className="text-slate-600">·</span>
                        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                          <Clock className="w-3 h-3" /> {time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {/* Odds transition */}
                    <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs flex items-center gap-2">
                      <span className="text-slate-400 line-through">{move.previousOdds.toFixed(2)}</span>
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-400 font-bold text-sm">{move.currentOdds.toFixed(2)}</span>
                    </div>

                    {/* Percentage drop badge */}
                    <div className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono font-bold text-xs">
                      -{move.dropPercentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
