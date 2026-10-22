export type StrategicTier = 'TOP_VALOR' | 'ALTO_VALOR' | 'VALOR_MODERADO' | 'BAJO_VALOR';

export interface Competition {
  id: string;
  name: string;
  country: string;
  sportKey: string;
  tier: StrategicTier;
  tierLabel: string;
  recommendedMinBooks: number;
  recommendedMaxOverround: number;
}

export interface Quote {
  bookmakerId: string;
  bookmakerName: string;
  price: number;
  previousPrice?: number;
  lastUpdated: string;
  isSharp?: boolean;
}

export interface MatchQuotes {
  home: Quote[];
  draw: Quote[];
  away: Quote[];
  over25?: Quote[];
  under25?: Quote[];
}

export interface BestQuote {
  price: number;
  bookmakerName: string;
  bookmakerId: string;
  previousPrice?: number;
}

export interface SteamMove {
  id: string;
  matchId: string;
  matchTitle: string;
  selection: 'Local' | 'Empate' | 'Visitante' | 'Over 2.5' | 'Under 2.5';
  bookmaker: string;
  previousOdds: number;
  currentOdds: number;
  dropPercentage: number;
  timestamp: string;
  type: 'sharp_drop' | 'market_drift';
}

export interface MatchEvent {
  id: string;
  competitionId: string;
  competitionName: string;
  tier: StrategicTier;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  venue?: string;
  city?: string;
  weather?: {
    condition: string;
    temperature: number;
    windSpeedKmH: number;
    rainProbability: number;
  };
  quotes: MatchQuotes;
  
  // Calculated metrics
  bookmakersCount: number;
  overroundMedian: number;
  overroundBest: number;
  
  // Median prices
  medianOdds: {
    home: number;
    draw: number;
    away: number;
  };

  // Best prices
  bestOdds: {
    home: BestQuote;
    draw: BestQuote;
    away: BestQuote;
    over25?: BestQuote;
    under25?: BestQuote;
  };

  // True Vig-Free Implied Probabilities (%)
  fairProbabilities: {
    home: number;
    draw: number;
    away: number;
  };

  // Expected Value (%) for best prices
  expectedValues: {
    home: number;
    draw: number;
    away: number;
  };

  // Confidence based on bookmaker consensus
  confidence: {
    home: 'Alta' | 'Media' | 'Baja';
    draw: 'Alta' | 'Media' | 'Baja';
    away: 'Alta' | 'Media' | 'Baja';
    overall: 'Alta' | 'Media' | 'Baja';
  };

  highestEVSelection?: 'Local' | 'Empate' | 'Visitante';
  highestEVValue?: number;
  highestEVBookmaker?: string;
  highestEVPrice?: number;
  kellyStakeSuggested?: number;
  
  steamMoves: SteamMove[];
  isArbitrageCandidate?: boolean;
}

export interface SurebetOpportunity {
  id: string;
  matchId: string;
  matchTitle: string;
  competitionName: string;
  commenceTime: string;
  marketType: '1X2' | 'OverUnder25';
  totalOverroundPct: number;
  profitPct: number;
  legs: {
    selection: string;
    bookmaker: string;
    odds: number;
    impliedProbPct: number;
    stakePct: number;
    calculatedStake: number;
    payout: number;
  }[];
}

export interface PersonalBet {
  id: string;
  dateUtc: string;
  competition: string;
  match: string;
  selection: string;
  odds: number;
  stake: number;
  expectedValue: number;
  probability: number;
  bookmaker: string;
  status: 'Pendiente' | 'Ganada' | 'Perdida';
  netProfit: number;
  closingOdds?: number;
  clvPct?: number;
}

export interface RiskProfileConfig {
  name: string;
  evThreshold: number;
  minProbability: number;
  minKellyStake: number;
  minConfidence: 'Alta' | 'Media' | 'Baja';
  kellyFraction: number;
}

export interface AIAnalysisResult {
  matchId: string;
  matchTitle: string;
  verdict: 'APOSTAR' | 'CONSIDERAR' | 'OBSERVAR' | 'DESCARTAR';
  confidenceScore: number;
  riskRating: 'Bajo' | 'Medio' | 'Alto';
  recommendedSelection: string;
  recommendedOdds: number;
  recommendedBookmaker: string;
  recommendedKellyStake: number;
  keyEdges: string[];
  riskFactors: string[];
  tacticalAnalysis: string;
  sharpMarketSummary: string;
}
