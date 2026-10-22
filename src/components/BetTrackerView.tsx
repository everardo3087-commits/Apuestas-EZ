import React, { useState } from 'react';
import { PersonalBet } from '../types/odds';
import { Briefcase, CheckCircle, XCircle, Clock, Download, Plus, TrendingUp, DollarSign, Award } from 'lucide-react';
import { calculateCLV } from '../utils/mathEngine';

interface BetTrackerViewProps {
  bets: PersonalBet[];
  bankroll: number;
  onSettleBet: (betId: string, status: 'Ganada' | 'Perdida', closingOdds?: number) => void;
  onAddManualBet: (bet: Omit<PersonalBet, 'id' | 'dateUtc' | 'netProfit'>) => void;
  onDeleteBet: (betId: string) => void;
}

export const BetTrackerView: React.FC<BetTrackerViewProps> = ({
  bets,
  bankroll,
  onSettleBet,
  onAddManualBet,
  onDeleteBet,
}) => {
  const [closingOddsInput, setClosingOddsInput] = useState<{ [id: string]: string }>({});
  const [showAddForm, setShowAddForm] = useState(false);

  // Manual Form State
  const [matchName, setMatchName] = useState('');
  const [selection, setSelection] = useState('Local');
  const [competition, setCompetition] = useState('Liga MX');
  const [bookmaker, setBookmaker] = useState('Bet365');
  const [odds, setOdds] = useState('2.00');
  const [stake, setStake] = useState('2.50');
  const [ev, setEv] = useState('5.0');
  const [prob, setProb] = useState('52.0');

  // Performance Metrics
  const settled = bets.filter((b) => b.status === 'Ganada' || b.status === 'Perdida');
  const pending = bets.filter((b) => b.status === 'Pendiente');
  const totalStakeSettled = settled.reduce((acc, b) => acc + b.stake, 0);
  const totalNetProfit = settled.reduce((acc, b) => acc + b.netProfit, 0);
  const wins = settled.filter((b) => b.status === 'Ganada').length;
  const winRate = settled.length > 0 ? (wins / settled.length) * 100 : 0;
  const roi = totalStakeSettled > 0 ? (totalNetProfit / totalStakeSettled) * 100 : 0;

  const betsWithClv = bets.filter((b) => b.clvPct !== undefined && Number.isFinite(b.clvPct));
  const avgClv =
    betsWithClv.length > 0
      ? betsWithClv.reduce((acc, b) => acc + (b.clvPct || 0), 0) / betsWithClv.length
      : 0;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchName || Number(odds) <= 1 || Number(stake) <= 0) return;

    onAddManualBet({
      match: matchName,
      selection,
      competition,
      bookmaker,
      odds: Number(odds),
      stake: Number(stake),
      expectedValue: Number(ev),
      probability: Number(prob),
      status: 'Pendiente',
    });

    setMatchName('');
    setShowAddForm(false);
  };

  const exportCsv = () => {
    const headers = ['Fecha UTC', 'Competencia', 'Partido', 'Seleccion', 'Cuota', 'Stake', 'EV %', 'Prob %', 'Casa', 'Resultado', 'Ganancia Neta', 'Cuota Cierre', 'CLV %'];
    const rows = bets.map((b) => [
      b.dateUtc,
      `"${b.competition}"`,
      `"${b.match}"`,
      `"${b.selection}"`,
      b.odds.toFixed(2),
      b.stake.toFixed(2),
      b.expectedValue.toFixed(2),
      b.probability.toFixed(1),
      `"${b.bookmaker}"`,
      b.status,
      b.netProfit.toFixed(2),
      b.closingOdds ? b.closingOdds.toFixed(2) : '',
      b.clvPct !== undefined ? b.clvPct.toFixed(2) : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mis_apuestas_scanner_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Top Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <Briefcase className="w-4 h-4 text-emerald-400" />
              <span>Gestor de Cartera & Verificación de Ventaja (CLV)</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Registro y Auditoría de Apuestas Personales
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Registra automáticamente picks desde el escáner o manuales. Comprueba si estás batiendo a las casas mediante el <strong>CLV (Closing Line Value)</strong>: si tus cuotas son sistemáticamente más altas que la cuota de cierre final de Pinnacle, posees una ventaja matemática real a largo plazo.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Apuesta</span>
            </button>

            <button
              onClick={exportCsv}
              disabled={bets.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manual Entry Form */}
      {showAddForm && (
        <form onSubmit={handleManualSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Registrar Apuesta Manual en Tracker</h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 text-xs hover:text-white">
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Partido / Encuentro:</label>
              <input
                type="text"
                required
                placeholder="ej. Real Madrid vs Barcelona"
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Selección:</label>
              <input
                type="text"
                required
                placeholder="ej. Local, Over 2.5, etc."
                value={selection}
                onChange={(e) => setSelection(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Casa de Apuestas:</label>
              <input
                type="text"
                required
                value={bookmaker}
                onChange={(e) => setBookmaker(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Cuota Obtenida:</label>
              <input
                type="number"
                step="0.01"
                min="1.01"
                required
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Stake / Importe ($):</label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                required
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">EV Estimado (%):</label>
              <input
                type="number"
                step="0.1"
                value={ev}
                onChange={(e) => setEv(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Probabilidad Estimada (%):</label>
              <input
                type="number"
                step="0.1"
                value={prob}
                onChange={(e) => setProb(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
              >
                Guardar en Tracker
              </button>
            </div>
          </div>
        </form>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Apuestas</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">{bets.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">{pending.length} pendientes · {settled.length} liquidadas</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Beneficio Neto</div>
          <div className={`text-2xl font-extrabold font-mono mt-1 ${totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalNetProfit >= 0 ? `+$${totalNetProfit.toFixed(2)}` : `-$${Math.abs(totalNetProfit).toFixed(2)}`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">${totalStakeSettled.toFixed(2)} apostados</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">ROI / Rendimiento</div>
          <div className={`text-2xl font-extrabold font-mono mt-1 ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {roi >= 0 ? `+${roi.toFixed(1)}%` : `${roi.toFixed(1)}%`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Rentabilidad sobre stake</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Tasa de Acierto</div>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">{winRate.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-500 mt-1">{wins} ganadas de {settled.length}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 col-span-2 md:col-span-1">
          <div className="text-[11px] text-slate-400 uppercase font-semibold flex items-center justify-between">
            <span>CLV Promedio</span>
            <Award className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className={`text-2xl font-extrabold font-mono mt-1 ${avgClv >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
            {avgClv >= 0 ? `+${avgClv.toFixed(2)}%` : `${avgClv.toFixed(2)}%`}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ventaja contra cierre Pinnacle</div>
        </div>
      </div>

      {/* Bets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-white">Historial de Entradas</span>
          <span>Liquidación 1-click & registro de cuota de cierre</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Partido / Selección</th>
                <th className="py-3 px-4 text-center">Casa</th>
                <th className="py-3 px-4 text-center">Cuota</th>
                <th className="py-3 px-4 text-center">Stake</th>
                <th className="py-3 px-4 text-center">EV Estimado</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Cuota Cierre (CLV)</th>
                <th className="py-3 px-4 text-right">Ganancia</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {bets.map((bet) => {
                const dateStr = new Date(bet.dateUtc).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
                const isPending = bet.status === 'Pendiente';

                return (
                  <tr key={bet.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{dateStr}</td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-white text-xs">{bet.match}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>Pick: <strong className="text-emerald-400">{bet.selection}</strong></span>
                        <span className="text-slate-600">·</span>
                        <span>{bet.competition}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-sans text-slate-300">{bet.bookmaker}</td>
                    <td className="py-3 px-4 text-center font-bold text-white">{bet.odds.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center text-slate-300">${bet.stake.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center text-emerald-400">+{bet.expectedValue.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          bet.status === 'Ganada'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : bet.status === 'Perdida'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {bet.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {bet.closingOdds ? (
                        <div className="text-[11px]">
                          <span className="text-slate-200">{bet.closingOdds.toFixed(2)}</span>
                          <span className={`ml-1 font-semibold ${bet.clvPct && bet.clvPct >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                            ({bet.clvPct && bet.clvPct >= 0 ? `+${bet.clvPct}%` : `${bet.clvPct}%`})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Cierre"
                            value={closingOddsInput[bet.id] || ''}
                            onChange={(e) => setClosingOddsInput({ ...closingOddsInput, [bet.id]: e.target.value })}
                            className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] text-right text-slate-200"
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {bet.status === 'Ganada' ? (
                        <span className="text-emerald-400">+${bet.netProfit.toFixed(2)}</span>
                      ) : bet.status === 'Perdida' ? (
                        <span className="text-rose-400">-${Math.abs(bet.netProfit).toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Marcar Ganada"
                            onClick={() =>
                              onSettleBet(
                                bet.id,
                                'Ganada',
                                closingOddsInput[bet.id] ? Number(closingOddsInput[bet.id]) : undefined
                              )
                            }
                            className="p-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Marcar Perdida"
                            onClick={() =>
                              onSettleBet(
                                bet.id,
                                'Perdida',
                                closingOddsInput[bet.id] ? Number(closingOddsInput[bet.id]) : undefined
                              )
                            }
                            className="p-1 rounded bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onDeleteBet(bet.id)}
                          className="text-slate-500 hover:text-slate-300 text-[11px] font-sans"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
