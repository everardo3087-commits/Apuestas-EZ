import React, { useState, useEffect, useCallback } from 'react';
import { Header, ActiveTab } from './components/Header';
import { TopKpiStrip } from './components/TopKpiStrip';
import { FilterBar, FilterState } from './components/FilterBar';
import { ValueBetsView } from './components/ValueBetsView';
import { SurebetsView } from './components/SurebetsView';
import { BookmakerIntegrationView } from './components/BookmakerIntegrationView';
import { SteamMovesView } from './components/SteamMovesView';
import { OddsMatrixView } from './components/OddsMatrixView';
import { ParlaysView } from './components/ParlaysView';
import { BetTrackerView } from './components/BetTrackerView';
import { Stadium3DView } from './components/Stadium3DView';
import { AIAnalystModal } from './components/AIAnalystModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { MatchEvent, Competition, SurebetOpportunity, SteamMove, PersonalBet } from './types/odds';
import { COMPETITIONS, generateInitialMatches, applyLiveTick } from './utils/mockOddsGenerator';
import { detectSurebets } from './utils/mathEngine';
import { notificationService, NotificationConfig, SurebetAlertLog } from './utils/notificationService';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ev_bets');
  const [matches, setMatches] = useState<MatchEvent[]>([]);
  const [steamMoves, setSteamMoves] = useState<SteamMove[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>(COMPETITIONS);
  const [bankroll, setBankroll] = useState<number>(100.0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [analyzingMatch, setAnalyzingMatch] = useState<MatchEvent | null>(null);
  const [matrixSelectedMatchId, setMatrixSelectedMatchId] = useState<string>('');
  const [stadiumSelectedMatchId, setStadiumSelectedMatchId] = useState<string>('');

  // Notification System State
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    enabled: true,
    minProfitThreshold: 1.5,
    soundEnabled: true,
    backgroundOnly: false,
  });
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [recentAlerts, setRecentAlerts] = useState<SurebetAlertLog[]>([]);
  const [notifiedKeys, setNotifiedKeys] = useState<Set<string>>(new Set());

  // Personal Bets Tracker
  const [bets, setBets] = useState<PersonalBet[]>([]);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    tier: 'ALL',
    competitionId: 'all',
    searchQuery: '',
    riskProfile: 'moderate',
    smallBankrollMode: false,
    minEvThreshold: 5.0,
    autoRefreshEnabled: true,
    dateFilter: 'all',
  });

  // Fetch initial matches & bets from server (or fallback to local engine)
  const fetchOddsData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/odds');
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches);
        if (data.steamMoves) {
          setSteamMoves(data.steamMoves);
        }
      } else {
        const local = generateInitialMatches();
        setMatches(local);
      }
    } catch {
      const local = generateInitialMatches();
      setMatches(local);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const fetchBets = useCallback(async () => {
    try {
      const res = await fetch('/api/bets');
      if (res.ok) {
        const data = await res.json();
        setBets(data.bets);
      }
    } catch {
      // Keep default local
    }
  }, []);

  useEffect(() => {
    fetchOddsData();
    fetchBets();
  }, [fetchOddsData, fetchBets]);

  // Live ticker auto-refresh loop
  useEffect(() => {
    if (!filters.autoRefreshEnabled) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/odds/refresh', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches);
          if (data.steamMoves) {
            setSteamMoves(data.steamMoves);
          }
        } else {
          setMatches((prev) => {
            const resLocal = applyLiveTick(prev);
            if (resLocal.newSteamMoves.length > 0) {
              setSteamMoves((s) => [...resLocal.newSteamMoves, ...s].slice(0, 30));
            }
            return resLocal.matches;
          });
        }
      } catch {
        setMatches((prev) => {
          const resLocal = applyLiveTick(prev);
          if (resLocal.newSteamMoves.length > 0) {
            setSteamMoves((s) => [...resLocal.newSteamMoves, ...s].slice(0, 30));
          }
          return resLocal.matches;
        });
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [filters.autoRefreshEnabled]);

  // Monitor matches for surebets exceeding notification threshold
  useEffect(() => {
    if (!notificationConfig.enabled || matches.length === 0) return;

    const detected = detectSurebets(matches);
    detected.forEach((sb) => {
      if (sb.profitPct >= notificationConfig.minProfitThreshold) {
        const key = `${sb.matchId}-${sb.profitPct.toFixed(1)}`;
        if (!notifiedKeys.has(key)) {
          setNotifiedKeys((prev) => new Set([...prev, key]));

          const legsSummary = sb.legs.map((l) => ({
            selection: l.selection,
            bookmaker: l.bookmaker,
            odds: l.odds,
          }));

          // Trigger background browser notification & audio chime
          notificationService.notifySurebet(
            sb.matchTitle,
            sb.profitPct,
            legsSummary,
            notificationConfig,
            () => {
              setActiveTab('surebets');
            }
          );

          // Add to recent alerts log
          const newAlert: SurebetAlertLog = {
            id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            matchTitle: sb.matchTitle,
            profitPct: sb.profitPct,
            legs: legsSummary,
            read: false,
          };
          setRecentAlerts((prev) => [newAlert, ...prev].slice(0, 20));
        }
      }
    });
  }, [matches, notificationConfig, notifiedKeys]);

  // Handle Bet Tracker Actions
  const handleAddToTracker = async (
    match: MatchEvent,
    selection: string,
    odds: number,
    bookmaker: string,
    stake: number,
    ev: number,
    prob: number
  ) => {
    const newBet: PersonalBet = {
      id: `bet-${Date.now()}`,
      dateUtc: new Date().toISOString(),
      competition: match.competitionName,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      selection,
      odds,
      stake,
      expectedValue: ev,
      probability: prob,
      bookmaker,
      status: 'Pendiente',
      netProfit: 0,
    };

    setBets((prev) => [newBet, ...prev]);

    // Send to server
    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBet),
      });
    } catch (err) {
      console.warn('Local save only:', err);
    }
  };

  const handleAddParlayToTracker = async (
    title: string,
    odds: number,
    stake: number,
    ev: number,
    prob: number
  ) => {
    const newBet: PersonalBet = {
      id: `parlay-${Date.now()}`,
      dateUtc: new Date().toISOString(),
      competition: 'Combinada de Fútbol',
      match: title,
      selection: 'Combinada Múltiple',
      odds,
      stake,
      expectedValue: ev,
      probability: prob,
      bookmaker: 'Multi-Bookmaker',
      status: 'Pendiente',
      netProfit: 0,
    };

    setBets((prev) => [newBet, ...prev]);

    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBet),
      });
    } catch {
      // Local fallback
    }
  };

  const handleRegisterSurebet = async (surebet: SurebetOpportunity, totalStake: number) => {
    const targetReturn = Number((totalStake / (1 + surebet.totalOverroundPct / 100)).toFixed(2));
    const profit = Number((targetReturn - totalStake).toFixed(2));

    const newBet: PersonalBet = {
      id: `surebet-${Date.now()}`,
      dateUtc: new Date().toISOString(),
      competition: surebet.competitionName,
      match: `[Surebet +${surebet.profitPct}%] ${surebet.matchTitle}`,
      selection: 'Cobertura 1X2 Completa',
      odds: Number((targetReturn / totalStake).toFixed(2)),
      stake: totalStake,
      expectedValue: surebet.profitPct,
      probability: 100,
      bookmaker: 'Multi-Casa (Arb)',
      status: 'Ganada',
      netProfit: profit,
    };

    setBets((prev) => [newBet, ...prev]);

    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBet),
      });
    } catch {
      // local
    }
  };

  const handleSettleBet = async (betId: string, status: 'Ganada' | 'Perdida', closingOdds?: number) => {
    setBets((prev) =>
      prev.map((b) => {
        if (b.id !== betId) return b;
        const profit = status === 'Ganada' ? Number((b.stake * (b.odds - 1)).toFixed(2)) : -b.stake;
        const clv = closingOdds ? Number(((b.odds / closingOdds - 1) * 100).toFixed(2)) : b.clvPct;
        return {
          ...b,
          status,
          netProfit: profit,
          closingOdds: closingOdds || b.closingOdds,
          clvPct: clv,
        };
      })
    );

    try {
      await fetch(`/api/bets/${betId}/settle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, closingOdds }),
      });
    } catch {
      // Local
    }
  };

  const handleDeleteBet = async (betId: string) => {
    setBets((prev) => prev.filter((b) => b.id !== betId));
    try {
      await fetch(`/api/bets/${betId}`, { method: 'DELETE' });
    } catch {
      // Local
    }
  };

  const handleAddManualBet = async (betData: Omit<PersonalBet, 'id' | 'dateUtc' | 'netProfit'>) => {
    const newBet: PersonalBet = {
      id: `bet-manual-${Date.now()}`,
      dateUtc: new Date().toISOString(),
      netProfit: 0,
      ...betData,
    };

    setBets((prev) => [newBet, ...prev]);
    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBet),
      });
    } catch {
      // Local
    }
  };

  // Filter pipeline
  const filteredMatches = matches.filter((m) => {
    if (filters.tier !== 'ALL' && m.tier !== filters.tier) return false;
    if (filters.competitionId !== 'all' && m.competitionId !== filters.competitionId) return false;
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchText = `${m.homeTeam} ${m.awayTeam} ${m.competitionName}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    // Date filtering: Hoy, Próximos 7 días, Selección de rango
    if (filters.dateFilter !== 'all') {
      const matchDate = new Date(m.commenceTime);
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      if (filters.dateFilter === 'today') {
        if (matchDate < todayStart || matchDate > todayEnd) return false;
      } else if (filters.dateFilter === 'next_7_days') {
        const next7DaysEnd = new Date(todayStart.getTime() + 7 * 24 * 3600 * 1000);
        if (matchDate < todayStart || matchDate > next7DaysEnd) return false;
      } else if (filters.dateFilter === 'custom_range') {
        if (filters.customStartDate) {
          const customStart = new Date(`${filters.customStartDate}T00:00:00`);
          if (matchDate < customStart) return false;
        }
        if (filters.customEndDate) {
          const customEnd = new Date(`${filters.customEndDate}T23:59:59`);
          if (matchDate > customEnd) return false;
        }
      }
    }

    return true;
  });

  // Calculate surebets
  const detectedSurebets = detectSurebets(matches);

  // Global KPIs
  const evOpportunities = matches.filter(
    (m) => Math.max(m.expectedValues.home, m.expectedValues.draw, m.expectedValues.away) >= filters.minEvThreshold
  );

  const bestEV = matches.reduce((max, m) => {
    const currMax = Math.max(m.expectedValues.home, m.expectedValues.draw, m.expectedValues.away);
    return currMax > max ? currMax : max;
  }, 0);

  const avgOverround =
    matches.length > 0 ? matches.reduce((acc, m) => acc + m.overroundMedian, 0) / matches.length : 4.8;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onRefreshOdds={fetchOddsData}
        isRefreshing={isRefreshing}
        bankroll={bankroll}
        smallBankrollMode={filters.smallBankrollMode}
        surebetsCount={detectedSurebets.length}
        evBetsCount={evOpportunities.length}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        notificationsActive={notificationConfig.enabled}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Strip */}
        <TopKpiStrip
          totalMatches={matches.length}
          evOpportunitiesCount={evOpportunities.length}
          surebetsCount={detectedSurebets.length}
          averageOverround={avgOverround}
          bestEVValue={bestEV}
          smallBankrollMode={filters.smallBankrollMode}
        />

        {/* Global Filter Bar */}
        <FilterBar
          filters={filters}
          competitions={competitions}
          onFilterChange={(newVals) => setFilters((prev) => ({ ...prev, ...newVals }))}
          bankroll={bankroll}
          onBankrollChange={setBankroll}
          matchesCount={filteredMatches.length}
        />

        {/* Tab Content View */}
        {activeTab === 'ev_bets' && (
          <ValueBetsView
            matches={filteredMatches}
            minEvThreshold={filters.minEvThreshold}
            bankroll={bankroll}
            smallBankrollMode={filters.smallBankrollMode}
            onAnalyzeMatch={(m) => setAnalyzingMatch(m)}
            onAddToTracker={(match, sel, odds, bookmaker, stake, ev, prob) => {
              handleAddToTracker(match, sel, odds, bookmaker, stake, ev, prob);
            }}
            onViewAllOdds={(match) => {
              setMatrixSelectedMatchId(match.id);
              setActiveTab('odds_matrix');
            }}
            onViewStadium={(match) => {
              setStadiumSelectedMatchId(match.id);
              setActiveTab('stadium_3d');
            }}
          />
        )}

        {activeTab === 'surebets' && (
          <SurebetsView
            surebets={detectedSurebets}
            bankroll={bankroll}
            onRegisterSurebet={handleRegisterSurebet}
            onOpenNotificationSettings={() => setIsNotificationModalOpen(true)}
            notificationThreshold={notificationConfig.minProfitThreshold}
          />
        )}

        {activeTab === 'bookmakers_api' && (
          <BookmakerIntegrationView />
        )}

        {activeTab === 'steam_moves' && (
          <SteamMovesView steamMoves={steamMoves} />
        )}

        {activeTab === 'odds_matrix' && (
          <OddsMatrixView
            matches={filteredMatches.length > 0 ? filteredMatches : matches}
            selectedMatchId={matrixSelectedMatchId}
          />
        )}

        {activeTab === 'parlays' && (
          <ParlaysView
            matches={matches}
            bankroll={bankroll}
            smallBankrollMode={filters.smallBankrollMode}
            onAddParlayToTracker={handleAddParlayToTracker}
          />
        )}

        {activeTab === 'tracker' && (
          <BetTrackerView
            bets={bets}
            bankroll={bankroll}
            onSettleBet={handleSettleBet}
            onAddManualBet={handleAddManualBet}
            onDeleteBet={handleDeleteBet}
          />
        )}

        {activeTab === 'stadium_3d' && (
          <Stadium3DView
            matches={filteredMatches.length > 0 ? filteredMatches : matches}
            selectedMatchId={stadiumSelectedMatchId}
          />
        )}
      </main>

      {/* AI Analyst Modal */}
      {analyzingMatch && (
        <AIAnalystModal
          match={analyzingMatch}
          bankroll={bankroll}
          riskProfile={filters.riskProfile}
          onClose={() => setAnalyzingMatch(null)}
          onAddToTracker={(m, sel, odds, bookmaker, stake, ev, prob) => {
            handleAddToTracker(m, sel, odds, bookmaker, stake, ev, prob);
          }}
        />
      )}

      {/* Notification Settings & Alert Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        config={notificationConfig}
        onConfigChange={setNotificationConfig}
        recentAlerts={recentAlerts}
        onSelectSurebetTab={() => setActiveTab('surebets')}
      />

      {/* Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Market Efficiency Scanner & Real-Time Odds Intelligence © {new Date().getFullYear()}</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Calibración Vig-Free: Pinnacle & Betfair</span>
            <span>·</span>
            <span>APIs: Bet365 / William Hill / Bwin</span>
            <span>·</span>
            <span>IA: Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
