// Master dataset types
export interface PlayerMatchData {
  player_name: string;
  team: string;
  player_role: string;
  runs_scored: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  out_status: string;
  dismissal_type: string;
  overs_bowled: number;
  runs_conceded: number;
  wickets_taken: number;
  maidens: number;
  economy_rate: number;
  catches: number;
  run_outs: number;
  stumpings: number;
  match_id: number;
  match_date: string;
  venue: string;
  batting_team: string;
  opposition: string;
  match_result: "Win" | "Loss" | "Tie";
  toss_winner: string;
  toss_decision: string;
  season: number;
  match_id_unique: string;
}

// Aggregated player stats
export interface PlayerSeasonStats {
  player_name: string;
  team: string;
  matches: number;
  innings: number;
  runs: number;
  highest_score: string;
  batting_average: number;
  balls_faced: number;
  strike_rate: number;
  hundreds: number;
  fifties: number;
  fours: number;
  sixes: number;
  overs_bowled: number;
  runs_conceded: number;
  wickets: number;
  bowling_average: number;
  economy: number;
  best_bowling: string;
  catches: number;
  run_outs: number;
  stumpings: number;
}

// Team performance
export interface TeamPerformance {
  team: string;
  wins: number;
  losses: number;
  ties: number;
  total: number;
  win_rate: number;
  performance: string;
  season?: number;
}

// Match result
export interface MatchResult {
  match_id_unique: string;
  team: string;
  opposition: string;
  match_result: string;
  match_date: string;
  venue: string;
  season: number;
  toss_winner: string;
  toss_decision: string;
  won: number;
  lost: number;
  tied: number;
  toss_won: number;
}

// Toss impact data
export interface TossImpact {
  toss_status: string;
  total_matches: number;
  wins: number;
  losses: number;
  ties: number;
  win_rate: number;
}

// Player match contribution (for best player analysis)
export interface PlayerMatchContribution {
  player_name: string;
  team: string;
  match_id_unique: string;
  match_date: string;
  batting_points: number;
  bowling_points: number;
  fielding_points: number;
  total_points: number;
  runs: number;
  wickets: number;
  catches: number;
}

// Bowling stats
export interface BowlingStats {
  player: string;
  team: string;
  span: string;
  matches: number;
  overs: number;
  maidens: number;
  balls: number;
  runs: number;
  wickets: number;
  bbi: string;
  average: number;
  economy: number;
  strike_rate: number;
  four_wickets: number;
  five_wickets: number;
}

// Combined stats
export interface CombinedStats {
  player: string;
  team: string;
  span: string;
  matches: number;
  innings: number;
  not_outs: number;
  runs_bat: number;
  highest_score: string;
  batting_average: number;
  balls_faced: number;
  strike_rate: number;
  hundreds: number;
  fifties: number;
  ducks: number;
  fours: number;
  sixes: number;
  overs: number;
  maidens: number;
  balls_bowled: number;
  runs_bowl: number;
  wickets: number;
  bbi: string;
  bowling_average: number;
  economy: number;
  bowling_sr: number;
  four_wickets: number;
  five_wickets: number;
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface StackedChartData {
  name: string;
  [key: string]: string | number;
}

export interface RadarChartData {
  subject: string;
  player1: number;
  player2?: number;
  fullMark: number;
}

// Cricket field zones
export interface ScoringZone {
  zone: string;
  runs: number;
  fours: number;
  sixes: number;
  dismissals: number;
  shotType?: string;
}

// Filter state
export interface FilterState {
  season: number | "all";
  team: string | "all";
  player: string | "all";
  match: string | "all";
}

// Season comparison
export interface SeasonComparison {
  team: string;
  season1_wins: number;
  season1_losses: number;
  season1_win_rate: number;
  season2_wins: number;
  season2_losses: number;
  season2_win_rate: number;
  improvement: number;
}
