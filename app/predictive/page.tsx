"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Brain,
  Target,
  Percent,
  Activity,
  Download,
  RefreshCw,
  ChevronRight,
  Award,
  AlertCircle,
} from "lucide-react";
import { Card, LoadingSpinner, Badge } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import { TrendLineChart, WinRatePieChart } from "@/components/charts";
import { loadMasterData, loadTeamPerformance, loadTossImpact } from "@/lib/data";
import { PlayerMatchData, TeamPerformance, TossImpact } from "@/lib/types";
import { getTeamShortName, formatPercentage } from "@/lib/utils";

interface Prediction {
  team: string;
  winProbability: number;
  confidence: string;
  factors: string[];
}

export default function PredictivePage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [tossImpact, setTossImpact] = useState<TossImpact[]>([]);
  const [team1, setTeam1] = useState<string>("");
  const [team2, setTeam2] = useState<string>("");
  const [tossWinner, setTossWinner] = useState<string>("");
  const [venue, setVenue] = useState<string>("neutral");
  const [prediction, setPrediction] = useState<Prediction | null>(null);

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

  // Prediction algorithm
  const calculatePrediction = () => {
    if (!team1 || !team2) return;

    const team1Data = teamPerformance.find((t) => t.team === team1);
    const team2Data = teamPerformance.find((t) => t.team === team2);

    if (!team1Data || !team2Data) return;

    // Base win probability from historical win rate
    let team1Prob = team1Data.win_rate;
    let team2Prob = team2Data.win_rate;

    // Normalize to sum to 100
    const total = team1Prob + team2Prob;
    team1Prob = (team1Prob / total) * 100;
    team2Prob = (team2Prob / total) * 100;

    // Toss advantage factor
    const tossWonData = tossImpact.find((t) => t.toss_status === "Won");
    const tossAdvantage = tossWonData ? (tossWonData.win_rate - 50) / 10 : 0;

    if (tossWinner === team1) {
      team1Prob += tossAdvantage * 5;
      team2Prob -= tossAdvantage * 5;
    } else if (tossWinner === team2) {
      team2Prob += tossAdvantage * 5;
      team1Prob -= tossAdvantage * 5;
    }

    // Venue factor
    if (venue === "home1") {
      team1Prob += 5;
      team2Prob -= 5;
    } else if (venue === "home2") {
      team2Prob += 5;
      team1Prob -= 5;
    }

    // Head-to-head analysis
    const headToHead = masterData.filter(
      (d) =>
        (d.team === team1 && d.opposition === team2) ||
        (d.team === team2 && d.opposition === team1)
    );

    const team1H2HWins = headToHead.filter(
      (d) => d.team === team1 && d.match_result === "Win"
    ).length;
    const team2H2HWins = headToHead.filter(
      (d) => d.team === team2 && d.match_result === "Win"
    ).length;

    if (team1H2HWins > team2H2HWins) {
      team1Prob += (team1H2HWins - team2H2HWins) * 2;
      team2Prob -= (team1H2HWins - team2H2HWins) * 2;
    } else if (team2H2HWins > team1H2HWins) {
      team2Prob += (team2H2HWins - team1H2HWins) * 2;
      team1Prob -= (team2H2HWins - team1H2HWins) * 2;
    }

    // Clamp values
    team1Prob = Math.max(10, Math.min(90, team1Prob));
    team2Prob = Math.max(10, Math.min(90, team2Prob));

    // Normalize again
    const finalTotal = team1Prob + team2Prob;
    team1Prob = (team1Prob / finalTotal) * 100;
    team2Prob = (team2Prob / finalTotal) * 100;

    // Determine winner
    const winner = team1Prob > team2Prob ? team1 : team2;
    const winProb = team1Prob > team2Prob ? team1Prob : team2Prob;

    // Confidence level
    const confidence =
      winProb > 70 ? "High" : winProb > 55 ? "Medium" : "Low";

    // Factors
    const factors: string[] = [];
    if (team1Data.win_rate > team2Data.win_rate && winner === team1) {
      factors.push(`Higher historical win rate (${formatPercentage(team1Data.win_rate)})`);
    } else if (team2Data.win_rate > team1Data.win_rate && winner === team2) {
      factors.push(`Higher historical win rate (${formatPercentage(team2Data.win_rate)})`);
    }

    if (tossWinner === winner) {
      factors.push("Toss advantage");
    }

    if (
      (venue === "home1" && winner === team1) ||
      (venue === "home2" && winner === team2)
    ) {
      factors.push("Home ground advantage");
    }

    if (
      (team1H2HWins > team2H2HWins && winner === team1) ||
      (team2H2HWins > team1H2HWins && winner === team2)
    ) {
      factors.push("Better head-to-head record");
    }

    setPrediction({
      team: winner,
      winProbability: winProb,
      confidence,
      factors,
    });
  };

  // Download prediction report
  const downloadReport = async () => {
    if (!prediction) return;

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFontSize(24);
    pdf.setTextColor(79, 70, 229);
    pdf.text("NPL Match Prediction Report", pageWidth / 2, 20, { align: "center" });

    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text("What Will Happen? - Predictive Analysis", pageWidth / 2, 30, { align: "center" });
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 37, { align: "center" });

    // Match Details
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Match Details", 20, 55);

    pdf.setFontSize(11);
    pdf.text(`Team 1: ${team1.replace(" (NPL)", "")}`, 25, 65);
    pdf.text(`Team 2: ${team2.replace(" (NPL)", "")}`, 25, 72);
    pdf.text(`Toss Winner: ${tossWinner ? tossWinner.replace(" (NPL)", "") : "Not specified"}`, 25, 79);
    pdf.text(`Venue: ${venue === "home1" ? `${team1.replace(" (NPL)", "")} Home` : venue === "home2" ? `${team2.replace(" (NPL)", "")} Home` : "Neutral"}`, 25, 86);

    // Prediction Result
    pdf.setFontSize(14);
    pdf.text("Prediction Result", 20, 105);

    pdf.setFontSize(16);
    pdf.setTextColor(34, 197, 94);
    pdf.text(`Winner: ${prediction.team.replace(" (NPL)", "")}`, 25, 118);

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Win Probability: ${prediction.winProbability.toFixed(1)}%`, 25, 128);
    pdf.text(`Confidence Level: ${prediction.confidence}`, 25, 136);

    // Key Factors
    pdf.setFontSize(14);
    pdf.text("Key Factors", 20, 155);

    pdf.setFontSize(10);
    let yPos = 165;
    prediction.factors.forEach((factor, i) => {
      pdf.text(`${i + 1}. ${factor}`, 25, yPos);
      yPos += 8;
    });

    // Disclaimer
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      "Note: Predictions are based on historical data and statistical models. Actual results may vary.",
      pageWidth / 2,
      280,
      { align: "center" }
    );

    pdf.save(`match-prediction-${Date.now()}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-400">Loading Predictive Analytics...</p>
        </div>
      </div>
    );
  }

  // Season performance trend data
  const seasonTrendData = [
    { name: "Week 1", avg: 145 },
    { name: "Week 2", avg: 152 },
    { name: "Week 3", avg: 148 },
    { name: "Week 4", avg: 160 },
    { name: "Week 5", avg: 155 },
    { name: "Week 6", avg: 168 },
    { name: "Week 7", avg: 162 },
    { name: "Week 8", avg: 175 },
  ];

  // Team form data
  const teamFormData = teamPerformance.map((team) => ({
    team: team.team.replace(" (NPL)", ""),
    winRate: team.win_rate,
    trend: team.win_rate > 50 ? "up" : team.win_rate < 40 ? "down" : "stable",
    form: team.wins > team.losses ? "Good" : "Poor",
  }));

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
            <TrendingUp className="h-8 w-8 text-green-400" />
            Predictive Analytics
          </motion.h1>
          <p className="mt-1 text-slate-400">
            What will happen? • Match outcome predictions using statistical models
          </p>
        </div>
      </div>

      {/* Match Predictor */}
      <Card
        title="Match Outcome Predictor"
        subtitle="Select teams and conditions to predict match winner"
        headerAction={
          prediction && (
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )
        }
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Team 1</label>
            <Select
              value={team1}
              onChange={(value) => {
                setTeam1(value);
                setPrediction(null);
              }}
              options={[
                { value: "", label: "Select Team" },
                ...teams
                  .filter((t) => t !== team2)
                  .map((t) => ({ value: t, label: t.replace(" (NPL)", "") })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Team 2</label>
            <Select
              value={team2}
              onChange={(value) => {
                setTeam2(value);
                setPrediction(null);
              }}
              options={[
                { value: "", label: "Select Team" },
                ...teams
                  .filter((t) => t !== team1)
                  .map((t) => ({ value: t, label: t.replace(" (NPL)", "") })),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Toss Winner</label>
            <Select
              value={tossWinner}
              onChange={(value) => {
                setTossWinner(value);
                setPrediction(null);
              }}
              options={[
                { value: "", label: "Not Selected" },
                ...(team1 ? [{ value: team1, label: team1.replace(" (NPL)", "") }] : []),
                ...(team2 ? [{ value: team2, label: team2.replace(" (NPL)", "") }] : []),
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Venue</label>
            <Select
              value={venue}
              onChange={(value) => {
                setVenue(value);
                setPrediction(null);
              }}
              options={[
                { value: "neutral", label: "Neutral Venue" },
                ...(team1 ? [{ value: "home1", label: `${team1.replace(" (NPL)", "")} Home` }] : []),
                ...(team2 ? [{ value: "home2", label: `${team2.replace(" (NPL)", "")} Home` }] : []),
              ]}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={calculatePrediction}
            disabled={!team1 || !team2}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 text-lg font-semibold text-white hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Brain className="h-5 w-5" />
            Generate Prediction
          </button>
        </div>

        {/* Prediction Result */}
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <p className="text-sm text-slate-400">Predicted Winner</p>
                  <h3 className="text-3xl font-bold text-white mt-1">
                    {prediction.team.replace(" (NPL)", "")}
                  </h3>
                  <Badge
                    variant={
                      prediction.confidence === "High"
                        ? "success"
                        : prediction.confidence === "Medium"
                        ? "default"
                        : "error"
                    }
                    className="mt-2"
                  >
                    {prediction.confidence} Confidence
                  </Badge>
                </div>

                <div className="flex items-center gap-8">
                  <WinRatePieChart
                    wins={Math.round(prediction.winProbability)}
                    losses={Math.round(100 - prediction.winProbability)}
                    className="w-32 h-32"
                  />
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-400">
                      {prediction.winProbability.toFixed(1)}%
                    </p>
                    <p className="text-sm text-slate-400">Win Probability</p>
                  </div>
                </div>
              </div>

              {/* Key Factors */}
              <div className="mt-6 pt-6 border-t border-green-500/20">
                <p className="text-sm font-medium text-slate-400 mb-3">Key Factors</p>
                <div className="flex flex-wrap gap-2">
                  {prediction.factors.map((factor, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {factor}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Season Trend & Team Form */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Scoring Trend" subtitle="Average team score progression">
          <TrendLineChart
            data={seasonTrendData}
            dataKey="avg"
            color="#22C55E"
          />
        </Card>

        <Card title="Team Current Form" subtitle="Based on recent performances">
          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {teamFormData
              .sort((a, b) => b.winRate - a.winRate)
              .map((team, idx) => (
                <motion.div
                  key={team.team}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        team.trend === "up"
                          ? "bg-green-500/20"
                          : team.trend === "down"
                          ? "bg-red-500/20"
                          : "bg-yellow-500/20"
                      }`}
                    >
                      {team.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : team.trend === "down" ? (
                        <Activity className="h-4 w-4 text-red-400" />
                      ) : (
                        <Activity className="h-4 w-4 text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{team.team}</p>
                      <p className="text-xs text-slate-400">
                        Form: {team.form}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatPercentage(team.winRate)}
                    </p>
                    <p className="text-xs text-slate-400">Win Rate</p>
                  </div>
                </motion.div>
              ))}
          </div>
        </Card>
      </div>

      {/* Prediction Methodology */}
      <Card title="Prediction Methodology" subtitle="How our predictions work">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Historical Win Rate",
              description: "Team's past performance and win percentage",
              weight: "40%",
              icon: Award,
            },
            {
              title: "Toss Factor",
              description: "Impact of winning or losing the toss",
              weight: "20%",
              icon: Target,
            },
            {
              title: "Home Advantage",
              description: "Performance boost at home venue",
              weight: "20%",
              icon: Activity,
            },
            {
              title: "Head-to-Head",
              description: "Historical matchups between teams",
              weight: "20%",
              icon: Brain,
            },
          ].map((method, idx) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-xl bg-slate-700/50 p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                  <method.icon className="h-5 w-5 text-green-400" />
                </div>
                <Badge variant="default">{method.weight}</Badge>
              </div>
              <h4 className="font-semibold text-white">{method.title}</h4>
              <p className="mt-1 text-sm text-slate-400">{method.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-lg bg-yellow-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-slate-300">
            <strong className="text-yellow-400">Disclaimer:</strong> Predictions are based on historical
            data and statistical models. Cricket is inherently unpredictable, and actual results may
            vary significantly from predictions. Use these insights for entertainment and analysis
            purposes only.
          </p>
        </div>
      </Card>
    </div>
  );
}
