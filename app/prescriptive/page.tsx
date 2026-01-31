"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Target,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Download,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Activity,
} from "lucide-react";
import { Card, LoadingSpinner, Badge } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import { loadMasterData, loadTeamPerformance, loadTossImpact } from "@/lib/data";
import { PlayerMatchData, TeamPerformance, TossImpact } from "@/lib/types";
import { getTeamShortName, formatPercentage } from "@/lib/utils";

interface Recommendation {
  id: string;
  category: "batting" | "bowling" | "fielding" | "strategy";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionItems: string[];
}

export default function PrescriptivePage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [tossImpact, setTossImpact] = useState<TossImpact[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedOpponent, setSelectedOpponent] = useState<string>("");

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

  // Get unique teams
  const teams = useMemo(() => {
    return [...new Set(masterData.map((d) => d.team))].sort();
  }, [masterData]);

  // Generate recommendations based on team analysis
  const recommendations = useMemo((): Recommendation[] => {
    if (!selectedTeam) return [];

    const teamData = masterData.filter((d) => d.team === selectedTeam);
    const teamStats = teamPerformance.find((t) => t.team === selectedTeam);
    const opponentData = selectedOpponent
      ? masterData.filter((d) => d.team === selectedOpponent)
      : null;

    const recs: Recommendation[] = [];

    // Batting analysis
    const avgRuns = teamData.reduce((sum, d) => sum + d.runs_scored, 0) / teamData.length || 0;
    const avgStrikeRate = teamData.reduce((sum, d) => sum + d.strike_rate, 0) / teamData.length || 0;
    const totalSixes = teamData.reduce((sum, d) => sum + d.sixes, 0);
    const totalFours = teamData.reduce((sum, d) => sum + d.fours, 0);

    if (avgRuns < 20) {
      recs.push({
        id: "bat-1",
        category: "batting",
        title: "Improve Batting Consistency",
        description: `Average runs per player (${avgRuns.toFixed(1)}) is below optimal. Focus on building partnerships.`,
        impact: "high",
        actionItems: [
          "Prioritize anchoring innings with experienced batsmen",
          "Rotate strike more frequently in middle overs",
          "Practice against spin bowling in nets",
          "Focus on converting starts to big scores",
        ],
      });
    }

    if (avgStrikeRate < 120) {
      recs.push({
        id: "bat-2",
        category: "batting",
        title: "Increase Scoring Rate",
        description: `Team strike rate (${avgStrikeRate.toFixed(1)}) needs improvement for T20 format.`,
        impact: "medium",
        actionItems: [
          "Target boundaries in powerplay overs",
          "Use pinch hitters in middle overs",
          "Practice power hitting against death bowling",
          "Identify and target weaker bowlers",
        ],
      });
    }

    // Bowling analysis
    const bowlers = teamData.filter((d) => d.overs_bowled > 0);
    const avgEconomy = bowlers.reduce((sum, d) => sum + d.economy_rate, 0) / bowlers.length || 0;
    const totalWickets = teamData.reduce((sum, d) => sum + d.wickets_taken, 0);

    if (avgEconomy > 8) {
      recs.push({
        id: "bowl-1",
        category: "bowling",
        title: "Reduce Bowling Economy",
        description: `Economy rate (${avgEconomy.toFixed(2)}) is too high. Focus on dot ball percentage.`,
        impact: "high",
        actionItems: [
          "Vary pace and length more frequently",
          "Use slower balls effectively at death",
          "Target stumps more often in powerplay",
          "Set defensive fields when required",
        ],
      });
    }

    if (totalWickets / teamData.length < 0.3) {
      recs.push({
        id: "bowl-2",
        category: "bowling",
        title: "Increase Wicket-Taking Ability",
        description: "Team is not taking enough wickets. Need more aggressive bowling options.",
        impact: "high",
        actionItems: [
          "Use attacking field placements early",
          "Bring strike bowlers in crucial overs",
          "Create pressure through dot balls",
          "Use spin in middle overs for breakthroughs",
        ],
      });
    }

    // Fielding recommendations
    const catches = teamData.reduce((sum, d) => sum + d.catches, 0);
    const runOuts = teamData.reduce((sum, d) => sum + d.run_outs, 0);

    recs.push({
      id: "field-1",
      category: "fielding",
      title: "Optimize Fielding Positions",
      description: `Team has ${catches} catches and ${runOuts} run outs. Fielding can be improved.`,
      impact: "medium",
      actionItems: [
        "Position best fielders at key catching positions",
        "Practice relay throws for run-out opportunities",
        "Keep athletic fielders at boundary for crucial overs",
        "Work on slip catching in practice sessions",
      ],
    });

    // Strategy recommendations
    const tossWonData = tossImpact.find((t) => t.toss_status === "Won");
    if (tossWonData && tossWonData.win_rate > 50) {
      recs.push({
        id: "strat-1",
        category: "strategy",
        title: "Toss Decision Strategy",
        description: `Teams winning toss have ${formatPercentage(tossWonData.win_rate)} win rate. Make informed decisions.`,
        impact: "medium",
        actionItems: [
          "Analyze pitch conditions before deciding",
          "Consider dew factor in evening matches",
          "Bowl first if pitch has moisture",
          "Bat first on flat tracks for big totals",
        ],
      });
    }

    // Opponent-specific recommendations
    if (opponentData && opponentData.length > 0) {
      const oppAvgScore = opponentData.reduce((sum, d) => sum + d.runs_scored, 0) / opponentData.length;
      const oppTopScorer = opponentData.reduce((max, d) => (d.runs_scored > max.runs_scored ? d : max), opponentData[0]);
      const oppTopBowler = opponentData.reduce((max, d) => (d.wickets_taken > max.wickets_taken ? d : max), opponentData[0]);

      recs.push({
        id: "opp-1",
        category: "strategy",
        title: `Target ${selectedOpponent.replace(" (NPL)", "")} Weaknesses`,
        description: "Specific strategies against the selected opponent.",
        impact: "high",
        actionItems: [
          `Watch for ${oppTopScorer.player_name} - their top scorer`,
          `Plan against ${oppTopBowler.player_name} - their main bowler`,
          oppAvgScore > 25 ? "Focus on early wickets to disrupt batting" : "Their batting is vulnerable - attack early",
          "Study their death bowling patterns",
        ],
      });
    }

    // Win rate based recommendations
    if (teamStats && teamStats.win_rate < 50) {
      recs.push({
        id: "strat-2",
        category: "strategy",
        title: "Improve Win Rate",
        description: `Current win rate (${formatPercentage(teamStats.win_rate)}) needs improvement.`,
        impact: "high",
        actionItems: [
          "Focus on closing out tight matches",
          "Better death over execution needed",
          "Improve powerplay performance",
          "Build a balanced playing XI",
        ],
      });
    }

    return recs;
  }, [selectedTeam, selectedOpponent, masterData, teamPerformance, tossImpact]);

  // Download prescriptive report
  const downloadReport = async () => {
    if (!selectedTeam || recommendations.length === 0) return;

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(24);
    pdf.setTextColor(79, 70, 229);
    pdf.text("NPL Prescriptive Analytics Report", pageWidth / 2, 20, { align: "center" });

    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text("What Should We Do? - Strategic Recommendations", pageWidth / 2, 30, { align: "center" });
    pdf.text(`Team: ${selectedTeam.replace(" (NPL)", "")}`, pageWidth / 2, 37, { align: "center" });
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 44, { align: "center" });

    let yPos = 60;

    recommendations.forEach((rec, idx) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${idx + 1}. ${rec.title}`, 20, yPos);
      yPos += 7;

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(rec.description, 25, yPos, { maxWidth: 160 });
      yPos += 12;

      pdf.setFontSize(9);
      pdf.text(`Impact: ${rec.impact.toUpperCase()} | Category: ${rec.category.toUpperCase()}`, 25, yPos);
      yPos += 8;

      rec.actionItems.forEach((action) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(`  • ${action}`, 30, yPos);
        yPos += 6;
      });

      yPos += 10;
    });

    pdf.save(`prescriptive-analytics-${selectedTeam.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-400">Loading Prescriptive Analytics...</p>
        </div>
      </div>
    );
  }

  const getCategoryIcon = (category: Recommendation["category"]) => {
    switch (category) {
      case "batting":
        return Target;
      case "bowling":
        return Zap;
      case "fielding":
        return Shield;
      case "strategy":
        return Lightbulb;
    }
  };

  const getCategoryColor = (category: Recommendation["category"]) => {
    switch (category) {
      case "batting":
        return "text-green-400 bg-green-500/20";
      case "bowling":
        return "text-purple-400 bg-purple-500/20";
      case "fielding":
        return "text-blue-400 bg-blue-500/20";
      case "strategy":
        return "text-yellow-400 bg-yellow-500/20";
    }
  };

  const getImpactColor = (impact: Recommendation["impact"]) => {
    switch (impact) {
      case "high":
        return "success";
      case "medium":
        return "default";
      case "low":
        return "error";
    }
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
            <Lightbulb className="h-8 w-8 text-yellow-400" />
            Prescriptive Analytics
          </motion.h1>
          <p className="mt-1 text-slate-400">
            What should we do? • AI-powered strategic recommendations
          </p>
        </div>
        {selectedTeam && recommendations.length > 0 && (
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 rounded-xl bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Strategy Report
          </button>
        )}
      </div>

      {/* Team Selection */}
      <Card title="Select Team for Analysis" subtitle="Choose your team and optionally an opponent">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Your Team</label>
            <Select
              value={selectedTeam}
              onChange={(value) => setSelectedTeam(value)}
              options={[
                { value: "", label: "Select Team" },
                ...teams.map((t) => ({ value: t, label: t.replace(" (NPL)", "") })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Opponent (Optional)
            </label>
            <Select
              value={selectedOpponent}
              onChange={(value) => setSelectedOpponent(value)}
              options={[
                { value: "", label: "No Specific Opponent" },
                ...teams
                  .filter((t) => t !== selectedTeam)
                  .map((t) => ({ value: t, label: t.replace(" (NPL)", "") })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      {selectedTeam && recommendations.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Batting Tips", count: recommendations.filter((r) => r.category === "batting").length, icon: Target, color: "green" },
              { label: "Bowling Tips", count: recommendations.filter((r) => r.category === "bowling").length, icon: Zap, color: "purple" },
              { label: "Fielding Tips", count: recommendations.filter((r) => r.category === "fielding").length, icon: Shield, color: "blue" },
              { label: "Strategy Tips", count: recommendations.filter((r) => r.category === "strategy").length, icon: Lightbulb, color: "yellow" },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${item.color}-500/20`}>
                      <item.icon className={`h-6 w-6 text-${item.color}-400`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{item.count}</p>
                      <p className="text-sm text-slate-400">{item.label}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Detailed Recommendations */}
          <div className="space-y-4">
            {recommendations.map((rec, idx) => {
              const Icon = getCategoryIcon(rec.category);
              const colorClass = getCategoryColor(rec.category);

              return (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card>
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">{rec.title}</h3>
                          <Badge variant={getImpactColor(rec.impact)}>
                            {rec.impact.toUpperCase()} Impact
                          </Badge>
                          <Badge variant="default" className="capitalize">
                            {rec.category}
                          </Badge>
                        </div>

                        <p className="text-slate-400 mb-4">{rec.description}</p>

                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-300">Action Items:</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {rec.actionItems.map((action, actionIdx) => (
                              <div
                                key={actionIdx}
                                className="flex items-start gap-2 rounded-lg bg-slate-700/50 p-3"
                              >
                                <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-slate-300">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : selectedTeam ? (
        <Card>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Analyzing team data...</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-12">
            <Lightbulb className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Select a Team</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Choose a team from the dropdown above to receive AI-powered strategic
              recommendations based on historical performance data.
            </p>
          </div>
        </Card>
      )}

      {/* How It Works */}
      <Card title="How Prescriptive Analytics Works" subtitle="Our recommendation engine process">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            {
              step: 1,
              title: "Data Collection",
              description: "Gather historical match data, player statistics, and performance metrics",
              icon: Activity,
            },
            {
              step: 2,
              title: "Pattern Analysis",
              description: "Identify strengths, weaknesses, and performance patterns",
              icon: TrendingUp,
            },
            {
              step: 3,
              title: "AI Processing",
              description: "Apply machine learning models to generate insights",
              icon: Zap,
            },
            {
              step: 4,
              title: "Recommendations",
              description: "Deliver actionable strategies tailored to your team",
              icon: Lightbulb,
            },
          ].map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              <div className="rounded-xl bg-slate-700/50 p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 mx-auto mb-3">
                  <item.icon className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                  {item.step}
                </div>
                <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
              {idx < 3 && (
                <ArrowRight className="hidden md:block absolute top-1/2 -right-3 h-6 w-6 text-slate-600 transform -translate-y-1/2" />
              )}
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
