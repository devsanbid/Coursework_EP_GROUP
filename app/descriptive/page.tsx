"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Trophy,
  Users,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Activity,
  Download,
  PieChart,
  Percent,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, LoadingSpinner, Badge } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import {
  WinLossBarChart,
  WinRatePieChart,
  TeamBarChart,
  HorizontalBarChart,
  ParetoChart,
  PlayerRadarChart,
} from "@/components/charts";
import {
  loadMasterData,
  loadTeamPerformance,
  calculateBestPlayerPerMatch,
  calculateTopPlayers,
} from "@/lib/data";
import { PlayerMatchData, TeamPerformance, PlayerMatchContribution } from "@/lib/types";
import { getTeamShortName, formatPercentage } from "@/lib/utils";

export default function DescriptivePage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [bestPlayers, setBestPlayers] = useState<PlayerMatchContribution[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [topBatsmen, setTopBatsmen] = useState<PlayerMatchContribution[]>([]);
  const [topBowlers, setTopBowlers] = useState<PlayerMatchContribution[]>([]);
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>("");
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>("");

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

  // Download report function
  const downloadReport = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Title
    pdf.setFontSize(24);
    pdf.setTextColor(79, 70, 229);
    pdf.text("NPL Descriptive Analytics Report", pageWidth / 2, 20, { align: "center" });

    // Subtitle
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text("What Happened? - Historical Performance Summary", pageWidth / 2, 30, { align: "center" });
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 37, { align: "center" });

    // Summary Stats
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Key Statistics", 20, 55);

    pdf.setFontSize(11);
    const totalMatches = new Set(masterData.map(d => d.match_id_unique)).size;
    const totalPlayers = new Set(masterData.map(d => d.player_name)).size;
    const totalRuns = masterData.reduce((sum, p) => sum + p.runs_scored, 0);
    const totalWickets = masterData.reduce((sum, p) => sum + p.wickets_taken, 0);

    const stats = [
      `Total Matches: ${totalMatches}`,
      `Total Players: ${totalPlayers}`,
      `Total Runs Scored: ${totalRuns.toLocaleString()}`,
      `Total Wickets Taken: ${totalWickets}`,
    ];

    stats.forEach((stat, i) => {
      pdf.text(stat, 25, 65 + i * 8);
    });

    // Team Performance
    pdf.setFontSize(14);
    pdf.text("Team Performance Summary", 20, 105);

    pdf.setFontSize(10);
    let yPos = 115;
    teamPerformance.forEach((team) => {
      pdf.text(
        `${team.team.replace(" (NPL)", "")}: ${team.wins}W - ${team.losses}L (${formatPercentage(team.win_rate)} Win Rate)`,
        25,
        yPos
      );
      yPos += 7;
    });

    // Top Batsmen
    pdf.setFontSize(14);
    pdf.text("Top Run Scorers", 20, yPos + 10);

    pdf.setFontSize(10);
    yPos += 20;
    topBatsmen.slice(0, 5).forEach((player, i) => {
      pdf.text(`${i + 1}. ${player.player_name}: ${player.runs} runs`, 25, yPos);
      yPos += 7;
    });

    // Top Bowlers
    pdf.setFontSize(14);
    pdf.text("Top Wicket Takers", 20, yPos + 10);

    pdf.setFontSize(10);
    yPos += 20;
    topBowlers.slice(0, 5).forEach((player, i) => {
      pdf.text(`${i + 1}. ${player.player_name}: ${player.wickets} wickets`, 25, yPos);
      yPos += 7;
    });

    pdf.save(`descriptive-analytics-${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-400">Loading Descriptive Analytics...</p>
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

  const bestTeam = teamPerformance.reduce((best, t) =>
    t.win_rate > best.win_rate ? t : best
    , teamPerformance[0]);

  const topScorer = topBatsmen[0];

  // Calculate Pareto data for run contributors (80/20 rule)
  const allPlayerRuns = Object.values(
    masterData.reduce((acc, p) => {
      if (!acc[p.player_name]) {
        acc[p.player_name] = { name: p.player_name, runs: 0 };
      }
      acc[p.player_name].runs += p.runs_scored;
      return acc;
    }, {} as Record<string, { name: string; runs: number }>)
  ).sort((a, b) => b.runs - a.runs).slice(0, 15);

  const totalRunsForPareto = allPlayerRuns.reduce((sum, p) => sum + p.runs, 0);
  let cumulativeRuns = 0;
  const paretoData = allPlayerRuns.map((p) => {
    cumulativeRuns += p.runs;
    return {
      name: p.name.length > 12 ? p.name.substring(0, 12) + "..." : p.name,
      runs: p.runs,
      cumulative: Math.round((cumulativeRuns / totalRunsForPareto) * 100),
    };
  });

  // Find how many players contribute 80% of runs
  const players80Percent = paretoData.findIndex(p => p.cumulative >= 80) + 1;

  // Get unique players for comparison
  const uniquePlayers = [...new Set(masterData.map(p => p.player_name))].sort();

  // Calculate player stats for spider chart
  const getPlayerStats = (playerName: string) => {
    const playerMatches = masterData.filter(p => p.player_name === playerName);
    if (playerMatches.length === 0) return null;

    const totalRuns = playerMatches.reduce((sum, p) => sum + p.runs_scored, 0);
    const totalWickets = playerMatches.reduce((sum, p) => sum + p.wickets_taken, 0);
    const totalFours = playerMatches.reduce((sum, p) => sum + p.fours, 0);
    const totalSixes = playerMatches.reduce((sum, p) => sum + p.sixes, 0);
    const totalBallsFaced = playerMatches.reduce((sum, p) => sum + p.balls_faced, 0);
    const avgStrikeRate = totalBallsFaced > 0 ? (totalRuns / totalBallsFaced) * 100 : 0;
    const matchesPlayed = playerMatches.length;

    // Normalize to 0-100 scale
    const maxRuns = 600;
    const maxWickets = 30;
    const maxFours = 60;
    const maxSixes = 30;
    const maxSR = 200;

    return {
      runs: Math.min((totalRuns / maxRuns) * 100, 100),
      wickets: Math.min((totalWickets / maxWickets) * 100, 100),
      fours: Math.min((totalFours / maxFours) * 100, 100),
      sixes: Math.min((totalSixes / maxSixes) * 100, 100),
      strikeRate: Math.min((avgStrikeRate / maxSR) * 100, 100),
      matches: matchesPlayed,
      rawRuns: totalRuns,
      rawWickets: totalWickets,
    };
  };

  const player1Stats = selectedPlayer1 ? getPlayerStats(selectedPlayer1) : null;
  const player2Stats = selectedPlayer2 ? getPlayerStats(selectedPlayer2) : null;

  const radarData = player1Stats ? [
    { subject: "Runs", player1: player1Stats.runs, player2: player2Stats?.runs || 0, fullMark: 100 },
    { subject: "Wickets", player1: player1Stats.wickets, player2: player2Stats?.wickets || 0, fullMark: 100 },
    { subject: "Fours", player1: player1Stats.fours, player2: player2Stats?.fours || 0, fullMark: 100 },
    { subject: "Sixes", player1: player1Stats.sixes, player2: player2Stats?.sixes || 0, fullMark: 100 },
    { subject: "Strike Rate", player1: player1Stats.strikeRate, player2: player2Stats?.strikeRate || 0, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white flex items-center gap-3"
          >
            <BarChart3 className="h-8 w-8 text-indigo-400" />
            Descriptive Analytics
          </motion.h1>
          <p className="mt-1 text-slate-400">
            What happened? • Historical data summary and visualization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedSeason}
            onChange={(value) => setSelectedSeason(value)}
            options={[
              { value: "all", label: "All Seasons" },
              { value: "1", label: "Season 1 (2024)" },
              { value: "2", label: "Season 2 (2025)" },
            ]}
          />
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
        </div>
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
        <Card title="Team Win/Loss Record" subtitle="All seasons combined">
          <WinLossBarChart data={winLossData} showTies />
        </Card>

        <Card title="Team Win Rates" subtitle="Performance comparison">
          <TeamBarChart data={winRateData} valueKey="value" />
        </Card>
      </div>

      {/* Top Players Section */}
      <div className="grid gap-6 lg:grid-cols-2">
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

      {/* Pareto Analysis - 80/20 Rule */}
      <Card 
        title="Top Contributors - Pareto Analysis (80/20 Rule)" 
        subtitle={`${players80Percent} players contribute ~80% of total runs`}
      >
        <div className="mb-4 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 border border-indigo-500/20">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20">
              <Percent className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Pareto Principle (80/20 Rule)</h4>
              <p className="mt-1 text-xs text-slate-400">
                The Pareto principle states that roughly 80% of effects come from 20% of causes. 
                In NPL, <span className="text-indigo-400 font-semibold">{players80Percent} players</span> out of {uniquePlayers.length} ({((players80Percent / uniquePlayers.length) * 100).toFixed(0)}%) 
                contribute approximately 80% of total runs scored.
              </p>
            </div>
          </div>
        </div>
        <ParetoChart 
          data={paretoData} 
          valueKey="runs" 
          cumulativeKey="cumulative" 
        />
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-purple-500"></div>
            <span className="text-slate-400">Individual Run Contribution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-yellow-500"></div>
            <span className="text-slate-400">Cumulative Percentage</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-red-500" style={{ borderStyle: 'dashed' }}></div>
            <span className="text-slate-400">80% Threshold Line</span>
          </div>
        </div>
      </Card>

      {/* Player Comparison Spider Chart */}
      <Card title="Player Comparison - Spider Chart" subtitle="Compare performance metrics between two players">
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <Select
            label="Select Player 1"
            value={selectedPlayer1}
            onChange={setSelectedPlayer1}
            options={[
              { value: "", label: "Select a player..." },
              ...uniquePlayers.map(p => ({ value: p, label: p }))
            ]}
            searchable
            searchPlaceholder="Search player..."
          />
          <Select
            label="Select Player 2 (Optional)"
            value={selectedPlayer2}
            onChange={setSelectedPlayer2}
            options={[
              { value: "", label: "Select for comparison..." },
              ...uniquePlayers.map(p => ({ value: p, label: p }))
            ]}
            searchable
            searchPlaceholder="Search player..."
          />
        </div>

        {selectedPlayer1 && player1Stats ? (
          <>
            <PlayerRadarChart
              data={radarData}
              player1Name={selectedPlayer1}
              player2Name={selectedPlayer2 || undefined}
            />
            
            {/* Player Stats Summary */}
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* Player 1 Stats */}
              <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <h4 className="font-semibold text-white">{selectedPlayer1}</h4>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Matches</p>
                    <p className="font-semibold text-white">{player1Stats.matches}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Total Runs</p>
                    <p className="font-semibold text-emerald-400">{player1Stats.rawRuns}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Wickets</p>
                    <p className="font-semibold text-purple-400">{player1Stats.rawWickets}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Performance</p>
                    <p className="font-semibold text-indigo-400">
                      {((player1Stats.runs + player1Stats.wickets + player1Stats.strikeRate) / 3).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Player 2 Stats */}
              {selectedPlayer2 && player2Stats && (
                <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <h4 className="font-semibold text-white">{selectedPlayer2}</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Matches</p>
                      <p className="font-semibold text-white">{player2Stats.matches}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Total Runs</p>
                      <p className="font-semibold text-emerald-400">{player2Stats.rawRuns}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Wickets</p>
                      <p className="font-semibold text-purple-400">{player2Stats.rawWickets}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Performance</p>
                      <p className="font-semibold text-blue-400">
                        {((player2Stats.runs + player2Stats.wickets + player2Stats.strikeRate) / 3).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-[350px] items-center justify-center rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select a player to view comparison chart</p>
              <p className="text-xs text-slate-500 mt-1">Compare batting, bowling, and overall performance</p>
            </div>
          </div>
        )}
      </Card>

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
