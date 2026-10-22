import React, { useState, useMemo } from 'react';
import { MatchEvent } from '../types/odds';
import { Table, TrendingDown, Clock, Activity, ArrowRight, Shield, Layers } from 'lucide-react';
import { calculateOverround } from '../utils/mathEngine';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface OddsMatrixViewProps {
  matches: MatchEvent[];
  selectedMatchId?: string;
}

type MarketSelection = 'home' | 'draw' | 'away';

interface HistoryPoint {
  time: string;
  hour: number;
  Pinnacle: number;
  Bet365: number;
  WilliamHill: number;
  Bwin: number;
  OneXBet: number;
  Mediana: number;
}

export const OddsMatrixView: React.FC<OddsMatrixViewProps> = ({ matches, selectedMatchId }) => {
  const [activeMatchId, setActiveMatchId] = useState<string>(selectedMatchId || matches[0]?.id || '');
  const [selectedMarket, setSelectedMarket] = useState<MarketSelection>('home');

  const currentMatch = matches.find((m) => m.id === activeMatchId) || matches[0];

  // Aggregate quotes per bookmaker for the matrix table
  const bookmakerRows = useMemo(() => {
    if (!currentMatch) return [];

    const rows = currentMatch.quotes.home.map((homeQuote, idx) => {
      const drawQuote = currentMatch.quotes.draw[idx] || { price: 1.0, bookmakerName: homeQuote.bookmakerName, isSharp: homeQuote.isSharp };
      const awayQuote = currentMatch.quotes.away[idx] || { price: 1.0, bookmakerName: homeQuote.bookmakerName, isSharp: homeQuote.isSharp };

      const overround = calculateOverround(homeQuote.price, drawQuote.price, awayQuote.price);

      return {
        bookmakerId: homeQuote.bookmakerId,
        bookmakerName: homeQuote.bookmakerName,
        isSharp: homeQuote.isSharp,
        home: homeQuote.price,
        draw: drawQuote.price,
        away: awayQuote.price,
        overround,
        lastUpdated: homeQuote.lastUpdated,
      };
    });

    rows.sort((a, b) => a.overround - b.overround);
    return rows;
  }, [currentMatch]);

  // Generate 24h historical odds movement data for the line chart
  const historicalData = useMemo<HistoryPoint[]>(() => {
    if (!currentMatch) return [];

    const marketQuotes = currentMatch.quotes[selectedMarket] || [];
    const currentOdds = {
      Pinnacle: marketQuotes.find((q) => q.bookmakerId === 'pinnacle')?.price || currentMatch.bestOdds[selectedMarket]?.price || 2.0,
      Bet365: marketQuotes.find((q) => q.bookmakerId === 'bet365')?.price || 1.95,
      WilliamHill: marketQuotes.find((q) => q.bookmakerId === 'williamhill')?.price || 1.92,
      Bwin: marketQuotes.find((q) => q.bookmakerId === 'bwin')?.price || 1.90,
      OneXBet: marketQuotes.find((q) => q.bookmakerId === 'onexbet')?.price || 2.05,
      Mediana: currentMatch.medianOdds[selectedMarket] || 1.95,
    };

    // Check if match had a steam drop in this market
    const hasSteamDrop = currentMatch.steamMoves.some(
      (s) =>
        (selectedMarket === 'home' && s.selection === 'Local') ||
        (selectedMarket === 'draw' && s.selection === 'Empate') ||
        (selectedMarket === 'away' && s.selection === 'Visitante')
    );

    // Opening multiplier 24 hours ago
    const openingDrift = hasSteamDrop ? 0.08 : (Math.sin(currentMatch.homeTeam.length) * 0.04);

    const timeSteps = [
      { label: '-24h', hoursAgo: 24, factorPinnacle: 1 + openingDrift, factorSquare: 1 + openingDrift },
      { label: '-20h', hoursAgo: 20, factorPinnacle: 1 + openingDrift * 0.9, factorSquare: 1 + openingDrift },
      { label: '-16h', hoursAgo: 16, factorPinnacle: 1 + openingDrift * 0.8, factorSquare: 1 + openingDrift * 0.95 },
      { label: '-12h', hoursAgo: 12, factorPinnacle: 1 + openingDrift * 0.65, factorSquare: 1 + openingDrift * 0.9 },
      { label: '-8h', hoursAgo: 8, factorPinnacle: 1 + openingDrift * 0.45, factorSquare: 1 + openingDrift * 0.8 },
      { label: '-4h', hoursAgo: 4, factorPinnacle: 1 + openingDrift * 0.1, factorSquare: 1 + openingDrift * 0.5 }, // Pinnacle moves first
      { label: '-2h', hoursAgo: 2, factorPinnacle: 1.0, factorSquare: 1 + openingDrift * 0.25 }, // Recreational lags
      { label: '-1h', hoursAgo: 1, factorPinnacle: 1.0, factorSquare: 1 + openingDrift * 0.1 },
      { label: 'Ahora', hoursAgo: 0, factorPinnacle: 1.0, factorSquare: 1.0 },
    ];

    return timeSteps.map((step) => {
      const pin = Number((currentOdds.Pinnacle * step.factorPinnacle).toFixed(2));
      const b365 = Number((currentOdds.Bet365 * step.factorSquare).toFixed(2));
      const wh = Number((currentOdds.WilliamHill * (step.factorSquare * 0.99)).toFixed(2));
      const bwin = Number((currentOdds.Bwin * (step.factorSquare * 0.985)).toFixed(2));
      const onex = Number((currentOdds.OneXBet * (step.factorSquare * 1.01)).toFixed(2));
      const med = Number(((pin + b365 + wh + bwin + onex) / 5).toFixed(2));

      return {
        time: step.label,
        hour: step.hoursAgo,
        Pinnacle: pin,
        Bet365: b365,
        WilliamHill: wh,
        Bwin: bwin,
        OneXBet: onex,
        Mediana: med,
      };
    });
  }, [currentMatch, selectedMarket]);

  if (!currentMatch) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        No hay partidos cargados para comparar.
      </div>
    );
  }

  const bestHome = Math.max(...bookmakerRows.map((r) => r.home));
  const bestDraw = Math.max(...bookmakerRows.map((r) => r.draw));
  const bestAway = Math.max(...bookmakerRows.map((r) => r.away));

  // Chart min and max calculations
  const allValues = historicalData.flatMap((d) => [d.Pinnacle, d.Bet365, d.WilliamHill, d.Bwin, d.OneXBet]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const yDomainMin = Math.max(1.0, Number((minVal - 0.08).toFixed(2)));
  const yDomainMax = Number((maxVal + 0.08).toFixed(2));

  const openingPrice = historicalData[0]?.Pinnacle || 1.0;
  const currentPrice = historicalData[historicalData.length - 1]?.Pinnacle || 1.0;
  const priceChangePct = Number((((currentPrice - openingPrice) / openingPrice) * 100).toFixed(1));

  const marketLabels: Record<MarketSelection, string> = {
    home: `1 (${currentMatch.homeTeam})`,
    draw: 'X (Empate)',
    away: `2 (${currentMatch.awayTeam})`,
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-800 p-3 rounded-lg shadow-xl text-xs font-mono space-y-1.5">
          <div className="font-bold text-white font-sans text-xs border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
            <span>Tiempo: {label}</span>
            <span className="text-slate-400 text-[11px] font-normal font-sans">Mercado {marketLabels[selectedMarket]}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
            {payload.map((entry: any) => (
              <div key={entry.name} className="flex items-center justify-between gap-2">
                <span style={{ color: entry.color }} className="font-sans text-[11px]">
                  {entry.name}:
                </span>
                <span className="font-bold text-white tabular-nums">{Number(entry.value).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <Table className="w-4 h-4 text-emerald-400" />
              <span>Matriz Comparativa & Histórico de Cuotas (24h)</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Análisis Transversal y Dinámica Temporal de Precios
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Compara cuotas en tiempo real entre casas de referencia Sharp y recreativas, e inspecciona la evolución histórica de las últimas 24 horas para detectar dinero inteligente y desfases de ajuste.
            </p>
          </div>

          <div className="w-full md:w-80 shrink-0">
            <label className="text-xs font-semibold text-slate-400 block mb-1">Seleccionar Partido:</label>
            <select
              value={activeMatchId}
              onChange={(e) => setActiveMatchId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 font-sans"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.homeTeam} vs {m.awayTeam} ({m.competitionName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Match Overview Ribbon */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div>
          <span className="text-slate-500">Competición:</span>{' '}
          <strong className="text-white">{currentMatch.competitionName}</strong> ·{' '}
          <span className="text-slate-400">{new Date(currentMatch.commenceTime).toLocaleString('es-ES')}</span>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-500">Overround Mediana:</span>{' '}
            <strong className="text-slate-200 font-mono">{currentMatch.overroundMedian}%</strong>
          </div>
          <div>
            <span className="text-slate-500">Mejor Combinado:</span>{' '}
            <strong className="text-emerald-400 font-mono">{currentMatch.overroundBest}%</strong>
          </div>
        </div>
      </div>

      {/* RECHARTS LINE CHART: 24-HOUR HISTORICAL ODDS MOVEMENT */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        {/* Chart Controls & Market Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Evolución Histórica de Cuotas (24 Horas)</span>
                <span className="text-xs font-normal text-slate-500 font-mono">
                  [Recharts Engine]
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Comportamiento de apertura frente a cierre reciente por casa de apuestas
              </p>
            </div>
          </div>

          {/* Market Selection Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setSelectedMarket('home')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedMarket === 'home'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1 ({currentMatch.homeTeam})
            </button>
            <button
              onClick={() => setSelectedMarket('draw')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedMarket === 'draw'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              X (Empate)
            </button>
            <button
              onClick={() => setSelectedMarket('away')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                selectedMarket === 'away'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2 ({currentMatch.awayTeam})
            </button>
          </div>
        </div>

        {/* 24h Metrics Strip for Selected Market */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Cuota Apertura (hace 24h):</span>
            <span className="text-slate-200 font-mono font-bold text-sm">{openingPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Cuota Actual (Pinnacle):</span>
            <span className="text-white font-mono font-bold text-sm">{currentPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Variación Sharp 24h:</span>
            <span
              className={`font-mono font-bold text-sm ${
                priceChangePct < 0 ? 'text-rose-400' : priceChangePct > 0 ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              {priceChangePct > 0 ? `+${priceChangePct}%` : `${priceChangePct}%`}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Rango Registrado:</span>
            <span className="text-slate-300 font-mono text-xs">
              {minVal.toFixed(2)} - {maxVal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Responsive Recharts LineChart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                domain={[yDomainMin, yDomainMax]}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) => Number(val).toFixed(2)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                iconType="circle"
              />
              {/* Pinnacle - Sharp Benchmark Line */}
              <Line
                type="monotone"
                dataKey="Pinnacle"
                name="Pinnacle (Sharp)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#38bdf8' }}
                activeDot={{ r: 6 }}
              />
              {/* Bet365 Line */}
              <Line
                type="monotone"
                dataKey="Bet365"
                name="Bet365"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#10b981' }}
              />
              {/* William Hill Line */}
              <Line
                type="monotone"
                dataKey="WilliamHill"
                name="William Hill"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#f59e0b' }}
              />
              {/* Bwin Line */}
              <Line
                type="monotone"
                dataKey="Bwin"
                name="Bwin"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#a855f7' }}
              />
              {/* 1xBet Line */}
              <Line
                type="monotone"
                dataKey="OneXBet"
                name="1xBet"
                stroke="#f43f5e"
                strokeWidth={1.8}
                dot={{ r: 2, fill: '#f43f5e' }}
              />
              {/* Consensus Median Line */}
              <Line
                type="monotone"
                dataKey="Mediana"
                name="Mediana Consenso"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
            <span>Pinnacle (línea azul sólida) ajusta primero cuando entra liquidez profesional.</span>
          </div>
          <span>Las líneas recreativas que se mantienen altas tras una caída sharp indican valor (EV+).</span>
        </div>
      </div>

      {/* Full Bookmakers Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-white">Tabla de Precios por Casa en Tiempo Real</span>
          <span>10 casas comparadas simultáneamente</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3 px-4">Casa de Apuestas</th>
                <th className="py-3 px-4 text-center">Tipo</th>
                <th className="py-3 px-4 text-center">1 ({currentMatch.homeTeam})</th>
                <th className="py-3 px-4 text-center">X (Empate)</th>
                <th className="py-3 px-4 text-center">2 ({currentMatch.awayTeam})</th>
                <th className="py-3 px-4 text-center">Margen Overround</th>
                <th className="py-3 px-4 text-right">Actualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {bookmakerRows.map((row) => {
                const isBestH = row.home === bestHome;
                const isBestD = row.draw === bestDraw;
                const isBestA = row.away === bestAway;

                return (
                  <tr key={row.bookmakerId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                      <span>{row.bookmakerName}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      {row.isSharp ? (
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                          SHARP BENCHMARK
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                          Recreativa
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded ${
                          isBestH
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                            : 'text-slate-200'
                        }`}
                      >
                        {row.home.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded ${
                          isBestD
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                            : 'text-slate-200'
                        }`}
                      >
                        {row.draw.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded ${
                          isBestA
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                            : 'text-slate-200'
                        }`}
                      >
                        {row.away.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-semibold ${
                          row.overround <= 3.5
                            ? 'text-emerald-400'
                            : row.overround <= 5.5
                            ? 'text-slate-300'
                            : 'text-amber-400'
                        }`}
                      >
                        {row.overround.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      {new Date(row.lastUpdated).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-950/70 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-400" />
            <span>Verde resaltado indica la cuota máxima disponible en el mercado.</span>
          </div>
          <span>Pinnacle y Betfair marcan la línea más justa con menor comisión.</span>
        </div>
      </div>
    </div>
  );
};
