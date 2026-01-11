"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Users, 
  Target, 
  TrendingUp, 
  Calendar,
  Award,
  Activity
} from "lucide-react";
import { StatsCard, MiniStatsCard } from "@/components/ui/stats-card";
import { Card, LoadingSpinner, Badge } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import { 
  WinLossBarChart, 
  WinRatePieChart, 
  TeamBarChart,
  HorizontalBarChart,
  TrendLineChart 
} from "@/components/charts";
import { 
  loadMasterData, 
  loadTeamPerformance, 
  calculateBestPlayerPerMatch,
  calculateTopPlayers,
  getUniqueTeams
} from "@/lib/data";
import { PlayerMatchData, TeamPerformance, PlayerMatchContribution } from "@/lib/types";
import { getTeamShortName, formatPercentage } from "@/lib/utils";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [bestPlayers, setBestPlayers] = useState<PlayerMatchContribution[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [topBatsmen, setTopBatsmen] = useState<PlayerMatchContribution[]>([]);
  const [topBowlers, setTopBowlers] = useState<PlayerMatchContribution[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [master, performance] = await Promise.all([
          loadMasterData(),
          loadTeamPerformance(),
        ]);
        
        setMasterData(master);
        setTeamPerformance(performance);
        
        const best = calculateBestPlayerPerMatch(master);
        setBestPlayers(best);
        
        // Default to showing all data
        const allTopPlayers = calculateTopPlayers(master, 1, 10);
        setTopBatsmen(allTopPlayers.batsmen);
        setTopBowlers(allTopPlayers.bowlers);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  useEffect(() => {
    if (masterData.length > 0) {
      const seasonNum = selectedSeason === "all" ? 1 : parseInt(selectedSeason);
      const { batsmen, bowlers } = calculateTopPlayers(masterData, seasonNum, 10);
      setTopBatsmen(batsmen);
      setTopBowlers(bowlers);
    }
  }, [selectedSeason, masterData]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-400">Loading NPL Analytics...</p>
        </div>
      </div>
    );
  }

  // Calculate summary stats
  const totalMatches = new Set(masterData.map(d => d.match_id_unique)).size;
  const totalPlayers = new Set(masterData.map(d => d.player_name)).size;
  const totalRuns = masterData.reduce((sum, p) => sum + p.runs_scored, 0);
  const totalWickets = masterData.reduce((sum, p) => sum + p.wickets_taken, 0);
  const totalSixes = masterData.reduce((sum, p) => sum + p.sixes, 0);
  const totalFours = masterData.reduce((sum, p) => sum + p.fours, 0);

  // Prepare chart data
  const winLossData = teamPerformance.map(t => ({
    name: getTeamShortName(t.team),
    wins: t.wins,
    losses: t.losses,
    ties: t.ties,
  }));

  const winRateData = teamPerformance.map(t => ({
    name: getTeamShortName(t.team),
    value: t.win_rate,
  }));

  // Best performing team
  const bestTeam = teamPerformance.reduce((best, t) => 
    t.win_rate > best.win_rate ? t : best
  , teamPerformance[0]);

  // Top scorer
  const topScorer = topBatsmen[0];

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
            NPL Analytics Dashboard
          </motion.h1>
          <p className="mt-1 text-slate-400">
            Nepal Premier League • Season 1 & 2 Insights
          </p>
        </div>
        <Select
          label="Select Season"
          value={selectedSeason}
          onChange={setSelectedSeason}
          options={[
            { value: "all", label: "All Seasons" },
            { value: "1", label: "Season 1 (2024)" },
            { value: "2", label: "Season 2 (2025)" },
          ]}
          className="w-48"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Matches"
          value={totalMatches}
          subtitle="Across all seasons"
          icon={Trophy}
          color="bg-gradient-to-br from-indigo-500 to-purple-600"
        />
        <StatsCard
          title="Total Players"
          value={totalPlayers}
          subtitle="Unique players"
          icon={Users}
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatsCard
          title="Total Runs"
          value={totalRuns.toLocaleString()}
          subtitle={`${totalFours} fours • ${totalSixes} sixes`}
          icon={Target}
          color="bg-gradient-to-br from-orange-500 to-red-600"
        />
        <StatsCard
          title="Total Wickets"
          value={totalWickets}
          subtitle="All bowlers combined"
          icon={Activity}
          color="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
      </div>

      {/* Highlights Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
              <Award className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Best Performing Team</p>
              <p className="text-xl font-bold text-white">
                {bestTeam?.team.replace(" (NPL)", "")}
              </p>
              <Badge variant="success">{formatPercentage(bestTeam?.win_rate || 0)} Win Rate</Badge>
            </div>
          </div>
        </Card>
        
        <Card className="md:col-span-1">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Top Run Scorer</p>
              <p className="text-xl font-bold text-white">
                {topScorer?.player_name || "N/A"}
              </p>
              <Badge variant="default">{topScorer?.runs || 0} Runs</Badge>
            </div>
          </div>
        </Card>
        
        <Card className="md:col-span-1">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Matches Per Season</p>
              <p className="text-xl font-bold text-white">32</p>
              <Badge variant="default">Regular Season</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Win/Loss Chart */}
        <Card title="Team Win/Loss Record" subtitle="All seasons combined">
          <WinLossBarChart data={winLossData} showTies />
        </Card>

        {/* Win Rate Chart */}
        <Card title="Team Win Rates" subtitle="Performance comparison">
          <TeamBarChart data={winRateData} valueKey="value" />
        </Card>
      </div>

      {/* Top Players Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Batsmen */}
        <Card 
          title="Top Run Scorers" 
          subtitle={selectedSeason === "all" ? "Season 1" : `Season ${selectedSeason}`}
        >
          <HorizontalBarChart 
            data={topBatsmen.map(p => ({ 
              name: p.player_name.length > 15 
                ? p.player_name.substring(0, 15) + "..." 
                : p.player_name,
              value: p.runs 
            }))} 
            valueKey="value"
          />
        </Card>

        {/* Top Bowlers */}
        <Card 
          title="Top Wicket Takers" 
          subtitle={selectedSeason === "all" ? "Season 1" : `Season ${selectedSeason}`}
        >
          <HorizontalBarChart 
            data={topBowlers.map(p => ({ 
              name: p.player_name.length > 15 
                ? p.player_name.substring(0, 15) + "..." 
                : p.player_name,
              value: p.wickets 
            }))} 
            valueKey="value"
          />
        </Card>
      </div>

      {/* Recent Best Players */}
      <Card title="Best Player Per Match" subtitle="Top performers from recent matches">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="pb-3 text-left text-sm font-medium text-slate-400">Match</th>
                <th className="pb-3 text-left text-sm font-medium text-slate-400">Player</th>
                <th className="pb-3 text-left text-sm font-medium text-slate-400">Team</th>
                <th className="pb-3 text-right text-sm font-medium text-slate-400">Runs</th>
                <th className="pb-3 text-right text-sm font-medium text-slate-400">Wickets</th>
                <th className="pb-3 text-right text-sm font-medium text-slate-400">Points</th>
              </tr>
            </thead>
            <tbody>
              {bestPlayers.slice(0, 10).map((player, idx) => (
                <motion.tr
                  key={`${player.match_id_unique}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-slate-700/50"
                >
                  <td className="py-3 text-sm text-slate-300">{player.match_id_unique}</td>
                  <td className="py-3 text-sm font-medium text-white">{player.player_name}</td>
                  <td className="py-3 text-sm text-slate-400">
                    {getTeamShortName(player.team)}
                  </td>
                  <td className="py-3 text-right text-sm text-emerald-400">{player.runs}</td>
                  <td className="py-3 text-right text-sm text-purple-400">{player.wickets}</td>
                  <td className="py-3 text-right text-sm font-semibold text-indigo-400">
                    {player.total_points}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
