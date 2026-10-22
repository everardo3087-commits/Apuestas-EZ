import { MatchEvent, SurebetOpportunity, SteamMove } from '../types/odds';

export const MIN_ODDS = 1.05;
export const MAX_ODDS = 50.0;
export const MAX_ACCEPTABLE_OVERROUND = 15.0; // 15% max vig

/**
 * Calculate bookmaker overround/vig percentage
 * Example: 1.95 / 3.40 / 3.90 -> 1/1.95 + 1/3.40 + 1/3.90 - 1 = ~6.3%
 */
export function calculateOverround(home: number, draw: number, away: number): number {
  if (home <= 1 || draw <= 1 || away <= 1) return 0;
  const rawSum = (1 / home) + (1 / draw) + (1 / away);
  return (rawSum - 1) * 100;
}

/**
 * Calculate fair (vig-free) probabilities using proportional normalization
 */
export function calculateFairProbabilities(
  homeOdds: number,
  drawOdds: number,
  awayOdds: number
): { home: number; draw: number; away: number } {
  if (homeOdds <= 1 || drawOdds <= 1 || awayOdds <= 1) {
    return { home: 0.333, draw: 0.333, away: 0.333 };
  }
  const rawH = 1 / homeOdds;
  const rawD = 1 / drawOdds;
  const rawA = 1 / awayOdds;
  const sum = rawH + rawD + rawA;

  return {
    home: Number(((rawH / sum) * 100).toFixed(2)),
    draw: Number(((rawD / sum) * 100).toFixed(2)),
    away: Number(((rawA / sum) * 100).toFixed(2)),
  };
}

/**
 * Calculate Expected Value (EV%)
 * EV = (Probability * DecimalOdds - 1) * 100
 */
export function calculateExpectedValue(probabilityPct: number, odds: number): number {
  if (probabilityPct <= 0 || odds <= 1) return 0;
  const prob = probabilityPct / 100;
  const ev = (prob * odds - 1) * 100;
  // Cap unrealistic outliers (>60% usually indicates bad quote or error)
  if (ev > 50 || ev < -100) return 0;
  return Number(ev.toFixed(2));
}

/**
 * Calculate Kelly Criterion fractional stake
 * f* = (p * b - q) / b = (p * odds - 1) / (odds - 1)
 */
export function calculateKellyStake(
  probabilityPct: number,
  odds: number,
  bankroll: number,
  fraction: number = 0.25,
  maxDailyCapPct: number = 0.05
): number {
  if (probabilityPct <= 0 || odds <= 1 || bankroll <= 0) return 0;
  const p = probabilityPct / 100;
  const edge = p * odds - 1;
  if (edge <= 0) return 0;

  const fullKelly = edge / (odds - 1);
  const stake = bankroll * fullKelly * fraction;
  const maxCap = bankroll * maxDailyCapPct;

  return Number(Math.min(stake, maxCap).toFixed(2));
}

/**
 * Calculate Closing Line Value (CLV%)
 * CLV = (OddsPlaced / ClosingOdds - 1) * 100
 */
export function calculateCLV(oddsPlaced: number, closingOdds: number): number | null {
  if (oddsPlaced <= 1 || closingOdds <= 1) return null;
  const clv = (oddsPlaced / closingOdds - 1) * 100;
  return Number(clv.toFixed(2));
}

/**
 * Detect cross-bookmaker arbitrage (Surebets)
 */
export function detectSurebets(matches: MatchEvent[], totalStake: number = 100): SurebetOpportunity[] {
  const surebets: SurebetOpportunity[] = [];

  for (const match of matches) {
    const { home, draw, away } = match.bestOdds;
    if (!home || !draw || !away) continue;

    const invH = 1 / home.price;
    const invD = 1 / draw.price;
    const invA = 1 / away.price;
    const sumInv = invH + invD + invA;

    // If sum of inverse odds < 1.0, there is a mathematical arbitrage!
    if (sumInv < 0.995 && sumInv > 0.70) {
      const profitPct = Number(((1 / sumInv - 1) * 100).toFixed(2));
      const stakeH = Number(((invH / sumInv) * totalStake).toFixed(2));
      const stakeD = Number(((invD / sumInv) * totalStake).toFixed(2));
      const stakeA = Number(((invA / sumInv) * totalStake).toFixed(2));

      surebets.push({
        id: `surebet-${match.id}`,
        matchId: match.id,
        matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
        competitionName: match.competitionName,
        commenceTime: match.commenceTime,
        marketType: '1X2',
        totalOverroundPct: Number((sumInv * 100 - 100).toFixed(2)),
        profitPct,
        legs: [
          {
            selection: `1 (${match.homeTeam})`,
            bookmaker: home.bookmakerName,
            odds: home.price,
            impliedProbPct: Number((invH * 100).toFixed(1)),
            stakePct: Number(((invH / sumInv) * 100).toFixed(1)),
            calculatedStake: stakeH,
            payout: Number((stakeH * home.price).toFixed(2)),
          },
          {
            selection: 'X (Empate)',
            bookmaker: draw.bookmakerName,
            odds: draw.price,
            impliedProbPct: Number((invD * 100).toFixed(1)),
            stakePct: Number(((invD / sumInv) * 100).toFixed(1)),
            calculatedStake: stakeD,
            payout: Number((stakeD * draw.price).toFixed(2)),
          },
          {
            selection: `2 (${match.awayTeam})`,
            bookmaker: away.bookmakerName,
            odds: away.price,
            impliedProbPct: Number((invA * 100).toFixed(1)),
            stakePct: Number(((invA / sumInv) * 100).toFixed(1)),
            calculatedStake: stakeA,
            payout: Number((stakeA * away.price).toFixed(2)),
          },
        ],
      });
    }
  }

  return surebets.sort((a, b) => b.profitPct - a.profitPct);
}

/**
 * Median calculation helper
 */
export function calculateMedian(numbers: number[]): number {
  if (!numbers.length) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
}
