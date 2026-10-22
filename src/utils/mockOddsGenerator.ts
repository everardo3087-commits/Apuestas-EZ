import { Competition, MatchEvent, Quote, SteamMove } from '../types/odds';
import {
  calculateFairProbabilities,
  calculateExpectedValue,
  calculateKellyStake,
  calculateMedian,
  calculateOverround,
} from './mathEngine';

export const COMPETITIONS: Competition[] = [
  // TOP VALOR
  {
    id: 'soccer_efl_champ',
    name: 'Championship (Inglaterra)',
    country: 'Inglaterra',
    sportKey: 'soccer_efl_champ',
    tier: 'TOP_VALOR',
    tierLabel: '🔥 TOP VALOR',
    recommendedMinBooks: 7,
    recommendedMaxOverround: 5.5,
  },
  {
    id: 'soccer_spain_segunda',
    name: 'Segunda División (España)',
    country: 'España',
    sportKey: 'soccer_spain_segunda_division',
    tier: 'TOP_VALOR',
    tierLabel: '🔥 TOP VALOR',
    recommendedMinBooks: 6,
    recommendedMaxOverround: 6.0,
  },
  {
    id: 'soccer_mexico_ligamx',
    name: 'Liga MX',
    country: 'México',
    sportKey: 'soccer_mexico_ligamx',
    tier: 'TOP_VALOR',
    tierLabel: '🔥 TOP VALOR',
    recommendedMinBooks: 6,
    recommendedMaxOverround: 6.2,
  },
  {
    id: 'soccer_netherlands_eredivisie',
    name: 'Eredivisie',
    country: 'Países Bajos',
    sportKey: 'soccer_netherlands_eredivisie',
    tier: 'TOP_VALOR',
    tierLabel: '🔥 TOP VALOR',
    recommendedMinBooks: 7,
    recommendedMaxOverround: 5.8,
  },
  {
    id: 'soccer_libertadores',
    name: 'Copa Libertadores',
    country: 'Sudamérica',
    sportKey: 'soccer_conmebol_copa_libertadores',
    tier: 'TOP_VALOR',
    tierLabel: '🔥 TOP VALOR',
    recommendedMinBooks: 6,
    recommendedMaxOverround: 6.0,
  },
  {
    id: 'soccer_sudamericana',
    name: 'Copa Sudamericana',
    country: 'Sudamérica',
    sportKey: 'soccer_conmebol_copa_sudamericana',
    tier: 'TOP_VALOR',
    tierLabel: '🔥 TOP VALOR',
    recommendedMinBooks: 5,
    recommendedMaxOverround: 6.5,
  },

  // ALTO VALOR
  {
    id: 'soccer_brazil_campeonato',
    name: 'Brasileirão Série A',
    country: 'Brasil',
    sportKey: 'soccer_brazil_campeonato',
    tier: 'ALTO_VALOR',
    tierLabel: '📈 ALTO VALOR',
    recommendedMinBooks: 7,
    recommendedMaxOverround: 5.8,
  },
  {
    id: 'soccer_argentina_primera',
    name: 'Liga Profesional (Argentina)',
    country: 'Argentina',
    sportKey: 'soccer_argentina_primera_division',
    tier: 'ALTO_VALOR',
    tierLabel: '📈 ALTO VALOR',
    recommendedMinBooks: 6,
    recommendedMaxOverround: 6.2,
  },
  {
    id: 'soccer_usa_mls',
    name: 'MLS',
    country: 'EE.UU.',
    sportKey: 'soccer_usa_mls',
    tier: 'ALTO_VALOR',
    tierLabel: '📈 ALTO VALOR',
    recommendedMinBooks: 8,
    recommendedMaxOverround: 5.5,
  },
  {
    id: 'soccer_portugal_primeira',
    name: 'Primeira Liga (Portugal)',
    country: 'Portugal',
    sportKey: 'soccer_portugal_primeira_liga',
    tier: 'ALTO_VALOR',
    tierLabel: '📈 ALTO VALOR',
    recommendedMinBooks: 7,
    recommendedMaxOverround: 5.5,
  },
  {
    id: 'soccer_uefa_europa_league',
    name: 'UEFA Europa League',
    country: 'Europa',
    sportKey: 'soccer_uefa_europa_league',
    tier: 'ALTO_VALOR',
    tierLabel: '📈 ALTO VALOR',
    recommendedMinBooks: 8,
    recommendedMaxOverround: 5.0,
  },

  // VALOR MODERADO
  {
    id: 'soccer_belgium_first_div',
    name: 'Belgian Pro League',
    country: 'Bélgica',
    sportKey: 'soccer_belgium_first_div',
    tier: 'VALOR_MODERADO',
    tierLabel: '🎯 VALOR MODERADO',
    recommendedMinBooks: 6,
    recommendedMaxOverround: 6.0,
  },
  {
    id: 'soccer_spl',
    name: 'Scottish Premiership',
    country: 'Escocia',
    sportKey: 'soccer_spl',
    tier: 'VALOR_MODERADO',
    tierLabel: '🎯 VALOR MODERADO',
    recommendedMinBooks: 6,
    recommendedMaxOverround: 6.0,
  },
  {
    id: 'soccer_italy_serie_b',
    name: 'Serie B (Italia)',
    country: 'Italia',
    sportKey: 'soccer_italy_serie_b',
    tier: 'VALOR_MODERADO',
    tierLabel: '🎯 VALOR MODERADO',
    recommendedMinBooks: 6,
    recommendedMaxOverround: 6.2,
  },
  {
    id: 'soccer_germany_bundesliga2',
    name: '2. Bundesliga',
    country: 'Alemania',
    sportKey: 'soccer_germany_bundesliga2',
    tier: 'VALOR_MODERADO',
    tierLabel: '🎯 VALOR MODERADO',
    recommendedMinBooks: 7,
    recommendedMaxOverround: 5.6,
  },

  // BAJO VALOR
  {
    id: 'soccer_uefa_champs_league',
    name: 'UEFA Champions League',
    country: 'Europa',
    sportKey: 'soccer_uefa_champs_league',
    tier: 'BAJO_VALOR',
    tierLabel: '⚠️ BAJO VALOR (Muy eficiente)',
    recommendedMinBooks: 9,
    recommendedMaxOverround: 4.5,
  },
];

