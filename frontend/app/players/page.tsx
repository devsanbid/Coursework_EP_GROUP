"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Award, Target, TrendingUp, Zap, Shield } from "lucide-react";
import { Card, LoadingSpinner, Badge, Tabs } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import { StatsCard } from "@/components/ui/stats-card";
import {
  HorizontalBarChart,
  PlayerRadarChart,
  TrendLineChart,
  ParetoChart,
} from "@/components/charts";
import { loadMasterData, loadCombinedStats, calculateTopPlayers } from "@/lib/data";
import { PlayerMatchData, CombinedStats } from "@/lib/types";
import { getTeamShortName, getTeamColor, formatPercentage } from "@/lib/utils";

export default function PlayersPage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [combinedStats, setCombinedStats] = useState<CombinedStats[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("1");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [comparePlayer, setComparePlayer] = useState<string>("");
  const [activeTab, setActiveTab] = useState("batsmen");

  useEffect(() => {
    async function loadData() {
      try {
        const [master, combined] = await Promise.all([
          loadMasterData(),
          loadCombinedStats(),
        ]);
        setMasterData(master);
        setCombinedStats(combined);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const teams = [...new Set(masterData.map(d => d.team))].sort();
  const seasonNum = parseInt(selectedSeason);

  // Calculate player aggregates from master data
  const playerAggregates = masterData
    .filter(d => d.season === seasonNum)
    .filter(d => selectedTeam === "all" || d.team === selectedTeam)
    .reduce((acc, d) => {
      if (!acc[d.player_name]) {
        acc[d.player_name] = {
          name: d.player_name,
          team: d.team,
          role: d.player_role,
          matches: new Set<string>(),
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          wickets: 0,
          overs: 0,
          runsConceded: 0,
          catches: 0,
          stumpings: 0,
          runOuts: 0,
        };
      }
      acc[d.player_name].matches.add(d.match_id_unique);
      acc[d.player_name].runs += d.runs_scored;
      acc[d.player_name].balls += d.balls_faced;
      acc[d.player_name].fours += d.fours;
      acc[d.player_name].sixes += d.sixes;
      acc[d.player_name].wickets += d.wickets_taken;
      acc[d.player_name].overs += d.overs_bowled;
      acc[d.player_name].runsConceded += d.runs_conceded;
      acc[d.player_name].catches += d.catches;
      acc[d.player_name].stumpings += d.stumpings;
      acc[d.player_name].runOuts += d.run_outs;
      return acc;
    }, {} as Record<string, {
      name: string;
      team: string;
      role: string;
      matches: Set<string>;
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      wickets: number;
      overs: number;
      runsConceded: number;
      catches: number;
      stumpings: number;
      runOuts: number;
    }>);

  const players = Object.values(playerAggregates).map(p => {
    const matchCount = p.matches.size;
    return {
      ...p,
      matchCount,
      strikeRate: p.balls > 0 ? (p.runs / p.balls) * 100 : 0,
      economy: p.overs > 0 ? p.runsConceded / p.overs : 0,
      average: matchCount > 0 ? p.runs / matchCount : 0,
    };
  });

  // Top batsmen
  const topBatsmen = [...players]
    .filter(p => p.runs > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 15);

  // Top bowlers
  const topBowlers = [...players]
    .filter(p => p.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 15);

  // Top all-rounders (combined batting + bowling)
  const allRounders = [...players]
    .filter(p => p.runs > 50 && p.wickets > 2)
    .map(p => ({
      ...p,
      score: p.runs + p.wickets * 25,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  // Get player for radar chart
  const getPlayerRadarData = (playerName: string) => {
    const player = players.find(p => p.name === playerName);
    if (!player) return null;

    const maxRuns = Math.max(...players.map(p => p.runs)) || 1;
    const maxWickets = Math.max(...players.map(p => p.wickets)) || 1;
    const maxSR = Math.max(...players.map(p => p.strikeRate)) || 1;
    const maxCatches = Math.max(...players.map(p => p.catches)) || 1;
    const maxSixes = Math.max(...players.map(p => p.sixes)) || 1;
    const maxFours = Math.max(...players.map(p => p.fours)) || 1;

    return {
      runs: (player.runs / maxRuns) * 100,
      wickets: (player.wickets / maxWickets) * 100,
      strikeRate: (player.strikeRate / maxSR) * 100,
      fielding: (player.catches / maxCatches) * 100,
      sixes: (player.sixes / maxSixes) * 100,
      fours: (player.fours / maxFours) * 100,
    };
  };

  const player1Data = selectedPlayer ? getPlayerRadarData(selectedPlayer) : null;
  const player2Data = comparePlayer ? getPlayerRadarData(comparePlayer) : null;

  const radarData = player1Data
    ? [
        { subject: "Runs", player1: player1Data.runs, player2: player2Data?.runs || 0, fullMark: 100 },
        { subject: "Wickets", player1: player1Data.wickets, player2: player2Data?.wickets || 0, fullMark: 100 },
        { subject: "Strike Rate", player1: player1Data.strikeRate, player2: player2Data?.strikeRate || 0, fullMark: 100 },
        { subject: "Fielding", player1: player1Data.fielding, player2: player2Data?.fielding || 0, fullMark: 100 },
        { subject: "Sixes", player1: player1Data.sixes, player2: player2Data?.sixes || 0, fullMark: 100 },
        { subject: "Fours", player1: player1Data.fours, player2: player2Data?.fours || 0, fullMark: 100 },
      ]
    : [];

  const tabs = [
    { id: "batsmen", label: "Top Batsmen" },
    { id: "bowlers", label: "Top Bowlers" },
    { id: "allrounders", label: "All-Rounders" },
    { id: "compare", label: "Player Comparison" },
  ];

  const playerOptions = players
    .filter(p => p.matchCount >= 3)
    .map(p => ({ value: p.name, label: `${p.name} (${getTeamShortName(p.team)})` }));

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
            Player Statistics
          </motion.h1>
          <p className="mt-1 text-slate-400">
            Top performers, comparison, and detailed analytics
          </p>
        </div>
        <div className="flex gap-4">
          <Select
            label="Season"
            value={selectedSeason}
            onChange={setSelectedSeason}
            options={[
              { value: "1", label: "Season 1 (2024)" },
              { value: "2", label: "Season 2 (2025)" },
            ]}
            className="w-40"
          />
          <Select
            label="Team"
            value={selectedTeam}
            onChange={setSelectedTeam}
            options={[
              { value: "all", label: "All Teams" },
              ...teams.map(t => ({ value: t, label: t.replace(" (NPL)", "") })),
            ]}
            className="w-52"
          />
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "batsmen" && (
        <>
          {/* Top stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Top Scorer"
              value={topBatsmen[0]?.name || "N/A"}
              subtitle={`${topBatsmen[0]?.runs || 0} runs`}
              icon={Award}
              color="bg-gradient-to-br from-yellow-500 to-orange-500"
            />
            <StatsCard
              title="Best Strike Rate"
              value={players.filter(p => p.balls >= 50).sort((a, b) => b.strikeRate - a.strikeRate)[0]?.name || "N/A"}
              subtitle={`SR: ${players.filter(p => p.balls >= 50).sort((a, b) => b.strikeRate - a.strikeRate)[0]?.strikeRate.toFixed(1) || 0}`}
              icon={Zap}
              color="bg-gradient-to-br from-pink-500 to-rose-500"
            />
            <StatsCard
              title="Most Sixes"
              value={players.sort((a, b) => b.sixes - a.sixes)[0]?.name || "N/A"}
              subtitle={`${players.sort((a, b) => b.sixes - a.sixes)[0]?.sixes || 0} sixes`}
              icon={Target}
              color="bg-gradient-to-br from-purple-500 to-indigo-500"
            />
            <StatsCard
              title="Most Fours"
              value={players.sort((a, b) => b.fours - a.fours)[0]?.name || "N/A"}
              subtitle={`${players.sort((a, b) => b.fours - a.fours)[0]?.fours || 0} fours`}
              icon={TrendingUp}
              color="bg-gradient-to-br from-emerald-500 to-green-500"
            />
          </div>

          {/* Top Batsmen List */}
          <Card title="Top 15 Run Scorers" subtitle={`Season ${selectedSeason}`}>
            <HorizontalBarChart
              data={topBatsmen.map(p => ({
                name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
                value: p.runs,
              }))}
              valueKey="value"
            />
          </Card>

          {/* Detailed Table */}
          <Card title="Batting Statistics" subtitle="Detailed breakdown">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-3 text-left text-sm font-medium text-slate-400">#</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-400">Player</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-400">Team</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">M</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">Runs</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">Avg</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">SR</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">4s</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">6s</th>
                  </tr>
                </thead>
                <tbody>
                  {topBatsmen.map((player, idx) => (
                    <motion.tr
                      key={player.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-slate-700/50"
                    >
                      <td className="py-3 text-sm text-slate-500">{idx + 1}</td>
                      <td className="py-3 text-sm font-medium text-white">{player.name}</td>
                      <td className="py-3">
                        <span
                          className="rounded px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${getTeamColor(player.team)}20`,
                            color: getTeamColor(player.team),
                          }}
                        >
                          {getTeamShortName(player.team)}
                        </span>
                      </td>
                      <td className="py-3 text-right text-sm text-slate-400">{player.matchCount}</td>
                      <td className="py-3 text-right text-sm font-semibold text-emerald-400">
                        {player.runs}
                      </td>
                      <td className="py-3 text-right text-sm text-slate-300">
                        {player.average.toFixed(1)}
                      </td>
                      <td className="py-3 text-right text-sm text-indigo-400">
                        {player.strikeRate.toFixed(1)}
                      </td>
                      <td className="py-3 text-right text-sm text-slate-400">{player.fours}</td>
                      <td className="py-3 text-right text-sm text-purple-400">{player.sixes}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === "bowlers" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Top Wicket Taker"
              value={topBowlers[0]?.name || "N/A"}
              subtitle={`${topBowlers[0]?.wickets || 0} wickets`}
              icon={Award}
              color="bg-gradient-to-br from-purple-500 to-pink-500"
            />
            <StatsCard
              title="Best Economy"
              value={players.filter(p => p.overs >= 10).sort((a, b) => a.economy - b.economy)[0]?.name || "N/A"}
              subtitle={`Econ: ${players.filter(p => p.overs >= 10).sort((a, b) => a.economy - b.economy)[0]?.economy.toFixed(2) || 0}`}
              icon={Shield}
              color="bg-gradient-to-br from-blue-500 to-cyan-500"
            />
          </div>

          <Card title="Top 15 Wicket Takers" subtitle={`Season ${selectedSeason}`}>
            <HorizontalBarChart
              data={topBowlers.map(p => ({
                name: p.name.length > 15 ? p.name.substring(0, 15) + "..." : p.name,
                value: p.wickets,
              }))}
              valueKey="value"
            />
          </Card>

          <Card title="Bowling Statistics" subtitle="Detailed breakdown">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-3 text-left text-sm font-medium text-slate-400">#</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-400">Player</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-400">Team</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">Overs</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">Runs</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">Wkts</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {topBowlers.map((player, idx) => (
                    <motion.tr
                      key={player.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-slate-700/50"
                    >
                      <td className="py-3 text-sm text-slate-500">{idx + 1}</td>
                      <td className="py-3 text-sm font-medium text-white">{player.name}</td>
                      <td className="py-3">
                        <span
                          className="rounded px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${getTeamColor(player.team)}20`,
                            color: getTeamColor(player.team),
                          }}
                        >
                          {getTeamShortName(player.team)}
                        </span>
                      </td>
                      <td className="py-3 text-right text-sm text-slate-400">{player.overs.toFixed(1)}</td>
                      <td className="py-3 text-right text-sm text-slate-400">{player.runsConceded}</td>
                      <td className="py-3 text-right text-sm font-semibold text-purple-400">
                        {player.wickets}
                      </td>
                      <td className="py-3 text-right text-sm text-indigo-400">
                        {player.economy.toFixed(2)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === "allrounders" && (
        <>
          <Card title="Top All-Rounders" subtitle="Combined batting and bowling performance">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="pb-3 text-left text-sm font-medium text-slate-400">#</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-400">Player</th>
                    <th className="pb-3 text-left text-sm font-medium text-slate-400">Team</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">Runs</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">Wickets</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">Catches</th>
                    <th className="pb-3 text-right text-sm font-medium text-slate-400">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {allRounders.map((player, idx) => (
                    <motion.tr
                      key={player.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-slate-700/50"
                    >
                      <td className="py-3 text-sm text-slate-500">{idx + 1}</td>
                      <td className="py-3 text-sm font-medium text-white">{player.name}</td>
                      <td className="py-3">
                        <span
                          className="rounded px-2 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${getTeamColor(player.team)}20`,
                            color: getTeamColor(player.team),
                          }}
                        >
                          {getTeamShortName(player.team)}
                        </span>
                      </td>
                      <td className="py-3 text-right text-sm text-emerald-400">{player.runs}</td>
                      <td className="py-3 text-right text-sm text-purple-400">{player.wickets}</td>
                      <td className="py-3 text-right text-sm text-slate-400">{player.catches}</td>
                      <td className="py-3 text-right text-sm font-semibold text-indigo-400">
                        {player.score}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === "compare" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Select Player 1"
              value={selectedPlayer}
              onChange={setSelectedPlayer}
              options={[{ value: "", label: "Select a player..." }, ...playerOptions]}
              className="w-full"
            />
            <Select
              label="Select Player 2 (Optional)"
              value={comparePlayer}
              onChange={setComparePlayer}
              options={[{ value: "", label: "Select for comparison..." }, ...playerOptions]}
              className="w-full"
            />
          </div>

          {selectedPlayer && radarData.length > 0 && (
            <Card
              title="Player Skill Comparison"
              subtitle={comparePlayer ? `${selectedPlayer} vs ${comparePlayer}` : selectedPlayer}
            >
              <PlayerRadarChart
                data={radarData}
                player1Name={selectedPlayer}
                player2Name={comparePlayer || undefined}
              />
            </Card>
          )}

          {selectedPlayer && (
            <div className="grid gap-6 md:grid-cols-2">
              {[selectedPlayer, comparePlayer].filter(Boolean).map(playerName => {
                const player = players.find(p => p.name === playerName);
                if (!player) return null;
                return (
                  <Card key={playerName} title={player.name} subtitle={player.team.replace(" (NPL)", "")}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-400">{player.runs}</p>
                        <p className="text-xs text-slate-400">Runs</p>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                        <p className="text-2xl font-bold text-purple-400">{player.wickets}</p>
                        <p className="text-xs text-slate-400">Wickets</p>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                        <p className="text-2xl font-bold text-indigo-400">{player.strikeRate.toFixed(1)}</p>
                        <p className="text-xs text-slate-400">Strike Rate</p>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                        <p className="text-2xl font-bold text-orange-400">{player.sixes}</p>
                        <p className="text-xs text-slate-400">Sixes</p>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                        <p className="text-2xl font-bold text-blue-400">{player.fours}</p>
                        <p className="text-xs text-slate-400">Fours</p>
                      </div>
                      <div className="rounded-lg bg-slate-800/50 p-4 text-center">
                        <p className="text-2xl font-bold text-slate-300">{player.catches}</p>
                        <p className="text-xs text-slate-400">Catches</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
