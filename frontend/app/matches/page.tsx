"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Calendar, MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, LoadingSpinner, Badge, Tabs } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import { 
  WinLossBarChart, 
  WinRatePieChart,
  StackedBarChart,
  TrendLineChart 
} from "@/components/charts";
import { loadMasterData, loadMatchResults, loadTossImpact, filterData } from "@/lib/data";
import { PlayerMatchData, MatchResult, TossImpact } from "@/lib/types";
import { getTeamShortName, getTeamColor, formatPercentage } from "@/lib/utils";

export default function MatchesPage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [tossImpact, setTossImpact] = useState<TossImpact[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadData() {
      try {
        const [master, results, toss] = await Promise.all([
          loadMasterData(),
          loadMatchResults(),
          loadTossImpact(),
        ]);
        setMasterData(master);
        setMatchResults(results);
        setTossImpact(toss);
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

  // Filter data based on selections
  const filteredResults = matchResults.filter(m => {
    if (selectedSeason !== "all" && m.season !== parseInt(selectedSeason)) return false;
    if (selectedTeam !== "all" && m.team !== selectedTeam) return false;
    return true;
  });

  // Get unique teams
  const teams = [...new Set(matchResults.map(m => m.team))].sort();

  // Calculate match outcomes by team
  const teamOutcomes = teams.reduce((acc, team) => {
    const teamMatches = filteredResults.filter(m => m.team === team);
    acc[team] = {
      wins: teamMatches.filter(m => m.won === 1).length,
      losses: teamMatches.filter(m => m.lost === 1).length,
      ties: teamMatches.filter(m => m.tied === 1).length,
    };
    return acc;
  }, {} as Record<string, { wins: number; losses: number; ties: number }>);

  // Match trend data
  const matchTrend = filteredResults
    .filter(m => m.team === (selectedTeam !== "all" ? selectedTeam : teams[0]))
    .map((m, idx) => ({
      name: `M${idx + 1}`,
      result: m.won === 1 ? 1 : m.tied === 1 ? 0.5 : 0,
    }));

  // Toss decision analysis
  const tossDecisionData = filteredResults.reduce((acc, m) => {
    const decision = m.toss_decision;
    if (!acc[decision]) acc[decision] = { wins: 0, total: 0 };
    acc[decision].total++;
    if (m.toss_won === 1 && m.won === 1) acc[decision].wins++;
    return acc;
  }, {} as Record<string, { wins: number; total: number }>);

  // Venue performance
  const venueData = filteredResults.reduce((acc, m) => {
    const venue = m.venue.split(",")[0];
    if (!acc[venue]) acc[venue] = { wins: 0, losses: 0, total: 0 };
    acc[venue].total++;
    if (m.won === 1) acc[venue].wins++;
    if (m.lost === 1) acc[venue].losses++;
    return acc;
  }, {} as Record<string, { wins: number; losses: number; total: number }>);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "toss", label: "Toss Analysis" },
    { id: "matches", label: "Match List" },
  ];

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
            Match Analysis
          </motion.h1>
          <p className="mt-1 text-slate-400">
            Win/Loss trends, toss impact, and match outcomes
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

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Wins</p>
                  <p className="text-2xl font-bold text-white">
                    {filteredResults.filter(m => m.won === 1).length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                  <TrendingDown className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Losses</p>
                  <p className="text-2xl font-bold text-white">
                    {filteredResults.filter(m => m.lost === 1).length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20">
                  <Minus className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Ties</p>
                  <p className="text-2xl font-bold text-white">
                    {filteredResults.filter(m => m.tied === 1).length}
                  </p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20">
                  <Trophy className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Win Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {formatPercentage(
                      (filteredResults.filter(m => m.won === 1).length / 
                       (filteredResults.length / 2)) * 100
                    )}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Win/Loss by Team" subtitle="Season performance breakdown">
              <WinLossBarChart
                data={Object.entries(teamOutcomes).map(([team, data]) => ({
                  name: getTeamShortName(team),
                  wins: data.wins,
                  losses: data.losses,
                  ties: data.ties,
                }))}
                showTies
              />
            </Card>

            {selectedTeam !== "all" && (
              <Card 
                title={`${selectedTeam.replace(" (NPL)", "")} Win Distribution`}
                subtitle="Overall match outcomes"
              >
                <WinRatePieChart
                  wins={teamOutcomes[selectedTeam]?.wins || 0}
                  losses={teamOutcomes[selectedTeam]?.losses || 0}
                  ties={teamOutcomes[selectedTeam]?.ties || 0}
                />
              </Card>
            )}

            {selectedTeam === "all" && (
              <Card title="Overall Win Distribution" subtitle="All teams combined">
                <WinRatePieChart
                  wins={filteredResults.filter(m => m.won === 1).length}
                  losses={filteredResults.filter(m => m.lost === 1).length}
                  ties={filteredResults.filter(m => m.tied === 1).length}
                />
              </Card>
            )}
          </div>
        </>
      )}

      {activeTab === "toss" && (
        <>
          {/* Toss Impact Analysis */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Toss Impact on Match Result" subtitle="Win rate based on toss outcome">
              <div className="space-y-6">
                {tossImpact.map((t, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{t.toss_status}</span>
                      <span className="text-sm text-slate-400">
                        {t.wins}/{t.total_matches} wins
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${t.win_rate}%` }}
                        transition={{ duration: 1, delay: idx * 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      />
                    </div>
                    <p className="text-right text-sm font-semibold text-indigo-400">
                      {formatPercentage(t.win_rate)} Win Rate
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Toss Decision Impact" subtitle="Bat first vs Field first">
              <div className="space-y-6">
                {Object.entries(tossDecisionData).map(([decision, data], idx) => (
                  <div key={decision} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white capitalize">
                        {decision} First
                      </span>
                      <span className="text-sm text-slate-400">
                        {data.total} matches
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-700">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(data.wins / data.total) * 100}%` }}
                        transition={{ duration: 1, delay: idx * 0.2 }}
                        className={`h-full rounded-full ${
                          decision.toLowerCase().includes("bat")
                            ? "bg-gradient-to-r from-orange-500 to-red-500"
                            : "bg-gradient-to-r from-green-500 to-emerald-500"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-slate-800/50 p-4">
                <p className="text-sm text-slate-400">
                  <span className="font-semibold text-yellow-400">Key Insight:</span>{" "}
                  Teams that lose the toss have a higher win rate ({formatPercentage(tossImpact.find(t => t.toss_status === "Lost Toss")?.win_rate || 0)}),
                  suggesting that winning the toss doesn&apos;t guarantee a match win.
                </p>
              </div>
            </Card>
          </div>
        </>
      )}

      {activeTab === "matches" && (
        <Card title="Match Results" subtitle="Detailed match-by-match breakdown">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-3 text-left text-sm font-medium text-slate-400">Match</th>
                  <th className="pb-3 text-left text-sm font-medium text-slate-400">Team</th>
                  <th className="pb-3 text-left text-sm font-medium text-slate-400">Opposition</th>
                  <th className="pb-3 text-left text-sm font-medium text-slate-400">Result</th>
                  <th className="pb-3 text-left text-sm font-medium text-slate-400">Toss</th>
                  <th className="pb-3 text-left text-sm font-medium text-slate-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.slice(0, 20).map((match, idx) => (
                  <motion.tr
                    key={`${match.match_id_unique}-${match.team}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-slate-700/50"
                  >
                    <td className="py-3 text-sm text-slate-300">{match.match_id_unique}</td>
                    <td className="py-3">
                      <span 
                        className="rounded-full px-2 py-1 text-xs font-medium"
                        style={{ 
                          backgroundColor: `${getTeamColor(match.team)}20`,
                          color: getTeamColor(match.team)
                        }}
                      >
                        {getTeamShortName(match.team)}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-slate-400">
                      {getTeamShortName(match.opposition)}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          match.won === 1 ? "success" : match.tied === 1 ? "warning" : "error"
                        }
                      >
                        {match.won === 1 ? "Won" : match.tied === 1 ? "Tie" : "Lost"}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-slate-400">
                      {match.toss_won === 1 ? "Won" : "Lost"} - {match.toss_decision}
                    </td>
                    <td className="py-3 text-sm text-slate-500">{match.match_date}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