export const BOOKMAKERS = [
  { id: 'pinnacle', name: 'Pinnacle', isSharp: true, baseMargin: 0.024 },
  { id: 'betfair_ex', name: 'Betfair Exchange', isSharp: true, baseMargin: 0.028 },
  { id: 'bet365', name: 'Bet365', isSharp: false, baseMargin: 0.046 },
  { id: 'betano', name: 'Betano', isSharp: false, baseMargin: 0.048 },
  { id: 'onexbet', name: '1xBet', isSharp: false, baseMargin: 0.038 },
  { id: 'williamhill', name: 'William Hill', isSharp: false, baseMargin: 0.054 },
  { id: 'bwin', name: 'Bwin', isSharp: false, baseMargin: 0.062 },
  { id: 'unibet', name: 'Unibet', isSharp: false, baseMargin: 0.052 },
  { id: 'codere', name: 'Codere', isSharp: false, baseMargin: 0.065 },
  { id: 'bovada', name: 'Bovada', isSharp: false, baseMargin: 0.058 },
];

const RAW_MATCHES_DEF: Array<{
  id: string;
  compSportKey: string;
  home: string;
  away: string;
  hoursFromNow: number;
  baseProbs: [number, number, number]; // [H, D, A] sum to ~1.0
  venue: string;
  city: string;
  weather: { condition: string; temperature: number; windSpeedKmH: number; rainProbability: number };
}> = [
  // Championship
  {
    id: 'm-efl-1',
    compSportKey: 'soccer_efl_champ',
    home: 'Leeds United',
    away: 'Sunderland',
    hoursFromNow: 4,
    baseProbs: [0.54, 0.26, 0.20],
    venue: 'Elland Road',
    city: 'Leeds',
    weather: { condition: 'Llovizna suave', temperature: 11, windSpeedKmH: 22, rainProbability: 65 },
  },
  {
    id: 'm-efl-2',
    compSportKey: 'soccer_efl_champ',
    home: 'West Bromwich Albion',
    away: 'Norwich City',
    hoursFromNow: 8,
    baseProbs: [0.44, 0.29, 0.27],
    venue: 'The Hawthorns',
    city: 'West Bromwich',
    weather: { condition: 'Nublado', temperature: 13, windSpeedKmH: 14, rainProbability: 20 },
  },
  {
    id: 'm-efl-3',
    compSportKey: 'soccer_efl_champ',
    home: 'Middlesbrough',
    away: 'Sheffield United',
    hoursFromNow: 22,
    baseProbs: [0.38, 0.28, 0.34],
    venue: 'Riverside Stadium',
    city: 'Middlesbrough',
    weather: { condition: 'Despejado', temperature: 9, windSpeedKmH: 16, rainProbability: 10 },
  },

  // Segunda División España
  {
    id: 'm-seg-1',
    compSportKey: 'soccer_spain_segunda_division',
    home: 'Sporting de Gijón',
    away: 'Real Zaragoza',
    hoursFromNow: 5,
    baseProbs: [0.47, 0.33, 0.20],
    venue: 'El Molinón',
    city: 'Gijón',
    weather: { condition: 'Chubascos', temperature: 15, windSpeedKmH: 18, rainProbability: 70 },
  },
  {
    id: 'm-seg-2',
    compSportKey: 'soccer_spain_segunda_division',
    home: 'Racing de Santander',
    away: 'Levante UD',
    hoursFromNow: 12,
    baseProbs: [0.40, 0.31, 0.29],
    venue: 'El Sardinero',
    city: 'Santander',
    weather: { condition: 'Húmedo templado', temperature: 16, windSpeedKmH: 12, rainProbability: 35 },
  },
  {
    id: 'm-seg-3',
    compSportKey: 'soccer_spain_segunda_division',
    home: 'Burgos CF',
    away: 'SD Eibar',
    hoursFromNow: 28,
    baseProbs: [0.35, 0.34, 0.31],
    venue: 'El Plantío',
    city: 'Burgos',
    weather: { condition: 'Viento frío', temperature: 8, windSpeedKmH: 26, rainProbability: 15 },
  },

  // Liga MX
  {
    id: 'm-mx-1',
    compSportKey: 'soccer_mexico_ligamx',
    home: 'Club América',
    away: 'Cruz Azul',
    hoursFromNow: 6,
    baseProbs: [0.48, 0.27, 0.25],
    venue: 'Estadio Ciudad de los Deportes',
    city: 'Ciudad de México',
    weather: { condition: 'Noche despejada', temperature: 18, windSpeedKmH: 9, rainProbability: 5 },
  },
  {
    id: 'm-mx-2',
    compSportKey: 'soccer_mexico_ligamx',
    home: 'Tigres UANL',
    away: 'CF Monterrey',
    hoursFromNow: 14,
    baseProbs: [0.41, 0.30, 0.29],
    venue: 'Estadio Universitario',
    city: 'San Nicolás de los Garza',
    weather: { condition: 'Cálido', temperature: 27, windSpeedKmH: 15, rainProbability: 10 },
  },
  {
    id: 'm-mx-3',
    compSportKey: 'soccer_mexico_ligamx',
    home: 'Chivas Guadalajara',
    away: 'Deportivo Toluca',
    hoursFromNow: 30,
    baseProbs: [0.39, 0.28, 0.33],
    venue: 'Estadio Akron',
    city: 'Zapopan',
    weather: { condition: 'Despejado', temperature: 22, windSpeedKmH: 8, rainProbability: 0 },
  },

  // Eredivisie
  {
    id: 'm-ere-1',
    compSportKey: 'soccer_netherlands_eredivisie',
    home: 'Feyenoord',
    away: 'FC Utrecht',
    hoursFromNow: 7,
    baseProbs: [0.63, 0.21, 0.16],
    venue: 'De Kuip',
    city: 'Rotterdam',
    weather: { condition: 'Lluvia intermitente', temperature: 12, windSpeedKmH: 28, rainProbability: 80 },
  },
  {
    id: 'm-ere-2',
    compSportKey: 'soccer_netherlands_eredivisie',
    home: 'AZ Alkmaar',
    away: 'FC Twente',
    hoursFromNow: 16,
    baseProbs: [0.45, 0.28, 0.27],
    venue: 'AFAS Stadion',
    city: 'Alkmaar',
    weather: { condition: 'Nublado', temperature: 11, windSpeedKmH: 20, rainProbability: 40 },
  },

  // Copa Libertadores
  {
    id: 'm-lib-1',
    compSportKey: 'soccer_conmebol_copa_libertadores',
    home: 'River Plate',
    away: 'Atlético Mineiro',
    hoursFromNow: 10,
    baseProbs: [0.52, 0.28, 0.20],
    venue: 'Estadio Mâs Monumental',
    city: 'Buenos Aires',
    weather: { condition: 'Brisa húmeda', temperature: 19, windSpeedKmH: 14, rainProbability: 25 },
  },
  {
    id: 'm-lib-2',
    compSportKey: 'soccer_conmebol_copa_libertadores',
    home: 'Palmeiras',
    away: 'Botafogo',
    hoursFromNow: 32,
    baseProbs: [0.46, 0.29, 0.25],
    venue: 'Allianz Parque',
    city: 'São Paulo',
    weather: { condition: 'Cálido húmedo', temperature: 24, windSpeedKmH: 10, rainProbability: 45 },
  },

  // Brasileirão
  {
    id: 'm-bra-1',
    compSportKey: 'soccer_brazil_campeonato',
    home: 'Flamengo',
    away: 'Internacional',
    hoursFromNow: 11,
    baseProbs: [0.55, 0.25, 0.20],
    venue: 'Maracanã',
    city: 'Río de Janeiro',
    weather: { condition: 'Despejado cálido', temperature: 28, windSpeedKmH: 12, rainProbability: 10 },
  },
  {
    id: 'm-bra-2',
    compSportKey: 'soccer_brazil_campeonato',
    home: 'São Paulo FC',
    away: 'Athletico Paranaense',
    hoursFromNow: 25,
    baseProbs: [0.49, 0.28, 0.23],
    venue: 'MorumBIS',
    city: 'São Paulo',
    weather: { condition: 'Nubosidad variable', temperature: 22, windSpeedKmH: 11, rainProbability: 30 },
  },

  // MLS
  {
    id: 'm-mls-1',
    compSportKey: 'soccer_usa_mls',
    home: 'Inter Miami CF',
    away: 'Columbus Crew',
    hoursFromNow: 9,
    baseProbs: [0.51, 0.24, 0.25],
    venue: 'Chase Stadium',
    city: 'Fort Lauderdale',
    weather: { condition: 'Cálido tropical', temperature: 29, windSpeedKmH: 16, rainProbability: 20 },
  },
  {
    id: 'm-mls-2',
    compSportKey: 'soccer_usa_mls',
    home: 'LAFC',
    away: 'Seattle Sounders',
    hoursFromNow: 36,
    baseProbs: [0.48, 0.27, 0.25],
    venue: 'BMO Stadium',
    city: 'Los Ángeles',
    weather: { condition: 'Despejado', temperature: 21, windSpeedKmH: 8, rainProbability: 0 },
  },

  // UEFA Champions League (Bajo valor para contrastar)
  {
    id: 'm-ucl-1',
    compSportKey: 'soccer_uefa_champs_league',
    home: 'Real Madrid',
    away: 'Borussia Dortmund',
    hoursFromNow: 18,
    baseProbs: [0.62, 0.21, 0.17],
    venue: 'Santiago Bernabéu',
    city: 'Madrid',
    weather: { condition: 'Cielo claro', temperature: 16, windSpeedKmH: 10, rainProbability: 0 },
  },
];

