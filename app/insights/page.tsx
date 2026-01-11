"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Lightbulb, TrendingUp, TrendingDown, Award, 
  Target, Users, Zap, BarChart3, Star, AlertTriangle 
} from "lucide-react";
import { Card, LoadingSpinner, Badge, Tabs } from "@/components/ui/common";
import { StatsCard } from "@/components/ui/stats-card";
import { PlayerRadarChart, TrendLineChart, HorizontalBarChart } from "@/components/charts";
import { loadMasterData, loadTeamPerformance, loadMatchResults, loadTossImpact } from "@/lib/data";
import { PlayerMatchData, TeamPerformance, MatchResult, TossImpact } from "@/lib/types";
import { getTeamShortName, getTeamColor, formatPercentage } from "@/lib/utils";

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [tossImpact, setTossImpact] = useState<TossImpact[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadAllData() {
      try {
        const [master, teams, matches, toss] = await Promise.all([
          loadMasterData(),
          loadTeamPerformance(),
          loadMatchResults(),
          loadTossImpact(),
        ]);
        setMasterData(master);
        setTeamPerformance(teams);
        setMatchResults(matches);
        setTossImpact(toss);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  // Calculate insights
  const insights = useMemo(() => {
    if (!masterData.length || !teamPerformance.length) return null;

    // Top performers
    const playerAgg = new Map<string, { runs: number; wickets: number; matches: number; team: string }>();
    masterData.forEach(d => {
      const key = d.player_name;
      const existing = playerAgg.get(key) || { runs: 0, wickets: 0, matches: 0, team: d.team };
      existing.runs += d.runs_scored;
      existing.wickets += d.wickets_taken;
      existing.matches++;
      playerAgg.set(key, existing);
    });

    const players = Array.from(playerAgg.entries()).map(([name, data]) => ({
      name,
      ...data,
      avg: data.runs / (data.matches || 1),
    }));

    const topScorer = players.sort((a, b) => b.runs - a.runs)[0];
    const topWicketTaker = players.sort((a, b) => b.wickets - a.wickets)[0];
    const mostConsistent = players
      .filter(p => p.matches >= 5)
      .sort((a, b) => b.avg - a.avg)[0];

    // Team insights
    const bestTeam = teamPerformance.sort((a, b) => b.win_rate - a.win_rate)[0];
    const worstTeam = teamPerformance.sort((a, b) => a.win_rate - b.win_rate)[0];

    // Match insights
    const totalMatches = matchResults.length;
    const closeMatches = matchResults.filter(m => m.won === 1 || m.lost === 1);

    // Toss insights
    const avgTossWinAdvantage = tossImpact.length > 0
      ? tossImpact.reduce((sum, t) => sum + t.win_rate, 0) / tossImpact.length
      : 0;

    // Season comparison
    const season1Data = masterData.filter(d => d.season === 1);
    const season2Data = masterData.filter(d => d.season === 2);
    const season1AvgScore = season1Data.reduce((sum, d) => sum + d.runs_scored, 0) / 
      new Set(season1Data.map(d => d.match_id_unique)).size;
    const season2AvgScore = season2Data.reduce((sum, d) => sum + d.runs_scored, 0) / 
      new Set(season2Data.map(d => d.match_id_unique)).size;

    // Aggregate stats
    const totalRuns = masterData.reduce((sum, d) => sum + d.runs_scored, 0);
    const totalWickets = masterData.reduce((sum, d) => sum + d.wickets_taken, 0);
    const totalFours = masterData.reduce((sum, d) => sum + d.fours, 0);
    const totalSixes = masterData.reduce((sum, d) => sum + d.sixes, 0);
    const uniquePlayers = new Set(masterData.map(d => d.player_name)).size;
    const uniqueTeams = new Set(masterData.map(d => d.team)).size;

    return {
      topScorer,
      topWicketTaker,
      mostConsistent,
      bestTeam,
      worstTeam,
      totalMatches,
      closeMatches,
      avgTossWinAdvantage,
      season1AvgScore,
      season2AvgScore,
      totalRuns,
      totalWickets,
      totalFours,
      totalSixes,
      uniquePlayers,
      uniqueTeams,
      players,
    };
  }, [masterData, teamPerformance, matchResults, tossImpact]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-slate-400">No data available for insights</p>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Lightbulb },
    { id: "records", label: "Records", icon: Award },
    { id: "trends", label: "Trends", icon: TrendingUp },
    { id: "predictions", label: "Analysis", icon: Zap },
  ];

  // Trend data for visualization
  const seasonTrendData = [
    { name: "Season 1", avgScore: Math.round(insights.season1AvgScore || 0), matches: matchResults.filter(m => m.season === 1).length },
    { name: "Season 2", avgScore: Math.round(insights.season2AvgScore || 0), matches: matchResults.filter(m => m.season === 2).length },
  ];

  // Player performance data for radar
  const topPlayersRadar = insights.players
    .sort((a, b) => b.runs + b.wickets * 20 - (a.runs + a.wickets * 20))
    .slice(0, 5)
    .map(p => ({
      player: p.name,
      batting: Math.min(100, (p.runs / (insights.topScorer?.runs || 1)) * 100),
      bowling: Math.min(100, (p.wickets / (insights.topWicketTaker?.wickets || 1)) * 100),
      consistency: Math.min(100, (p.avg / 50) * 100),
      experience: Math.min(100, (p.matches / 20) * 100),
      impact: Math.min(100, ((p.runs + p.wickets * 20) / 500) * 100),
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white"
          >
            NPL Insights & Analytics
          </motion.h1>
          <p className="mt-1 text-slate-400">
            Key findings, records, and analytical observations
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Runs"
          value={insights.totalRuns.toLocaleString()}
          subtitle={`Across ${insights.totalMatches} matches`}
          icon={Target}
          color="bg-gradient-to-br from-emerald-500 to-green-600"
        />
        <StatsCard
          title="Total Wickets"
          value={insights.totalWickets}
          subtitle={`${insights.uniquePlayers} players`}
          icon={Zap}
          color="bg-gradient-to-br from-red-500 to-orange-600"
        />
        <StatsCard
          title="Boundaries"
          value={insights.totalFours + insights.totalSixes}
          subtitle={`${insights.totalFours} 4s, ${insights.totalSixes} 6s`}
          icon={TrendingUp}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatsCard
          title="Teams"
          value={insights.uniqueTeams}
          subtitle="Competing in NPL"
          icon={Users}
          color="bg-gradient-to-br from-purple-500 to-pink-600"
        />
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Insights Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Top Scorer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-l-4 border-l-emerald-500">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-emerald-500/20 p-3">
                    <Award className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Top Run Scorer</p>
                    <h3 className="text-xl font-bold text-white">{insights.topScorer?.name || "N/A"}</h3>
                    <p className="text-2xl font-bold text-emerald-400">{insights.topScorer?.runs || 0} runs</p>
                    <p className="text-sm text-slate-500">{insights.topScorer?.team.replace(" (NPL)", "")}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Top Wicket Taker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-l-4 border-l-red-500">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-red-500/20 p-3">
                    <Target className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Top Wicket Taker</p>
                    <h3 className="text-xl font-bold text-white">{insights.topWicketTaker?.name || "N/A"}</h3>
                    <p className="text-2xl font-bold text-red-400">{insights.topWicketTaker?.wickets || 0} wickets</p>
                    <p className="text-sm text-slate-500">{insights.topWicketTaker?.team.replace(" (NPL)", "")}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Best Team */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-l-4 border-l-blue-500">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-blue-500/20 p-3">
                    <Star className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Best Performing Team</p>
                    <h3 className="text-xl font-bold text-white">
                      {insights.bestTeam?.team?.replace(" (NPL)", "") || "N/A"}
                    </h3>
                    <p className="text-2xl font-bold text-blue-400">
                      {formatPercentage(insights.bestTeam?.win_rate || 0)} win rate
                    </p>
                    <p className="text-sm text-slate-500">
                      {insights.bestTeam?.wins || 0}W - {insights.bestTeam?.losses || 0}L
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Key Observations */}
          <Card title="Key Observations" subtitle="Notable patterns from the data">
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-transparent p-4">
                <TrendingUp className="mt-1 h-5 w-5 text-emerald-400" />
                <div>
                  <h4 className="font-semibold text-white">Scoring Trend</h4>
                  <p className="text-sm text-slate-400">
                    Average match score {insights.season2AvgScore > insights.season1AvgScore ? "increased" : "decreased"} from 
                    Season 1 ({Math.round(insights.season1AvgScore || 0)}) to Season 2 ({Math.round(insights.season2AvgScore || 0)}), 
                    indicating {insights.season2AvgScore > insights.season1AvgScore ? "better batting conditions or improved batting depth" : "improved bowling performances"}.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-transparent p-4">
                <BarChart3 className="mt-1 h-5 w-5 text-blue-400" />
                <div>
                  <h4 className="font-semibold text-white">Toss Advantage</h4>
                  <p className="text-sm text-slate-400">
                    Teams winning the toss have a {formatPercentage(insights.avgTossWinAdvantage)} win rate, 
                    {insights.avgTossWinAdvantage > 50 ? " suggesting a significant toss advantage" : " showing toss doesn't heavily influence match outcomes"}.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent p-4">
                <Zap className="mt-1 h-5 w-5 text-purple-400" />
                <div>
                  <h4 className="font-semibold text-white">Close Contests</h4>
                  <p className="text-sm text-slate-400">
                    {insights.closeMatches.length} out of {insights.totalMatches} matches ({formatPercentage((insights.closeMatches.length / insights.totalMatches) * 100)}) 
                    were decided by less than 10 runs, showcasing the competitive nature of the league.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "records" && (
        <div className="space-y-6">
          {/* Record Holders */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Batting Records */}
            <Card title="Batting Records" subtitle="Top performers across NPL">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-white">{insights.topScorer?.name}</p>
                      <p className="text-xs text-slate-400">{insights.topScorer?.team.replace(" (NPL)", "")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{insights.topScorer?.runs} runs</p>
                    <p className="text-xs text-slate-400">{insights.topScorer?.matches} matches</p>
                  </div>
                </div>

                {insights.players
                  .sort((a, b) => b.runs - a.runs)
                  .slice(1, 6)
                  .map((player, idx) => (
                    <div key={player.name} className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-300">
                          {idx + 2}
                        </div>
                        <div>
                          <p className="font-medium text-white">{player.name}</p>
                          <p className="text-xs text-slate-400">{player.team.replace(" (NPL)", "")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-300">{player.runs} runs</p>
                        <p className="text-xs text-slate-400">{player.matches} matches</p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Bowling Records */}
            <Card title="Bowling Records" subtitle="Top wicket takers">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-white">{insights.topWicketTaker?.name}</p>
                      <p className="text-xs text-slate-400">{insights.topWicketTaker?.team.replace(" (NPL)", "")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-400">{insights.topWicketTaker?.wickets} wickets</p>
                    <p className="text-xs text-slate-400">{insights.topWicketTaker?.matches} matches</p>
                  </div>
                </div>

                {insights.players
                  .sort((a, b) => b.wickets - a.wickets)
                  .slice(1, 6)
                  .map((player, idx) => (
                    <div key={player.name} className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-300">
                          {idx + 2}
                        </div>
                        <div>
                          <p className="font-medium text-white">{player.name}</p>
                          <p className="text-xs text-slate-400">{player.team.replace(" (NPL)", "")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-300">{player.wickets} wickets</p>
                        <p className="text-xs text-slate-400">{player.matches} matches</p>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* Team Records */}
          <Card title="Team Records" subtitle="Best and worst performances">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-4">
                <h4 className="text-sm text-emerald-400">Highest Win Rate</h4>
                <p className="text-xl font-bold text-white">{insights.bestTeam?.team?.replace(" (NPL)", "")}</p>
                <p className="text-3xl font-bold text-emerald-400">{formatPercentage(insights.bestTeam?.win_rate || 0)}</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/10 p-4">
                <h4 className="text-sm text-red-400">Lowest Win Rate</h4>
                <p className="text-xl font-bold text-white">{insights.worstTeam?.team?.replace(" (NPL)", "")}</p>
                <p className="text-3xl font-bold text-red-400">{formatPercentage(insights.worstTeam?.win_rate || 0)}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "trends" && (
        <div className="space-y-6">
          {/* Season Comparison */}
          <Card title="Season Comparison" subtitle="How NPL has evolved">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <h4 className="text-sm text-slate-400">Season 1 (2024)</h4>
                  <p className="text-2xl font-bold text-white">
                    {matchResults.filter(m => m.season === 1).length} matches
                  </p>
                  <p className="text-slate-400">
                    Avg Score: <span className="text-emerald-400">{Math.round(insights.season1AvgScore || 0)}</span>
                  </p>
                </div>
                <div className="rounded-lg bg-slate-800/50 p-4">
                  <h4 className="text-sm text-slate-400">Season 2 (2025)</h4>
                  <p className="text-2xl font-bold text-white">
                    {matchResults.filter(m => m.season === 2).length} matches
                  </p>
                  <p className="text-slate-400">
                    Avg Score: <span className="text-emerald-400">{Math.round(insights.season2AvgScore || 0)}</span>
                  </p>
                </div>
              </div>
              <div>
                <TrendLineChart
                  data={seasonTrendData}
                  dataKey="avgScore"
                  color="#8338EC"
                />
              </div>
            </div>
          </Card>

          {/* Performance Distribution */}
          <Card title="Performance Distribution" subtitle="Score distribution analysis">
            <HorizontalBarChart
              data={[
                { name: "0-100 runs", count: insights.players.filter(p => p.runs >= 0 && p.runs < 100).length },
                { name: "100-200 runs", count: insights.players.filter(p => p.runs >= 100 && p.runs < 200).length },
                { name: "200-300 runs", count: insights.players.filter(p => p.runs >= 200 && p.runs < 300).length },
                { name: "300-400 runs", count: insights.players.filter(p => p.runs >= 300 && p.runs < 400).length },
                { name: "400+ runs", count: insights.players.filter(p => p.runs >= 400).length },
              ]}
              valueKey="count"
            />
          </Card>
        </div>
      )}

      {activeTab === "predictions" && (
        <div className="space-y-6">
          {/* Top Players Analysis */}
          <Card title="Top Players Radar Analysis" subtitle="Multi-dimensional performance view">
            <PlayerRadarChart 
              data={[
                { subject: "Batting", player1: topPlayersRadar[0]?.batting || 0, player2: topPlayersRadar[1]?.batting || 0, fullMark: 100 },
                { subject: "Bowling", player1: topPlayersRadar[0]?.bowling || 0, player2: topPlayersRadar[1]?.bowling || 0, fullMark: 100 },
                { subject: "Consistency", player1: topPlayersRadar[0]?.consistency || 0, player2: topPlayersRadar[1]?.consistency || 0, fullMark: 100 },
                { subject: "Experience", player1: topPlayersRadar[0]?.experience || 0, player2: topPlayersRadar[1]?.experience || 0, fullMark: 100 },
                { subject: "Impact", player1: topPlayersRadar[0]?.impact || 0, player2: topPlayersRadar[1]?.impact || 0, fullMark: 100 },
              ]}
              player1Name={topPlayersRadar[0]?.player || "Player 1"}
              player2Name={topPlayersRadar[1]?.player || "Player 2"}
            />
          </Card>

          {/* Strategic Insights */}
          <Card title="Strategic Analysis" subtitle="Data-driven observations">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-400" />
                  <h4 className="font-semibold text-blue-400">Batting First vs Chasing</h4>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  Based on toss data analysis, teams that {insights.avgTossWinAdvantage > 55 ? "win the toss have a clear advantage" : 
                  insights.avgTossWinAdvantage > 50 ? "win the toss have a slight edge" : 
                  "lose the toss can still compete equally"}. 
                  The decision to bat or field should consider pitch conditions and team strengths.
                </p>
              </div>

              <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-400" />
                  <h4 className="font-semibold text-purple-400">Key Player Impact</h4>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  The top scorer ({insights.topScorer?.name}) contributes approximately{" "}
                  {formatPercentage((insights.topScorer?.runs || 0) / insights.totalRuns * 100)} of their team's total runs.
                  Teams heavily reliant on individual performances may struggle in knockout matches.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <h4 className="font-semibold text-emerald-400">Consistency Matters</h4>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {insights.mostConsistent?.name || "Top performers"} show the most consistent batting with an average of{" "}
                  {insights.mostConsistent?.avg?.toFixed(1) || "N/A"} runs per match. 
                  Consistency often trumps occasional big scores in tournament cricket.
                </p>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <h4 className="font-semibold text-amber-400">Areas of Concern</h4>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {insights.worstTeam?.team?.replace(" (NPL)", "")} with only {formatPercentage(insights.worstTeam?.win_rate || 0)} win rate
                  needs to focus on building team depth and consistency. Heavy reliance on a few players is evident.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
