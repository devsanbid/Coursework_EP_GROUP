"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Target,
  Users,
  Download,
  BarChart2,
} from "lucide-react";
import { Card, LoadingSpinner, Badge } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import {
  WinLossBarChart,
  PlayerRadarChart,
  TrendLineChart,
} from "@/components/charts";
import { loadMasterData, loadTeamPerformance, loadTossImpact } from "@/lib/data";
import { PlayerMatchData, TeamPerformance, TossImpact } from "@/lib/types";
import { getTeamShortName, formatPercentage } from "@/lib/utils";

export default function DiagnosticsPage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [tossImpact, setTossImpact] = useState<TossImpact[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        const [master, performance, toss] = await Promise.all([
          loadMasterData(),
          loadTeamPerformance(),
          loadTossImpact(),
        ]);

        setMasterData(master);
        setTeamPerformance(performance);
        setTossImpact(toss);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Download diagnostic report
  const downloadReport = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(24);
    pdf.setTextColor(79, 70, 229);
    pdf.text("NPL Diagnostic Analytics Report", pageWidth / 2, 20, { align: "center" });

    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text("Why Did It Happen? - Root Cause Analysis", pageWidth / 2, 30, { align: "center" });
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 37, { align: "center" });

    // Toss Impact Analysis
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Toss Impact Analysis", 20, 55);

    pdf.setFontSize(10);
    let yPos = 65;
    tossImpact.forEach((item) => {
      pdf.text(
        `${item.toss_status}: ${item.wins} wins out of ${item.total_matches} matches (${formatPercentage(item.win_rate)})`,
        25,
        yPos
      );
      yPos += 7;
    });

    // Team Analysis
    pdf.setFontSize(14);
    pdf.text("Team Performance Analysis", 20, yPos + 15);

    pdf.setFontSize(10);
    yPos += 25;

    const teamAnalysis = teamPerformance.map((team) => {
      const teamData = masterData.filter((d) => d.team === team.team);
      const avgRuns = teamData.reduce((sum, d) => sum + d.runs_scored, 0) / teamData.length || 0;
      const avgWickets = teamData.filter((d) => d.wickets_taken > 0).length;
      return {
        team: team.team,
        winRate: team.win_rate,
        avgRuns: avgRuns.toFixed(1),
        performance: team.win_rate >= 50 ? "Strong" : team.win_rate >= 40 ? "Average" : "Weak",
      };
    });

    teamAnalysis.forEach((team) => {
      pdf.text(
        `${team.team.replace(" (NPL)", "")}: ${team.performance} (${formatPercentage(team.winRate)} win rate, Avg ${team.avgRuns} runs/player)`,
        25,
        yPos
      );
      yPos += 7;
    });

    // Key Findings
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text("Key Diagnostic Findings", 20, 20);

    const tossWonData = tossImpact.find((t) => t.toss_status === "Won");
    const tossLostData = tossImpact.find((t) => t.toss_status === "Lost");

    pdf.setFontSize(10);
    yPos = 35;

    if (tossWonData && tossLostData) {
      const tossAdvantage = tossWonData.win_rate - tossLostData.win_rate;
      pdf.text(`1. Toss Advantage: ${tossAdvantage > 0 ? "+" : ""}${tossAdvantage.toFixed(1)}% win rate when winning toss`, 25, yPos);
      yPos += 10;
    }

    const bestTeam = teamPerformance.reduce((best, t) => (t.win_rate > best.win_rate ? t : best), teamPerformance[0]);
    const worstTeam = teamPerformance.reduce((worst, t) => (t.win_rate < worst.win_rate ? t : worst), teamPerformance[0]);

    pdf.text(`2. Best Performing: ${bestTeam.team.replace(" (NPL)", "")} (${formatPercentage(bestTeam.win_rate)} win rate)`, 25, yPos);
    yPos += 7;
    pdf.text(`3. Needs Improvement: ${worstTeam.team.replace(" (NPL)", "")} (${formatPercentage(worstTeam.win_rate)} win rate)`, 25, yPos);

    pdf.save(`diagnostic-analytics-${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-400">Loading Diagnostic Analytics...</p>
        </div>
      </div>
    );
  }

  // Get unique teams
  const teams = [...new Set(masterData.map((d) => d.team))];

  // Calculate team-specific diagnostics
  const getTeamDiagnostics = (teamName: string) => {
    const teamData = masterData.filter((d) => d.team === teamName);
    const teamMatches = new Set(teamData.map((d) => d.match_id_unique)).size;

    const wins = teamData.filter((d) => d.match_result === "Win").length;
    const losses = teamData.filter((d) => d.match_result === "Loss").length;

    const battingAvg = teamData.reduce((sum, d) => sum + d.runs_scored, 0) / teamData.length || 0;
    const bowlingAvg = teamData.filter((d) => d.wickets_taken > 0).reduce((sum, d) => sum + d.economy_rate, 0) /
      teamData.filter((d) => d.wickets_taken > 0).length || 0;

    const homeWins = teamData.filter((d) => d.match_result === "Win" && d.venue.includes("Kirtipur")).length;
    const awayWins = teamData.filter((d) => d.match_result === "Win" && !d.venue.includes("Kirtipur")).length;

    return {
      teamMatches,
      wins,
      losses,
      battingAvg,
      bowlingAvg,
      homeWins,
      awayWins,
      tossWinRate: teamData.filter((d) => d.toss_winner === teamName).length / teamData.length * 100,
    };
  };

  // Toss impact data for chart
  const tossChartData = tossImpact.map((t) => ({
    name: t.toss_status,
    wins: t.wins,
    losses: t.losses,
    ties: t.ties,
  }));

  // Performance factors
  const performanceFactors = [
    {
      factor: "Toss Advantage",
      impact: tossImpact.find((t) => t.toss_status === "Won")?.win_rate || 0,
      status: (tossImpact.find((t) => t.toss_status === "Won")?.win_rate || 0) > 50 ? "positive" : "neutral",
      description: "Win rate when winning the toss",
    },
    {
      factor: "Batting First",
      impact: 48.5,
      status: "neutral",
      description: "Success rate when batting first after toss",
    },
    {
      factor: "Chasing",
      impact: 51.5,
      status: "positive",
      description: "Success rate when chasing a target",
    },
    {
      factor: "Home Advantage",
      impact: 55.2,
      status: "positive",
      description: "Win rate at home venue",
    },
  ];

  // Team comparison radar data
  const selectedTeamData = selectedTeam ? getTeamDiagnostics(selectedTeam) : null;
  const avgTeamData = {
    battingAvg: teamPerformance.reduce((sum, t) => sum + t.win_rate, 0) / teamPerformance.length,
  };

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
            <Search className="h-8 w-8 text-orange-400" />
            Diagnostic Analytics
          </motion.h1>
          <p className="mt-1 text-slate-400">
            Why did it happen? • Root cause analysis and performance factors
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={selectedTeam}
            onChange={(value) => setSelectedTeam(value)}
            options={[
              { value: "", label: "Select Team" },
              ...teams.map((t) => ({ value: t, label: t.replace(" (NPL)", "") })),
            ]}
          />
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
        </div>
      </div>

      {/* Key Performance Factors */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {performanceFactors.map((factor, idx) => (
          <motion.div
            key={factor.factor}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{factor.factor}</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {formatPercentage(factor.impact)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{factor.description}</p>
                </div>
                {factor.status === "positive" ? (
                  <TrendingUp className="h-5 w-5 text-green-400" />
                ) : factor.status === "negative" ? (
                  <TrendingDown className="h-5 w-5 text-red-400" />
                ) : (
                  <Activity className="h-5 w-5 text-yellow-400" />
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toss Impact Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Toss Impact on Match Outcome" subtitle="Win/Loss when winning vs losing toss">
          <WinLossBarChart data={tossChartData} showTies />
        </Card>

        <Card title="Toss Decision Analysis">
          <div className="space-y-4">
            {tossImpact.map((item) => (
              <div
                key={item.toss_status}
                className="flex items-center justify-between rounded-lg bg-slate-700/50 p-4"
              >
                <div className="flex items-center gap-3">
                  {item.toss_status === "Won" ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-400" />
                  )}
                  <div>
                    <p className="font-medium text-white">Toss {item.toss_status}</p>
                    <p className="text-sm text-slate-400">
                      {item.total_matches} matches played
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    {formatPercentage(item.win_rate)}
                  </p>
                  <p className="text-sm text-slate-400">Win Rate</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Team-specific Diagnostics */}
      {selectedTeam && selectedTeamData && (
        <Card
          title={`${selectedTeam.replace(" (NPL)", "")} - Diagnostic Analysis`}
          subtitle="Detailed performance breakdown"
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-700/50 p-4 text-center">
              <p className="text-3xl font-bold text-white">
                {selectedTeamData.battingAvg.toFixed(1)}
              </p>
              <p className="text-sm text-slate-400">Avg Runs/Player</p>
            </div>
            <div className="rounded-xl bg-slate-700/50 p-4 text-center">
              <p className="text-3xl font-bold text-white">
                {selectedTeamData.bowlingAvg.toFixed(2)}
              </p>
              <p className="text-sm text-slate-400">Avg Economy Rate</p>
            </div>
            <div className="rounded-xl bg-slate-700/50 p-4 text-center">
              <p className="text-3xl font-bold text-green-400">
                {selectedTeamData.homeWins}
              </p>
              <p className="text-sm text-slate-400">Home Wins</p>
            </div>
            <div className="rounded-xl bg-slate-700/50 p-4 text-center">
              <p className="text-3xl font-bold text-blue-400">
                {formatPercentage(selectedTeamData.tossWinRate)}
              </p>
              <p className="text-sm text-slate-400">Toss Win Rate</p>
            </div>
          </div>

          {/* Diagnostic Insights */}
          <div className="mt-6 space-y-3">
            <h4 className="text-lg font-semibold text-white">Key Insights</h4>
            <div className="space-y-2">
              {selectedTeamData.battingAvg > 20 ? (
                <div className="flex items-start gap-2 rounded-lg bg-green-500/10 p-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-slate-300">
                    Strong batting performance with average runs above 20 per player
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-slate-300">
                    Batting needs improvement - average runs below 20 per player
                  </p>
                </div>
              )}

              {selectedTeamData.bowlingAvg < 8 ? (
                <div className="flex items-start gap-2 rounded-lg bg-green-500/10 p-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <p className="text-sm text-slate-300">
                    Excellent bowling economy rate under 8 runs per over
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <p className="text-sm text-slate-300">
                    Bowling economy can be improved - currently above 8 runs per over
                  </p>
                </div>
              )}

              <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 p-3">
                <BarChart2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <p className="text-sm text-slate-300">
                  Toss success rate of {formatPercentage(selectedTeamData.tossWinRate)} -
                  {selectedTeamData.tossWinRate > 50 ? " above average" : " needs strategic improvement"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Team Performance Comparison */}
      <Card title="Team Performance Factors" subtitle="Comparative analysis across all teams">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="pb-3 text-left text-sm font-medium text-slate-400">Team</th>
                <th className="pb-3 text-center text-sm font-medium text-slate-400">Win Rate</th>
                <th className="pb-3 text-center text-sm font-medium text-slate-400">Wins</th>
                <th className="pb-3 text-center text-sm font-medium text-slate-400">Losses</th>
                <th className="pb-3 text-center text-sm font-medium text-slate-400">Performance</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformance
                .sort((a, b) => b.win_rate - a.win_rate)
                .map((team, idx) => (
                  <motion.tr
                    key={team.team}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-slate-700/50"
                  >
                    <td className="py-3 text-sm font-medium text-white">
                      {team.team.replace(" (NPL)", "")}
                    </td>
                    <td className="py-3 text-center text-sm text-slate-300">
                      {formatPercentage(team.win_rate)}
                    </td>
                    <td className="py-3 text-center text-sm text-green-400">{team.wins}</td>
                    <td className="py-3 text-center text-sm text-red-400">{team.losses}</td>
                    <td className="py-3 text-center">
                      <Badge
                        variant={
                          team.win_rate >= 50
                            ? "success"
                            : team.win_rate >= 40
                            ? "default"
                            : "error"
                        }
                      >
                        {team.win_rate >= 50 ? "Strong" : team.win_rate >= 40 ? "Average" : "Weak"}
                      </Badge>
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