/**
 * Generate match events with multi-bookmaker quotes and calculate edges
 */
export function generateInitialMatches(): MatchEvent[] {
  const now = new Date();

  return RAW_MATCHES_DEF.map((def, matchIdx) => {
    const comp = COMPETITIONS.find((c) => c.sportKey === def.compSportKey) || COMPETITIONS[0];
    const commence = new Date(now.getTime() + def.hoursFromNow * 3600 * 1000);

    const quotesHome: Quote[] = [];
    const quotesDraw: Quote[] = [];
    const quotesAway: Quote[] = [];
    const steamMoves: SteamMove[] = [];

    // Synthetic seed per match
    const seed = matchIdx * 17 + 5;

    BOOKMAKERS.forEach((book, bIdx) => {
      // Noise per bookmaker
      // Pinnacle is the sharp standard (closest to true probability + 2.4% vig)
      const noiseH = Math.sin(seed + bIdx * 3.1) * (book.isSharp ? 0.012 : 0.038);
      const noiseD = Math.cos(seed + bIdx * 2.7) * (book.isSharp ? 0.015 : 0.042);
      const noiseA = -noiseH - noiseD;

      // Implied probabilities with bookmaker margin
      const marginH = def.baseProbs[0] * (1 + book.baseMargin) + noiseH;
      const marginD = def.baseProbs[1] * (1 + book.baseMargin) + noiseD;
      const marginA = def.baseProbs[2] * (1 + book.baseMargin) + noiseA;

      // Decimal odds = 1 / probability
      let priceH = Number((1 / Math.max(0.05, marginH)).toFixed(2));
      let priceD = Number((1 / Math.max(0.05, marginD)).toFixed(2));
      let priceA = Number((1 / Math.max(0.05, marginA)).toFixed(2));

      // Inject deliberate high-value opportunities & steam moves on specific matches!
      // E.g., on match 0 (Leeds vs Sunderland) or match 3 (Sporting Gijon)
      if (matchIdx === 0 && book.id === 'onexbet') {
        // High odds on Home (Value Bet!)
        priceH = Number((priceH * 1.09).toFixed(2));
      }
      if (matchIdx === 3 && book.id === 'bovada') {
        // High odds on Away
        priceA = Number((priceA * 1.11).toFixed(2));
      }
      if (matchIdx === 6 && book.id === 'betano') {
        // High odds on Draw
        priceD = Number((priceD * 1.08).toFixed(2));
      }

      // Inject an Arbitrage (Surebet) between Pinnacle, Bet365 and 1xBet on match 4 (Racing vs Levante)
      if (matchIdx === 4) {
        if (book.id === 'pinnacle') priceH = 2.75;
        if (book.id === 'bet365') priceD = 3.60;
        if (book.id === 'onexbet') priceA = 3.15;
      }

      const isoUpdate = new Date(now.getTime() - (bIdx * 45 + 10) * 1000).toISOString();

      quotesHome.push({
        bookmakerId: book.id,
        bookmakerName: book.name,
        price: priceH,
        lastUpdated: isoUpdate,
        isSharp: book.isSharp,
      });

      quotesDraw.push({
        bookmakerId: book.id,
        bookmakerName: book.name,
        price: priceD,
        lastUpdated: isoUpdate,
        isSharp: book.isSharp,
      });

      quotesAway.push({
        bookmakerId: book.id,
        bookmakerName: book.name,
        price: priceA,
        lastUpdated: isoUpdate,
        isSharp: book.isSharp,
      });
    });

    // Detect steam move simulation on match 1 or match 6
    if (matchIdx === 1) {
      quotesHome[0].previousPrice = Number((quotesHome[0].price * 1.06).toFixed(2));
      steamMoves.push({
        id: `steam-${def.id}-h`,
        matchId: def.id,
        matchTitle: `${def.home} vs ${def.away}`,
        selection: 'Local',
        bookmaker: 'Pinnacle',
        previousOdds: quotesHome[0].previousPrice,
        currentOdds: quotesHome[0].price,
        dropPercentage: 5.7,
        timestamp: new Date().toISOString(),
        type: 'sharp_drop',
      });
    }

    // Median Odds
    const medH = calculateMedian(quotesHome.map((q) => q.price));
    const medD = calculateMedian(quotesDraw.map((q) => q.price));
    const medA = calculateMedian(quotesAway.map((q) => q.price));

    // Best Odds
    const bestH = quotesHome.reduce((prev, curr) => (curr.price > prev.price ? curr : prev));
    const bestD = quotesDraw.reduce((prev, curr) => (curr.price > prev.price ? curr : prev));
    const bestA = quotesAway.reduce((prev, curr) => (curr.price > prev.price ? curr : prev));

    // Overrounds
    const overroundMedian = Number(calculateOverround(medH, medD, medA).toFixed(2));
    const overroundBest = Number(calculateOverround(bestH.price, bestD.price, bestA.price).toFixed(2));

    // Vig-free Fair Probabilities
    const fairProbs = calculateFairProbabilities(medH, medD, medA);

    // Expected Value (%)
    const evH = calculateExpectedValue(fairProbs.home, bestH.price);
    const evD = calculateExpectedValue(fairProbs.draw, bestD.price);
    const evA = calculateExpectedValue(fairProbs.away, bestA.price);

    // Confidence calculation (consensus agreement within +-5% of median)
    const getConfidence = (quotes: Quote[], median: number): 'Alta' | 'Media' | 'Baja' => {
      const within5Pct = quotes.filter((q) => Math.abs(q.price - median) / median <= 0.05).length;
      const ratio = within5Pct / quotes.length;
      if (ratio >= 0.75) return 'Alta';
      if (ratio >= 0.55) return 'Media';
      return 'Baja';
    };

    const confH = getConfidence(quotesHome, medH);
    const confD = getConfidence(quotesDraw, medD);
    const confA = getConfidence(quotesAway, medA);

    // Highest EV
    let highestEVSelection: 'Local' | 'Empate' | 'Visitante' | undefined;
    let highestEVValue: number | undefined;
    let highestEVBookmaker: string | undefined;
    let highestEVPrice: number | undefined;
    let kellyStakeSuggested: number | undefined;

    const evCandidates: Array<{
      sel: 'Local' | 'Empate' | 'Visitante';
      val: number;
      quote: Quote;
      prob: number;
    }> = [
      { sel: 'Local' as const, val: evH, quote: bestH, prob: fairProbs.home },
      { sel: 'Empate' as const, val: evD, quote: bestD, prob: fairProbs.draw },
      { sel: 'Visitante' as const, val: evA, quote: bestA, prob: fairProbs.away },
    ].sort((a, b) => b.val - a.val);

    const bestCandidate = evCandidates[0];
    if (bestCandidate && bestCandidate.val > 0) {
      highestEVSelection = bestCandidate.sel;
      highestEVValue = bestCandidate.val;
      highestEVBookmaker = bestCandidate.quote.bookmakerName;
      highestEVPrice = bestCandidate.quote.price;
      kellyStakeSuggested = calculateKellyStake(bestCandidate.prob, bestCandidate.quote.price, 100, 0.25);
    }

    return {
      id: def.id,
      competitionId: comp.id,
      competitionName: comp.name,
      tier: comp.tier,
      homeTeam: def.home,
      awayTeam: def.away,
      commenceTime: commence.toISOString(),
      venue: def.venue,
      city: def.city,
      weather: def.weather,
      quotes: {
        home: quotesHome,
        draw: quotesDraw,
        away: quotesAway,
      },
      bookmakersCount: BOOKMAKERS.length,
      overroundMedian,
      overroundBest,
      medianOdds: {
        home: medH,
        draw: medD,
        away: medA,
      },
      bestOdds: {
        home: {
          price: bestH.price,
          bookmakerName: bestH.bookmakerName,
          bookmakerId: bestH.bookmakerId,
          previousPrice: bestH.previousPrice,
        },
        draw: {
          price: bestD.price,
          bookmakerName: bestD.bookmakerName,
          bookmakerId: bestD.bookmakerId,
        },
        away: {
          price: bestA.price,
          bookmakerName: bestA.bookmakerName,
          bookmakerId: bestA.bookmakerId,
        },
      },
      fairProbabilities: fairProbs,
      expectedValues: {
        home: evH,
        draw: evD,
        away: evA,
      },
      confidence: {
        home: confH,
        draw: confD,
        away: confA,
        overall: confH === 'Alta' && confD === 'Alta' ? 'Alta' : 'Media',
      },
      highestEVSelection,
      highestEVValue,
      highestEVBookmaker,
      highestEVPrice,
      kellyStakeSuggested,
      steamMoves,
      isArbitrageCandidate: overroundBest < 0,
    };
  });
}

