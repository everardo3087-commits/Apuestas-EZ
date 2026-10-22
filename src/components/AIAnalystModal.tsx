import React, { useState, useEffect } from 'react';
import { MatchEvent, AIAnalysisResult } from '../types/odds';
import { X, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign, Brain, PlusCircle } from 'lucide-react';

interface AIAnalystModalProps {
  match: MatchEvent | null;
  bankroll: number;
  riskProfile: string;
  onClose: () => void;
  onAddToTracker: (match: MatchEvent, selection: string, odds: number, bookmaker: string, stake: number, ev: number, prob: number) => void;
}

export const AIAnalystModal: React.FC<AIAnalystModalProps> = ({
  match,
  bankroll,
  riskProfile,
  onClose,
  onAddToTracker,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!match) return;

    let isMounted = true;
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/ai/analyze-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ match, bankroll, riskProfile }),
        });

        if (!response.ok) {
          throw new Error('Error al conectar con el motor de IA');
        }

        const data = await response.json();
        if (isMounted) {
          setAnalysis(data.result);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'No se pudo generar el análisis');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAnalysis();

    return () => {
      isMounted = false;
    };
  }, [match, bankroll, riskProfile]);

  if (!match) return null;

  const verdictColors = {
    APOSTAR: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    CONSIDERAR: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    OBSERVAR: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    DESCARTAR: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-8">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                <span>Analista Cuantitativo Gemini</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Model: gemini-3.8-flash</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {match.homeTeam} vs {match.awayTeam}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="font-semibold text-white text-sm">Analizando cuotas y liquidez con Gemini 3.8 Flash...</div>
              <p className="text-slate-400 max-w-sm mx-auto text-xs">
                Evaluando divergencia entre casas Sharp (Pinnacle) y casas recreativas, vig-free math, volumen y condiciones climáticas.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300">
              <div className="font-bold mb-1">Error en análisis</div>
              <div>{error}</div>
            </div>
          ) : analysis ? (
            <>
              {/* Verdict Ribbon */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold">Veredicto del Analista:</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span
                      className={`text-sm font-extrabold px-3 py-1 rounded-lg border font-mono tracking-wide ${
                        verdictColors[analysis.verdict] || verdictColors.OBSERVAR
                      }`}
                    >
                      {analysis.verdict === 'APOSTAR' && '🟢 '}
                      {analysis.verdict === 'CONSIDERAR' && '🟡 '}
                      {analysis.verdict === 'OBSERVAR' && '🟠 '}
                      {analysis.verdict === 'DESCARTAR' && '🔴 '}
                      {analysis.verdict}
                    </span>
                    <span className="text-slate-300 font-medium">
                      Confianza: <strong className="font-mono text-white">{analysis.confidenceScore}/100</strong> · Riesgo: <strong className="text-white">{analysis.riskRating}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <div className="text-[11px] text-slate-400">Recomendación Puntual:</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    <strong className="text-emerald-400">{analysis.recommendedSelection}</strong> @{analysis.recommendedOdds.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Casa: <strong className="text-slate-200">{analysis.recommendedBookmaker}</strong> · Stake: <strong className="font-mono text-white">${analysis.recommendedKellyStake.toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Key Edges */}
              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ventajas y Señales Cuantitativas (Key Edges):</span>
                </h4>
                <div className="space-y-1.5">
                  {analysis.keyEdges.map((edge, idx) => (
                    <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg flex items-start gap-2 text-slate-300">
                      <span className="text-emerald-400 font-bold font-mono">0{idx + 1}.</span>
                      <span>{edge}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Factores de Riesgo & Advertencias:</span>
                </h4>
                <div className="space-y-1.5">
                  {analysis.riskFactors.map((risk, idx) => (
                    <div key={idx} className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg flex items-start gap-2 text-slate-400">
                      <span className="text-amber-400 font-bold font-mono">!</span>
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tactical & Quantitative Analysis Prose */}
              <div className="space-y-2">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Análisis Táctico y de Mercado:
                </h4>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 leading-relaxed text-xs">
                  {analysis.tacticalAnalysis}
                </div>
              </div>

              {/* Sharp vs Recreational Summary */}
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200">
                <div className="font-bold text-[11px] uppercase tracking-wider text-blue-300 mb-1">
                  Comportamiento Sharp vs Recreativo (Pinnacle vs Resto):
                </div>
                <div>{analysis.sharpMarketSummary}</div>
              </div>

              {/* Action Button inside modal */}
              {analysis.verdict !== 'DESCARTAR' && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      onAddToTracker(
                        match,
                        analysis.recommendedSelection,
                        analysis.recommendedOdds,
                        analysis.recommendedBookmaker,
                        analysis.recommendedKellyStake,
                        match.highestEVValue || 5.0,
                        50.0
                      );
                      onClose();
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Anotar Recomendación de IA en mi Cartera (${analysis.recommendedKellyStake.toFixed(2)})</span>
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
