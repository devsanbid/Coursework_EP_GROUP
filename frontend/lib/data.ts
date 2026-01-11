import Papa from "papaparse";
import {
  PlayerMatchData,
  TeamPerformance,
  MatchResult,
  BowlingStats,
  CombinedStats,
  PlayerMatchContribution,
  TossImpact,
} from "./types";

// Helper to parse CSV from file path
async function parseCSV<T>(filePath: string): Promise<T[]> {
  const response = await fetch(filePath);
  const csvText = await response.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as T[]);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

// Load master dataset
export async function loadMasterData(): Promise<PlayerMatchData[]> {
  return parseCSV<PlayerMatchData>("/data/npl_master.csv");
}

// Load team performance summary
export async function loadTeamPerformance(): Promise<TeamPerformance[]> {
  const data = await parseCSV<Record<string, string | number>>("/data/team_performance_summary.csv");
  return data.map((row) => ({
    team: row.team as string,
    wins: Number(row.Win),
    losses: Number(row.Loss),
    ties: Number(row.Tie),
    total: Number(row.Total),
    win_rate: Number(row.Win_Rate),
    performance: row.Performance as string,
  }));
}

// Load match level results
export async function loadMatchResults(): Promise<MatchResult[]> {
  return parseCSV<MatchResult>("/data/match_level_results.csv");
}

// Load toss impact
export async function loadTossImpact(): Promise<TossImpact[]> {
  const data = await parseCSV<Record<string, string | number>>("/data/toss_impact.csv");
  return data.map((row) => ({
    toss_status: row.Toss_Status as string,
    total_matches: Number(row.Total_Matches),
    wins: Number(row.Wins),
    losses: Number(row.Losses),
    ties: Number(row.Ties),
    win_rate: Number(row.Win_Rate),
  }));
}

// Load bowling stats
export async function loadBowlingStats(): Promise<BowlingStats[]> {
  const data = await parseCSV<Record<string, string | number>>("/data/bowling_stats.csv");
  return data.map((row) => ({
    player: row.Player as string,
    team: row.Team as string,
    span: row.Span as string,
    matches: Number(row.Mat),
    overs: Number(row.Overs),
    maidens: Number(row.Mdns),
    balls: Number(row.Balls),
    runs: Number(row.Runs),
    wickets: Number(row.Wkts),
    bbi: row.BBI as string,
    average: Number(row.Ave) || 0,
    economy: Number(row.Econ),
    strike_rate: Number(row.SR) || 0,
    four_wickets: Number(row["4w"]) || 0,
    five_wickets: Number(row["5w"]) || 0,
  }));
}

// Load combined stats
export async function loadCombinedStats(): Promise<CombinedStats[]> {
  const data = await parseCSV<Record<string, string | number>>("/data/combined_stats.csv");
  return data.map((row) => ({
    player: row.Player as string,
    team: row.Team as string,
    span: row.Span as string,
    matches: Number(row.Mat),
    innings: Number(row.Inns),
    not_outs: Number(row.NO),
    runs_bat: Number(row.Runs_bat),
    highest_score: row.HS as string,
    batting_average: Number(row.Ave_bat) || 0,
    balls_faced: Number(row.BF),
    strike_rate: Number(row.SR_bat) || 0,
    hundreds: Number(row["100"]) || 0,
    fifties: Number(row["50"]) || 0,
    ducks: Number(row["0"]) || 0,
    fours: Number(row["4s"]) || 0,
    sixes: Number(row["6s"]) || 0,
    overs: Number(row.Overs) || 0,
    maidens: Number(row.Mdns) || 0,
    balls_bowled: Number(row.Balls) || 0,
    runs_bowl: Number(row.Runs_bowl) || 0,
    wickets: Number(row.Wkts) || 0,
    bbi: row.BBI as string || "-",
    bowling_average: Number(row.Ave_bowl) || 0,
    economy: Number(row.Econ) || 0,
    bowling_sr: Number(row.SR_bowl) || 0,
    four_wickets: Number(row["4w"]) || 0,
    five_wickets: Number(row["5w"]) || 0,
  }));
}

// Calculate best player per match
export function calculateBestPlayerPerMatch(
  data: PlayerMatchData[]
): PlayerMatchContribution[] {
  const matchGroups = data.reduce((acc, player) => {
    const key = player.match_id_unique;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(player);
    return acc;
  }, {} as Record<string, PlayerMatchData[]>);

  const bestPlayers: PlayerMatchContribution[] = [];

  Object.entries(matchGroups).forEach(([matchId, players]) => {
    const contributions = players.map((p) => {
      // Batting points: runs + boundary bonus
      const battingPoints = p.runs_scored + (p.fours * 1) + (p.sixes * 2);
      
      // Bowling points: wickets * 25 + economy bonus
      const bowlingPoints = p.wickets_taken * 25 + 
        (p.overs_bowled > 0 && p.economy_rate < 6 ? 10 : 0);
      
      // Fielding points
      const fieldingPoints = (p.catches * 10) + (p.run_outs * 10) + (p.stumpings * 10);
      
      return {
        player_name: p.player_name,
        team: p.team,
        match_id_unique: matchId,
        match_date: p.match_date,
        batting_points: battingPoints,
        bowling_points: bowlingPoints,
        fielding_points: fieldingPoints,
        total_points: battingPoints + bowlingPoints + fieldingPoints,
        runs: p.runs_scored,
        wickets: p.wickets_taken,
        catches: p.catches,
      };
    });

    // Find the player with highest points
    const best = contributions.reduce((max, current) =>
      current.total_points > max.total_points ? current : max
    );
    
    bestPlayers.push(best);
  });

  return bestPlayers;
}

