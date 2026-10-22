export interface ApiFootballAccountStatus {
  connected: boolean;
  accountEmail?: string;
  plan?: string;
  requestsUsedToday: number;
  requestsLimitDay: number;
  remainingRequests: number;
  serverTimestamp: string;
}

export interface TeamStatistics {
  teamId: number;
  teamName: string;
  formLast5: string[]; // ['W', 'W', 'D', 'L', 'W']
  goalsScoredAvg: number;
  goalsConcededAvg: number;
  cleanSheets: number;
  leaguePosition: number;
  points: number;
}

export interface HeadToHeadRecord {
  homeWins: number;
  draws: number;
  awayWins: number;
  totalMatches: number;
  recentMeetings: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    competition: string;
  }>;
}

export interface MatchEnrichmentData {
  matchId: string;
  homeTeamStats?: TeamStatistics;
  awayTeamStats?: TeamStatistics;
  h2h?: HeadToHeadRecord;
  referee?: string;
  stadiumName?: string;
}

// Client helper to fetch API-Football status and enriched data through server proxy
export async function fetchFootballApiStatus(): Promise<ApiFootballAccountStatus> {
  try {
    const res = await fetch('/api/football/status');
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch {
    return {
      connected: false,
      requestsUsedToday: 0,
      requestsLimitDay: 100,
      remainingRequests: 100,
      serverTimestamp: new Date().toISOString(),
    };
  }
}

export async function fetchMatchEnrichment(
  homeTeam: string,
  awayTeam: string,
  competitionName: string
): Promise<MatchEnrichmentData | null> {
  try {
    const res = await fetch(
      `/api/football/enrich?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}&league=${encodeURIComponent(competitionName)}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
