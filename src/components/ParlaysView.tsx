import React from 'react';
import { MatchEvent } from '../types/odds';
import { Layers, Sparkles, PlusCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ParlaysViewProps {
  matches: MatchEvent[];
  bankroll: number;
  smallBankrollMode: boolean;
  onAddParlayToTracker?: (title: string, odds: number, stake: number, ev: number, prob: number) => void;
}

export const ParlaysView: React.FC<ParlaysViewProps> = ({
  matches,
  bankroll,
  smallBankrollMode,
  onAddParlayToTracker,
}) => {
  // Extract all single picks with positive EV
  const candidates: Array<{
    match: MatchEvent;
    selection: 'Local' | 'Empate' | 'Visitante';
    team: string;
    odds: number;
    prob: number;
    ev: number;
    bookmaker: string;
  }> = [];

  matches.forEach((m) => {
    const list = [
      { sel: 'Local' as const, team: m.homeTeam, odds: m.bestOdds.home.price, prob: m.fairProbabilities.home, ev: m.expectedValues.home, book: m.bestOdds.home.bookmakerName },
      { sel: 'Empate' as const, team: 'Empate', odds: m.bestOdds.draw.price, prob: m.fairProbabilities.draw, ev: m.expectedValues.draw, book: m.bestOdds.draw.bookmakerName },
      { sel: 'Visitante' as const, team: m.awayTeam, odds: m.bestOdds.away.price, prob: m.fairProbabilities.away, ev: m.expectedValues.away, book: m.bestOdds.away.bookmakerName },
    ];
    const best = list.reduce((prev, curr) => (curr.ev > prev.ev ? curr : prev));
    if (best.ev > 2.0) {
      candidates.push({
        match: m,
        selection: best.sel,
        team: best.team,
        odds: best.odds,
        prob: best.prob,
        ev: best.ev,
        bookmaker: best.book,
      });
    }
  });

  // Build 2-leg Doubles from different matches
  const doubleParlays: Array<{
    id: string;
    legs: typeof candidates;
    combinedOdds: number;
    combinedProbPct: number;
    combinedEvPct: number;
    suggestedStake: number;
  }> = [];

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const leg1 = candidates[i];
      const leg2 = candidates[j];
      if (leg1.match.id === leg2.match.id) continue;

      const combinedOdds = Number((leg1.odds * leg2.odds).toFixed(2));
      const p1 = leg1.prob / 100;
      const p2 = leg2.prob / 100;
      const combinedProb = p1 * p2;
      const combinedEv = (combinedProb * combinedOdds - 1) * 100;

      if (combinedEv > 3.0 && combinedOdds <= (smallBankrollMode ? 4.5 : 8.0)) {
        let stake = Number((bankroll * (combinedEv / 100) * 0.15).toFixed(2));
        if (smallBankrollMode) stake = Math.min(stake, 0.75);
        if (stake < 0.25) stake = 0.50;

        doubleParlays.push({
          id: `parlay-${leg1.match.id}-${leg2.match.id}`,
          legs: [leg1, leg2],
          combinedOdds,
          combinedProbPct: Number((combinedProb * 100).toFixed(1)),
          combinedEvPct: Number(combinedEv.toFixed(1)),
          suggestedStake: Math.min(stake, bankroll * 0.05),
        });
      }
    }
  }

  // Sort by highest combined EV
  doubleParlays.sort((a, b) => b.combinedEvPct - a.combinedEvPct);
  const topParlays = doubleParlays.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 mb-1">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Generador de Combinadas con EV+ Joint</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Combinadas Matemáticas (Dobles Seleccionadas)
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Las combinadas multiplican el margen del bookmaker si se eligen selecciones aleatorias. Sin embargo, combinando 2 selecciones de partidos independientes que ya poseen valor esperado individual positivo (EV+), el valor acumulado se potencia. En Modo Bankroll Pequeño se limitan a cuotas totales menores a 4.50 para proteger el capital.
        </p>
      </div>

      {topParlays.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          No hay suficientes selecciones individuales con EV+ para formar combinadas seguras en este momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topParlays.map((parlay, idx) => {
            const parlayTitle = `Doble #${idx + 1}: ${parlay.legs[0].match.homeTeam} + ${parlay.legs[1].match.homeTeam}`;

            return (
              <div
                key={parlay.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center font-mono">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-white text-sm">Apuesta Doble Estratégica</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold">
                        EV: +{parlay.combinedEvPct}%
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-slate-800 font-mono font-bold text-white text-xs">
                        Cuota: {parlay.combinedOdds.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Legs */}
                  <div className="space-y-3 mb-4">
                    {parlay.legs.map((leg, lIdx) => (
                      <div key={lIdx} className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-lg text-xs">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-slate-500 font-mono text-[11px]">{leg.match.competitionName}</span>
                          <span className="text-emerald-400 font-semibold font-mono text-[11px]">+{(leg.ev).toFixed(1)}% EV individual</span>
                        </div>
                        <div className="flex items-baseline justify-between font-medium">
                          <span className="text-white font-bold">{leg.match.homeTeam} vs {leg.match.awayTeam}</span>
                          <span className="text-emerald-300 font-mono font-bold">@{leg.odds.toFixed(2)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>Pick: <strong className="text-slate-200">{leg.selection} ({leg.team})</strong></span>
                          <span>Casa: <strong className="text-slate-300">{leg.bookmaker}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Math */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 text-slate-400 mb-4 font-mono">
                    <div>
                      Probabilidad Conjunta: <strong className="text-slate-200">{parlay.combinedProbPct}%</strong>
                    </div>
                    <div>
                      Stake Sugerido: <strong className="text-white">${parlay.suggestedStake.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Retorno potencial:{' '}
                    <strong className="text-emerald-400 font-mono font-bold">
                      ${(parlay.suggestedStake * parlay.combinedOdds).toFixed(2)}
                    </strong>
                  </div>

                  {onAddParlayToTracker && (
                    <button
                      onClick={() =>
                        onAddParlayToTracker(
                          parlayTitle,
                          parlay.combinedOdds,
                          parlay.suggestedStake,
                          parlay.combinedEvPct,
                          parlay.combinedProbPct
                        )
                      }
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Anotar Combinada</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
