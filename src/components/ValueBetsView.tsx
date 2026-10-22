import React from 'react';
import { MatchEvent } from '../types/odds';
import { TrendingUp, Sparkles, PlusCircle, ArrowUpRight, CloudSun, Shield, AlertCircle, Box } from 'lucide-react';

interface ValueBetsViewProps {
  matches: MatchEvent[];
  minEvThreshold: number;
  bankroll: number;
  smallBankrollMode: boolean;
  onAnalyzeMatch: (match: MatchEvent) => void;
  onAddToTracker: (match: MatchEvent, selection: 'Local' | 'Empate' | 'Visitante', odds: number, bookmaker: string, stake: number, ev: number, prob: number) => void;
  onViewAllOdds: (match: MatchEvent) => void;
  onViewStadium?: (match: MatchEvent) => void;
}

export const ValueBetsView: React.FC<ValueBetsViewProps> = ({
  matches,
  minEvThreshold,
  bankroll,
  smallBankrollMode,
  onAnalyzeMatch,
  onAddToTracker,
  onViewAllOdds,
  onViewStadium,
}) => {
  // Filter matches that have at least one selection meeting min EV threshold
  const valueMatches = matches.filter((m) => {
    const maxEv = Math.max(m.expectedValues.home, m.expectedValues.draw, m.expectedValues.away);
    return maxEv >= minEvThreshold;
  });

  if (valueMatches.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">No hay líneas con EV ≥ {minEvThreshold.toFixed(1)}%</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Las cuotas actuales de las casas de apuestas están alineadas con el consenso sin margen. Prueba cambiar el perfil de riesgo a «Agresivo» o actualizar las cuotas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Mostrando <strong className="text-white">{valueMatches.length}</strong> partidos con valor esperado positivo (EV ≥ {minEvThreshold}%)
        </span>
        <span className="text-[11px] text-slate-500">
          Calculado contra consenso Sharp sin margen (Pinnacle/Betfair)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {valueMatches.map((match) => {
          const outcomes = [
            {
              key: 'Local' as const,
              team: match.homeTeam,
              best: match.bestOdds.home,
              prob: match.fairProbabilities.home,
              ev: match.expectedValues.home,
              confidence: match.confidence.home,
            },
            {
              key: 'Empate' as const,
              team: 'Empate',
              best: match.bestOdds.draw,
              prob: match.fairProbabilities.draw,
              ev: match.expectedValues.draw,
              confidence: match.confidence.draw,
            },
            {
              key: 'Visitante' as const,
              team: match.awayTeam,
              best: match.bestOdds.away,
              prob: match.fairProbabilities.away,
              ev: match.expectedValues.away,
              confidence: match.confidence.away,
            },
          ];

          const topOutcome = outcomes.reduce((prev, curr) => (curr.ev > prev.ev ? curr : prev));
          const hasSteam = match.steamMoves && match.steamMoves.length > 0;

          // Compute recommended stake
          let suggestedStake = Number((bankroll * (topOutcome.ev / 100) * 0.25).toFixed(2));
          if (smallBankrollMode) {
            suggestedStake = Math.min(suggestedStake, 1.00);
            if (suggestedStake < 0.25) suggestedStake = 0.50;
          }
          if (suggestedStake <= 0) suggestedStake = 1.00;

          const kickoffDate = new Date(match.commenceTime);
          const timeFormatted = kickoffDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          const dateFormatted = kickoffDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

          return (
            <div
              key={match.id}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700/80 transition-all shadow-sm"
            >
              {/* Card Header */}
              <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-emerald-400">{match.competitionName}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 capitalize">{dateFormatted} a las {timeFormatted}</span>
                  {match.weather && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                        {match.weather.temperature}°C {match.weather.condition}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {hasSteam && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 rotate-180" /> Steam Move Detectado
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400">
                    Overround: <strong className="text-slate-200">{match.overroundMedian}%</strong>
                  </span>
                </div>
              </div>

              {/* Match Teams & Primary EV Highlight */}
              <div className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Teams Title */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <span>{match.homeTeam}</span>
                      <span className="text-slate-500 text-sm font-normal">vs</span>
                      <span>{match.awayTeam}</span>
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>Estadio: {match.venue || 'Estadio oficial'}</span>
                      <span className="text-slate-600">·</span>
                      <span>{match.bookmakersCount} casas comparadas</span>
                    </div>

                    {/* API-Football Team Form Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1.5 text-[11px] text-slate-400">
                      <span className="text-slate-500 font-mono">Forma Local:</span>
                      <span className="flex items-center gap-0.5">
                        {['W', 'W', 'D', 'W', 'L'].map((res, i) => (
                          <span
                            key={i}
                            className={`w-3.5 h-3.5 rounded text-[9px] font-mono font-bold flex items-center justify-center ${
                              res === 'W'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : res === 'D'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {res}
                          </span>
                        ))}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500 font-mono">Visitante:</span>
                      <span className="flex items-center gap-0.5">
                        {['L', 'D', 'W', 'W', 'D'].map((res, i) => (
                          <span
                            key={i}
                            className={`w-3.5 h-3.5 rounded text-[9px] font-mono font-bold flex items-center justify-center ${
                              res === 'W'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : res === 'D'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {res}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>

                  {/* Right: Best Recommendation Action Callout */}
                  <div className="bg-slate-950/80 border border-emerald-500/30 rounded-lg p-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                        Oportunidad de Mayor Valor
                      </div>
                      <div className="text-sm font-bold text-white mt-0.5 flex items-baseline gap-2">
                        <span>{topOutcome.key} ({topOutcome.team})</span>
                        <span className="text-emerald-400 font-mono text-base">@{topOutcome.best.price.toFixed(2)}</span>
                        <span className="text-xs text-slate-400 font-normal">en {topOutcome.best.bookmakerName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        EV: <strong className="text-emerald-400 font-mono">+{topOutcome.ev.toFixed(2)}%</strong> · Prob. Justa: <strong className="text-slate-200 font-mono">{topOutcome.prob}%</strong> · Stake sugerido: <strong className="text-white font-mono">${suggestedStake.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          onAddToTracker(
                            match,
                            topOutcome.key,
                            topOutcome.best.price,
                            topOutcome.best.bookmakerName,
                            suggestedStake,
                            topOutcome.ev,
                            topOutcome.prob
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Añadir a Cartera</span>
                      </button>

                      <button
                        onClick={() => onAnalyzeMatch(match)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md transition-colors border border-slate-700"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Análisis IA</span>
                      </button>

                      {onViewStadium && (
                        <button
                          onClick={() => onViewStadium(match)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 text-xs font-semibold rounded-md transition-colors border border-indigo-700/50"
                          title="Visualizar estadio táctico 3D"
                        >
                          <Box className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Estadio 3D</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1X2 Comparative Breakdown Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800/80">
                  {outcomes.map((item) => {
                    const isPositive = item.ev > 0;
                    return (
                      <div
                        key={item.key}
                        className={`p-3 rounded-lg border text-xs transition-colors ${
                          isPositive
                            ? 'bg-slate-950/70 border-emerald-500/40'
                            : 'bg-slate-950/30 border-slate-800/60 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="font-bold text-white">
                            {item.key}: {item.team}
                          </span>
                          <span className="text-[11px] text-slate-500">Confianza {item.confidence}</span>
                        </div>

                        <div className="flex items-baseline justify-between mt-2">
                          <div>
                            <span className="text-lg font-bold text-white font-mono">{item.best.price.toFixed(2)}</span>
                            <span className="text-[11px] text-slate-400 ml-1.5 font-sans">en {item.best.bookmakerName}</span>
                          </div>
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                              isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isPositive ? `+${item.ev.toFixed(1)}%` : `${item.ev.toFixed(1)}%`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800/50">
                          <span>Prob. real sin margen:</span>
                          <span className="font-mono text-slate-300 font-semibold">{item.prob.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Bar: View all bookmakers */}
                <div className="flex items-center justify-between mt-3 pt-3 text-xs text-slate-500">
                  <span>
                    Margen de calibración Sharp: <strong className="text-slate-300 font-mono">{match.overroundMedian}%</strong>
                  </span>
                  <button
                    onClick={() => onViewAllOdds(match)}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Ver matriz de las 10 casas para este partido</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