// Calculate top 15 players per season
export function calculateTopPlayers(
  data: PlayerMatchData[],
  season: number,
  limit: number = 15
): { batsmen: PlayerMatchContribution[]; bowlers: PlayerMatchContribution[] } {
  const seasonData = data.filter((p) => p.season === season);
  
  // Aggregate player stats
  const playerStats = seasonData.reduce((acc, p) => {
    if (!acc[p.player_name]) {
      acc[p.player_name] = {
        player_name: p.player_name,
        team: p.team,
        matches: new Set<string>(),
        runs: 0,
        wickets: 0,
        catches: 0,
        fours: 0,
        sixes: 0,
        balls_faced: 0,
        overs_bowled: 0,
        runs_conceded: 0,
      };
    }
    acc[p.player_name].matches.add(p.match_id_unique);
    acc[p.player_name].runs += p.runs_scored;
    acc[p.player_name].wickets += p.wickets_taken;
    acc[p.player_name].catches += p.catches;
    acc[p.player_name].fours += p.fours;
    acc[p.player_name].sixes += p.sixes;
    acc[p.player_name].balls_faced += p.balls_faced;
    acc[p.player_name].overs_bowled += p.overs_bowled;
    acc[p.player_name].runs_conceded += p.runs_conceded;
    return acc;
  }, {} as Record<string, { player_name: string; team: string; matches: Set<string>; runs: number; wickets: number; catches: number; fours: number; sixes: number; balls_faced: number; overs_bowled: number; runs_conceded: number }>);

  const players = Object.values(playerStats).map((p) => ({
    player_name: p.player_name,
    team: p.team,
    match_id_unique: "",
    match_date: "",
    batting_points: p.runs + (p.fours * 1) + (p.sixes * 2),
    bowling_points: p.wickets * 25,
    fielding_points: p.catches * 10,
    total_points: p.runs + (p.fours * 1) + (p.sixes * 2) + (p.wickets * 25) + (p.catches * 10),
    runs: p.runs,
    wickets: p.wickets,
    catches: p.catches,
  }));

  // Top batsmen by runs
  const batsmen = [...players]
    .sort((a, b) => b.runs - a.runs)
    .slice(0, limit);

  // Top bowlers by wickets
  const bowlers = [...players]
    .filter((p) => p.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, limit);

  return { batsmen, bowlers };
}

// Calculate team vs team head-to-head
export function calculateHeadToHead(
  data: PlayerMatchData[]
): Record<string, Record<string, { wins: number; losses: number }>> {
  const h2h: Record<string, Record<string, { wins: number; losses: number }>> = {};
  
  const matches = data.reduce((acc, p) => {
    const key = p.match_id_unique;
    if (!acc[key]) {
      acc[key] = { team: p.batting_team, opposition: p.opposition, result: p.match_result };
    }
    return acc;
  }, {} as Record<string, { team: string; opposition: string; result: string }>);

  Object.values(matches).forEach((match) => {
    if (!h2h[match.team]) h2h[match.team] = {};
    if (!h2h[match.team][match.opposition]) {
      h2h[match.team][match.opposition] = { wins: 0, losses: 0 };
    }
    
    if (match.result === "Win") {
      h2h[match.team][match.opposition].wins++;
    } else if (match.result === "Loss") {
      h2h[match.team][match.opposition].losses++;
    }
  });

  return h2h;
}

// Get unique teams
export function getUniqueTeams(data: PlayerMatchData[]): string[] {
  return [...new Set(data.map((p) => p.team))].sort();
}

// Get unique players
export function getUniquePlayers(data: PlayerMatchData[]): string[] {
  return [...new Set(data.map((p) => p.player_name))].sort();
}

// Get unique matches
export function getUniqueMatches(data: PlayerMatchData[]): string[] {
  return [...new Set(data.map((p) => p.match_id_unique))];
}

// Filter data by criteria
export function filterData(
  data: PlayerMatchData[],
  filters: {
    season?: number | "all";
    team?: string | "all";
    player?: string | "all";
    match?: string | "all";
  }
): PlayerMatchData[] {
  return data.filter((p) => {
    if (filters.season && filters.season !== "all" && p.season !== filters.season) {
      return false;
    }
    if (filters.team && filters.team !== "all" && p.team !== filters.team) {
      return false;
    }
    if (filters.player && filters.player !== "all" && p.player_name !== filters.player) {
      return false;
    }
    if (filters.match && filters.match !== "all" && p.match_id_unique !== filters.match) {
      return false;
    }
    return true;
  });
}