/**
 * Apply live random market tick to simulate real-time odds fluctuation
 */
export function applyLiveTick(matches: MatchEvent[]): { matches: MatchEvent[]; newSteamMoves: SteamMove[] } {
  const newSteamMoves: SteamMove[] = [];
  const targetMatchIndex = Math.floor(Math.random() * matches.length);

  const updatedMatches = matches.map((match, idx) => {
    if (idx !== targetMatchIndex) return match;

    // Mutate a few bookmakers on this match
    const mutatedQuotesH = [...match.quotes.home];
    const mutatedQuotesD = [...match.quotes.draw];
    const mutatedQuotesA = [...match.quotes.away];

    const bookIdx = Math.floor(Math.random() * BOOKMAKERS.length);
    const deltaH = (Math.random() - 0.49) * 0.08;
    const oldPrice = mutatedQuotesH[bookIdx].price;
    const newPrice = Number(Math.max(1.10, oldPrice + deltaH).toFixed(2));

    mutatedQuotesH[bookIdx] = {
      ...mutatedQuotesH[bookIdx],
      previousPrice: oldPrice,
      price: newPrice,
      lastUpdated: new Date().toISOString(),
    };

    // Check if sudden sharp drop
    const dropPct = ((oldPrice - newPrice) / oldPrice) * 100;
    if (dropPct >= 3.5) {
      newSteamMoves.push({
        id: `steam-${match.id}-${Date.now()}`,
        matchId: match.id,
        matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
        selection: 'Local',
        bookmaker: mutatedQuotesH[bookIdx].bookmakerName,
        previousOdds: oldPrice,
        currentOdds: newPrice,
        dropPercentage: Number(dropPct.toFixed(1)),
        timestamp: new Date().toISOString(),
        type: 'sharp_drop',
      });
    }

    // Recalculate medians & best
    const medH = calculateMedian(mutatedQuotesH.map((q) => q.price));
    const medD = calculateMedian(mutatedQuotesD.map((q) => q.price));
    const medA = calculateMedian(mutatedQuotesA.map((q) => q.price));

    const bestH = mutatedQuotesH.reduce((prev, curr) => (curr.price > prev.price ? curr : prev));
    const bestD = mutatedQuotesD.reduce((prev, curr) => (curr.price > prev.price ? curr : prev));
    const bestA = mutatedQuotesA.reduce((prev, curr) => (curr.price > prev.price ? curr : prev));

    const fairProbs = calculateFairProbabilities(medH, medD, medA);
    const evH = calculateExpectedValue(fairProbs.home, bestH.price);
    const evD = calculateExpectedValue(fairProbs.draw, bestD.price);
    const evA = calculateExpectedValue(fairProbs.away, bestA.price);

    const evCandidates = [
      { sel: 'Local' as const, val: evH, quote: bestH, prob: fairProbs.home },
      { sel: 'Empate' as const, val: evD, quote: bestD, prob: fairProbs.draw },
      { sel: 'Visitante' as const, val: evA, quote: bestA, prob: fairProbs.away },
    ].sort((a, b) => b.val - a.val);

    const bestCand = evCandidates[0];

    return {
      ...match,
      quotes: {
        home: mutatedQuotesH,
        draw: mutatedQuotesD,
        away: mutatedQuotesA,
      },
      medianOdds: { home: medH, draw: medD, away: medA },
      bestOdds: {
        home: { price: bestH.price, bookmakerName: bestH.bookmakerName, bookmakerId: bestH.bookmakerId, previousPrice: bestH.previousPrice },
        draw: { price: bestD.price, bookmakerName: bestD.bookmakerName, bookmakerId: bestD.bookmakerId },
        away: { price: bestA.price, bookmakerName: bestA.bookmakerName, bookmakerId: bestA.bookmakerId },
      },
      fairProbabilities: fairProbs,
      expectedValues: { home: evH, draw: evD, away: evA },
      highestEVSelection: bestCand?.val > 0 ? bestCand.sel : undefined,
      highestEVValue: bestCand?.val > 0 ? bestCand.val : undefined,
      highestEVBookmaker: bestCand?.val > 0 ? bestCand.quote.bookmakerName : undefined,
      highestEVPrice: bestCand?.val > 0 ? bestCand.quote.price : undefined,
      steamMoves: [...newSteamMoves, ...match.steamMoves].slice(0, 5),
    };
  });

  return { matches: updatedMatches, newSteamMoves };
}
