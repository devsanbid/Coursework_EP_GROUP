"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Target, Award, TrendingUp, BarChart3 } from "lucide-react";
import { Card, LoadingSpinner, Badge, Tabs } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import { StatsCard } from "@/components/ui/stats-card";
import {
  WinLossBarChart,
  WinRatePieChart,
  TeamBarChart,
  StackedBarChart,
  ParetoChart,
  PlayerRadarChart,
} from "@/components/charts";
import { loadMasterData, loadTeamPerformance, calculateHeadToHead } from "@/lib/data";
import { PlayerMatchData, TeamPerformance } from "@/lib/types";
import { getTeamShortName, getTeamColor, formatPercentage } from "@/lib/utils";

export default function TeamsPage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadData() {
      try {
        const [master, performance] = await Promise.all([
          loadMasterData(),
          loadTeamPerformance(),
        ]);
        setMasterData(master);
        setTeamPerformance(performance);
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

  // Filter data
  const filteredData = masterData.filter(d => {
    if (selectedSeason !== "all" && d.season !== parseInt(selectedSeason)) return false;
    if (selectedTeam !== "all" && d.team !== selectedTeam) return false;
    return true;
  });

  // Team statistics
  const teamStats = teams.map(team => {
    const teamData = filteredData.filter(d => d.team === team);
    const uniqueMatches = new Set(teamData.map(d => d.match_id_unique));
    const totalRuns = teamData.reduce((sum, d) => sum + d.runs_scored, 0);
    const totalWickets = teamData.reduce((sum, d) => sum + d.wickets_taken, 0);
    const totalSixes = teamData.reduce((sum, d) => sum + d.sixes, 0);
    const totalFours = teamData.reduce((sum, d) => sum + d.fours, 0);
    const wins = teamData.filter(d => d.match_result === "Win").length;
    const performance = teamPerformance.find(p => p.team === team);

    return {
      team,
      shortName: getTeamShortName(team),
      matches: uniqueMatches.size,
      totalRuns,
      totalWickets,
      totalSixes,
      totalFours,
      winRate: performance?.win_rate || 0,
      wins: performance?.wins || 0,
      losses: performance?.losses || 0,
      ties: performance?.ties || 0,
    };
  });

  // Top contributors per team (Pareto analysis)
  const getTeamContributors = (team: string) => {
    const teamData = filteredData.filter(d => d.team === team);
    const playerRuns = teamData.reduce((acc, d) => {
      if (!acc[d.player_name]) acc[d.player_name] = 0;
      acc[d.player_name] += d.runs_scored;
      return acc;
    }, {} as Record<string, number>);

    const sorted = Object.entries(playerRuns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const total = sorted.reduce((sum, [, runs]) => sum + runs, 0);
    let cumulative = 0;

    return sorted.map(([name, runs]) => {
      cumulative += runs;
      return {
        name: name.length > 12 ? name.substring(0, 12) + "..." : name,
        runs,
        cumulative: Math.round((cumulative / total) * 100),
      };
    });
  };

  // Head to head data
  const h2hData = calculateHeadToHead(masterData);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "comparison", label: "Team Comparison" },
    { id: "contributors", label: "Top Contributors" },
    { id: "h2h", label: "Head to Head" },
  ];

  const selectedTeamData = teamStats.find(t => t.team === selectedTeam);

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
            Team Performance
          </motion.h1>
          <p className="mt-1 text-slate-400">
            Team analytics, comparisons, and dominance analysis
          </p>
        </div>
        <div className="flex gap-4">
          <Select
            label="Season"
            value={selectedSeason}
            onChange={setSelectedSeason}
            options={[
              { value: "all", label: "All Seasons" },
              { value: "1", label: "Season 1" },
              { value: "2", label: "Season 2" },
            ]}
            className="w-36"
          />
          <Select
            label="Team"
            value={selectedTeam}
            onChange={setSelectedTeam}
            options={[
              { value: "all", label: "All Teams" },
              ...teams.map(t => ({ value: t, label: t.replace(" (NPL)", "") })),
            ]}
            className="w-56"
          />
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <>
          {/* Team Stats Grid */}
          {selectedTeam !== "all" && selectedTeamData && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Win Rate"
                value={formatPercentage(selectedTeamData.winRate)}
                subtitle={`${selectedTeamData.wins}W - ${selectedTeamData.losses}L`}
                icon={Trophy}
                color="bg-gradient-to-br from-indigo-500 to-purple-600"
              />
              <StatsCard
                title="Total Runs"
                value={selectedTeamData.totalRuns.toLocaleString()}
                subtitle={`${selectedTeamData.totalFours} 4s • ${selectedTeamData.totalSixes} 6s`}
                icon={Target}
                color="bg-gradient-to-br from-emerald-500 to-teal-600"
              />
              <StatsCard
                title="Wickets Taken"
                value={selectedTeamData.totalWickets}
                subtitle="Total wickets"
                icon={Award}
                color="bg-gradient-to-br from-orange-500 to-red-600"
              />
              <StatsCard
                title="Matches Played"
                value={selectedTeamData.matches}
                subtitle="In selected period"
                icon={BarChart3}
                color="bg-gradient-to-br from-blue-500 to-cyan-600"
              />
            </div>
          )}

          {/* Team Rankings */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Team Win Rates" subtitle="Performance comparison">
              <TeamBarChart
                data={teamStats.map(t => ({
                  name: t.shortName,
                  value: t.winRate,
                }))}
                valueKey="value"
              />
            </Card>

            <Card title="Total Runs by Team" subtitle="Batting performance">
              <TeamBarChart
                data={teamStats.map(t => ({
                  name: t.shortName,
                  value: t.totalRuns,
                }))}
                valueKey="value"
              />
            </Card>
          </div>

          {/* Performance Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {teamStats.slice(0, 4).map((team, idx) => (
              <motion.div
                key={team.team}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span
                        className="rounded-lg px-3 py-1 text-sm font-bold"
                        style={{
                          backgroundColor: `${getTeamColor(team.team)}20`,
                          color: getTeamColor(team.team),
                        }}
                      >
                        {team.shortName}
                      </span>
                      <Badge
                        variant={
                          team.winRate >= 50 ? "success" : team.winRate >= 40 ? "warning" : "error"
                        }
                      >
                        {formatPercentage(team.winRate)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">{team.team.replace(" (NPL)", "")}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-400">{team.wins}</p>
                        <p className="text-xs text-slate-500">Wins</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-400">{team.losses}</p>
                        <p className="text-xs text-slate-500">Losses</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-yellow-400">{team.ties}</p>
                        <p className="text-xs text-slate-500">Ties</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {activeTab === "comparison" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Runs vs Wickets" subtitle="Offensive and defensive balance">
            <StackedBarChart
              data={teamStats.map(t => ({
                name: t.shortName,
                Runs: Math.round(t.totalRuns / 100),
                Wickets: t.totalWickets,
              }))}
              keys={["Runs", "Wickets"]}
              colors={["#22C55E", "#8338EC"]}
            />
          </Card>

          <Card title="Boundaries Analysis" subtitle="Fours and Sixes comparison">
            <StackedBarChart
              data={teamStats.map(t => ({
                name: t.shortName,
                Fours: t.totalFours,
                Sixes: t.totalSixes,
              }))}
              keys={["Fours", "Sixes"]}
              colors={["#3B82F6", "#F59E0B"]}
            />
          </Card>
        </div>
      )}

      {activeTab === "contributors" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {(selectedTeam !== "all" ? [selectedTeam] : teams.slice(0, 4)).map(team => (
            <Card
              key={team}
              title={`${getTeamShortName(team)} Top Contributors`}
              subtitle="Pareto analysis - 80/20 rule"
            >
              <ParetoChart
                data={getTeamContributors(team)}
                valueKey="runs"
                cumulativeKey="cumulative"
              />
            </Card>
          ))}
        </div>
      )}

      {activeTab === "h2h" && (
        <Card title="Head to Head Records" subtitle="Team vs Team performance">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-left text-sm font-medium text-slate-400">Team</th>
                  {teams.slice(0, 8).map(t => (
                    <th key={t} className="pb-3 text-center text-sm font-medium text-slate-400">
                      {getTeamShortName(t)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams.slice(0, 8).map(team1 => (
                  <tr key={team1} className="border-b border-slate-700/50">
                    <td className="py-3">
                      <span
                        className="rounded px-2 py-1 text-xs font-medium"
                        style={{
                          backgroundColor: `${getTeamColor(team1)}20`,
                          color: getTeamColor(team1),
                        }}
                      >
                        {getTeamShortName(team1)}
                      </span>
                    </td>
                    {teams.slice(0, 8).map(team2 => {
                      if (team1 === team2) {
                        return (
                          <td key={team2} className="py-3 text-center text-slate-600">
                            -
                          </td>
                        );
                      }
                      const record = h2hData[team1]?.[team2] || { wins: 0, losses: 0 };
                      return (
                        <td key={team2} className="py-3 text-center">
                          <span className="text-xs">
                            <span className="text-green-400">{record.wins}</span>
                            <span className="text-slate-500"> - </span>
                            <span className="text-red-400">{record.losses}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
