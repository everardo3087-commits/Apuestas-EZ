import React, { useState } from 'react';
import { SurebetOpportunity } from '../types/odds';
import { Target, Calculator, CheckCircle2, ShieldCheck, ArrowRight, DollarSign, AlertCircle, Bell } from 'lucide-react';

interface SurebetsViewProps {
  surebets: SurebetOpportunity[];
  bankroll: number;
  onRegisterSurebet?: (surebet: SurebetOpportunity, totalStake: number) => void;
  onOpenNotificationSettings?: () => void;
  notificationThreshold?: number;
}

export const SurebetsView: React.FC<SurebetsViewProps> = ({
  surebets,
  bankroll,
  onRegisterSurebet,
  onOpenNotificationSettings,
  notificationThreshold = 1.5,
}) => {
  const [targetStake, setTargetStake] = useState<number>(Math.min(100, Math.max(10, bankroll)));

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Arbitraje Deportivo Puro (Surebets)</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Riesgo Matemático Cero</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Oportunidades de Beneficio Garantizado
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Una surebet se produce cuando la suma de las probabilidades inversas de las mejores cuotas en diferentes casas es menor al 100% (overround negativo). Distribuyendo la inversión proporcionalmente, se obtiene exactamente el mismo retorno sin importar el desenlace del encuentro.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {onOpenNotificationSettings && (
              <button
                onClick={onOpenNotificationSettings}
                className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-700/80 hover:border-amber-400/50 rounded-lg text-xs font-medium text-slate-200 transition-colors"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Alertas: <strong className="text-amber-400 font-mono">≥ {notificationThreshold}%</strong></span>
              </button>
            )}

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
              <Calculator className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-[11px] text-slate-400">Inversión a Distribuir:</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-slate-400 font-mono text-sm">$</span>
                  <input
                    type="number"
                    min="5"
                    max="5000"
                    step="5"
                    value={targetStake}
                    onChange={(e) => setTargetStake(Math.max(5, Number(e.target.value) || 10))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm font-bold font-mono text-white text-right focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {surebets.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No hay surebets activas en este milisegundo</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Las oportunidades de arbitraje suelen durar entre 2 y 15 minutos antes de que las casas corrijan sus cuotas. Mantén activo el Ticker En Vivo para que el escáner alerte tan pronto surja una discrepancia.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {surebets.map((surebet) => {
            // Recompute legs based on active targetStake
            const invSum = surebet.legs.reduce((acc, leg) => acc + (1 / leg.odds), 0);
            const targetReturn = Number((targetStake / invSum).toFixed(2));
            const guaranteedProfit = Number((targetReturn - targetStake).toFixed(2));
            const calculatedProfitPct = Number(((targetReturn / targetStake - 1) * 100).toFixed(2));

            const dynamicLegs = surebet.legs.map((leg) => {
              const stakeAmount = Number((( (1 / leg.odds) / invSum ) * targetStake).toFixed(2));
              return {
                ...leg,
                stakeAmount,
                returnAmount: Number((stakeAmount * leg.odds).toFixed(2)),
              };
            });

            return (
              <div
                key={surebet.id}
                className="bg-slate-900 border border-amber-500/40 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Header */}
                <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-amber-400">{surebet.competitionName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">Mercado 1X2</span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">{surebet.matchTitle}</h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[11px] text-slate-400">Beneficio Neto Garantizado:</div>
                      <div className="text-base font-extrabold text-emerald-400 font-mono">
                        +${guaranteedProfit.toFixed(2)}{' '}
                        <span className="text-xs font-semibold">(+{calculatedProfitPct}%)</span>
                      </div>
                    </div>

                    {onRegisterSurebet && (
                      <button
                        onClick={() => onRegisterSurebet(surebet, targetStake)}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Anotar Arbitraje</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Calculator Legs Table */}
                <div className="p-5">
                  <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                    <span>Instrucciones de Colocación de Apuestas:</span>
                    <span className="text-slate-500 font-mono text-[11px]">Suma Inversa: {(invSum * 100).toFixed(2)}% (&lt; 100%)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {dynamicLegs.map((leg, index) => (
                      <div
                        key={index}
                        className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-lg text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{leg.selection}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                            Cuota: {leg.odds.toFixed(2)}
                          </span>
                        </div>

                        <div className="text-slate-400">
                          Casa requerida: <strong className="text-emerald-400 font-semibold">{leg.bookmaker}</strong>
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <span className="text-slate-400">Apostar en {leg.bookmaker}:</span>
                          <span className="text-base font-extrabold text-white font-mono">
                            ${leg.stakeAmount.toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Retorno si acierta:</span>
                          <span className="font-mono text-slate-300 font-semibold">
                            ${leg.returnAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between text-xs text-amber-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Colocando estas tres apuestas simultáneamente, recuperas <strong className="font-mono">${targetReturn.toFixed(2)}</strong> asegurando un beneficio de <strong className="font-mono">+${guaranteedProfit.toFixed(2)}</strong>.
                      </span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px] hidden sm:inline">Sin riesgo deportivo</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
