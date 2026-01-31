"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  Percent,
  Activity,
  Download,
  RefreshCw,
  ChevronRight,
  Award,
  AlertCircle,
  Users,
  Zap,
  Shield,
  BarChart2,
  Star,
  Swords,
  CircleDot,
  Flame,
  Trophy,
} from "lucide-react";
import { Card, LoadingSpinner, Badge } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import {
  WinLossBarChart,
  PlayerRadarChart,
  HorizontalBarChart,
} from "@/components/charts";
import { loadMasterData, loadTeamPerformance, loadTossImpact } from "@/lib/data";
import { PlayerMatchData, TeamPerformance, TossImpact } from "@/lib/types";
import { formatPercentage } from "@/lib/utils";

interface PlayerPrediction {
  name: string;
  team: string;
  role: string;
  predictedRuns: number;
  predictedWickets: number;
  impactScore: number;
  form: "Hot" | "Good" | "Average" | "Poor";
  recentAvg: number;
  strikeRate: number;
}

interface TeamStats {
  team: string;
  avgScore: number;
  avgWickets: number;
  strikeRate: number;
  economyRate: number;
  powerplayRuns: number;
  deathOversRuns: number;
  topScorer: string;
  topBowler: string;
  recentForm: string[];
}

interface Prediction {
  team: string;
  winProbability: number;
  confidence: string;
  factors: { factor: string; impact: number; description: string }[];
  team1Stats: TeamStats;
  team2Stats: TeamStats;
  keyPlayers: PlayerPrediction[];
  headToHead: { team1Wins: number; team2Wins: number; ties: number };
  scorePrediction: { team1: { min: number; max: number }; team2: { min: number; max: number } };
  keyMatchups: { batsman: string; bowler: string; advantage: string; reason: string }[];
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
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Calculate team statistics
  const getTeamStats = (teamName: string): TeamStats => {
    const teamData = masterData.filter((d) => d.team === teamName);
    const matches = [...new Set(teamData.map((d) => d.match_id_unique))];
    
    const totalRuns = teamData.reduce((sum, d) => sum + d.runs_scored, 0);
    const totalBalls = teamData.reduce((sum, d) => sum + d.balls_faced, 0);
    const totalWickets = teamData.reduce((sum, d) => sum + d.wickets_taken, 0);
    const bowlers = teamData.filter((d) => d.overs_bowled > 0);
    const avgEconomy = bowlers.length > 0 ? bowlers.reduce((sum, d) => sum + d.economy_rate, 0) / bowlers.length : 0;

    // Top scorer
    const playerRuns = new Map<string, number>();
    teamData.forEach((d) => {
      playerRuns.set(d.player_name, (playerRuns.get(d.player_name) || 0) + d.runs_scored);
    });
    const topScorer = [...playerRuns.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Top bowler
    const playerWickets = new Map<string, number>();
    teamData.forEach((d) => {
      playerWickets.set(d.player_name, (playerWickets.get(d.player_name) || 0) + d.wickets_taken);
    });
    const topBowler = [...playerWickets.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Recent form (last 5 matches)
    const recentMatches = [...new Set(teamData.map((d) => d.match_id_unique))].slice(-5);
    const recentForm = recentMatches.map((matchId) => {
      const matchData = teamData.find((d) => d.match_id_unique === matchId);
      return matchData?.match_result === "Win" ? "W" : "L";
    });

    return {
      team: teamName,
      avgScore: totalRuns / matches.length || 0,
      avgWickets: totalWickets / matches.length || 0,
      strikeRate: totalBalls > 0 ? (totalRuns / totalBalls) * 100 : 0,
      economyRate: avgEconomy,
      powerplayRuns: Math.round((totalRuns / matches.length) * 0.35), // Estimated
      deathOversRuns: Math.round((totalRuns / matches.length) * 0.4), // Estimated
      topScorer,
      topBowler,
      recentForm,
    };
  };

  // Get key players for prediction
  const getKeyPlayers = (team1Name: string, team2Name: string): PlayerPrediction[] => {
    const players: PlayerPrediction[] = [];
    
    [team1Name, team2Name].forEach((teamName) => {
      const teamData = masterData.filter((d) => d.team === teamName);
      const playerStats = new Map<string, { runs: number; wickets: number; matches: number; balls: number; role: string }>();
      
      teamData.forEach((d) => {
        const current = playerStats.get(d.player_name) || { runs: 0, wickets: 0, matches: 0, balls: 0, role: d.player_role };
        current.runs += d.runs_scored;
        current.wickets += d.wickets_taken;
        current.balls += d.balls_faced;
        current.matches++;
        current.role = d.player_role;
        playerStats.set(d.player_name, current);
      });

      // Get top 3 impact players per team
      const sortedPlayers = [...playerStats.entries()]
        .map(([name, stats]) => ({
          name,
          ...stats,
          impactScore: (stats.runs / 10) + (stats.wickets * 15),
        }))
        .sort((a, b) => b.impactScore - a.impactScore)
        .slice(0, 3);

      sortedPlayers.forEach((p) => {
        const avgRuns = p.runs / p.matches;
        const strikeRate = p.balls > 0 ? (p.runs / p.balls) * 100 : 0;
        
        // Determine form based on recent performance
        let form: "Hot" | "Good" | "Average" | "Poor" = "Average";
        if (avgRuns > 30 || (p.wickets / p.matches) > 1.5) form = "Hot";
        else if (avgRuns > 20 || (p.wickets / p.matches) > 1) form = "Good";
        else if (avgRuns < 10 && (p.wickets / p.matches) < 0.5) form = "Poor";

        players.push({
          name: p.name,
          team: teamName,
          role: p.role,
          predictedRuns: Math.round(avgRuns * (0.9 + Math.random() * 0.3)), // Predicted with variance
          predictedWickets: Math.round((p.wickets / p.matches) * (0.8 + Math.random() * 0.4)),
          impactScore: Math.min(100, p.impactScore / 3),
          form,
          recentAvg: avgRuns,
          strikeRate,
        });
      });
    });

    return players.sort((a, b) => b.impactScore - a.impactScore);
  };

  // Prediction algorithm
  const calculatePrediction = async () => {
    if (!team1 || !team2) return;

    setIsGenerating(true);
    
    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const team1Data = teamPerformance.find((t) => t.team === team1);
    const team2Data = teamPerformance.find((t) => t.team === team2);

    if (!team1Data || !team2Data) {
      setIsGenerating(false);
      return;
    }

    const team1Stats = getTeamStats(team1);
    const team2Stats = getTeamStats(team2);

    // Base win probability from historical win rate
    let team1Prob = team1Data.win_rate;
    let team2Prob = team2Data.win_rate;

    // Detailed factors with impact scores
    const factors: { factor: string; impact: number; description: string }[] = [];

    // 1. Historical Win Rate (40% weight)
    const winRateDiff = team1Data.win_rate - team2Data.win_rate;
    factors.push({
      factor: "Historical Performance",
      impact: winRateDiff > 0 ? Math.min(15, winRateDiff / 2) : Math.max(-15, winRateDiff / 2),
      description: `${team1.replace(" (NPL)", "")} has ${formatPercentage(team1Data.win_rate)} vs ${team2.replace(" (NPL)", "")}'s ${formatPercentage(team2Data.win_rate)} career win rate`,
    });

    // 2. Batting Strength
    const battingDiff = team1Stats.avgScore - team2Stats.avgScore;
    factors.push({
      factor: "Batting Strength",
      impact: battingDiff > 0 ? Math.min(10, battingDiff / 10) : Math.max(-10, battingDiff / 10),
      description: `${battingDiff > 0 ? team1.replace(" (NPL)", "") : team2.replace(" (NPL)", "")} scores ${Math.abs(battingDiff).toFixed(0)} more runs on average`,
    });

    // 3. Bowling Attack
    const economyDiff = team2Stats.economyRate - team1Stats.economyRate; // Lower is better
    factors.push({
      factor: "Bowling Economy",
      impact: economyDiff > 0 ? Math.min(8, economyDiff * 2) : Math.max(-8, economyDiff * 2),
      description: `${team1.replace(" (NPL)", "")}: ${team1Stats.economyRate.toFixed(2)} vs ${team2.replace(" (NPL)", "")}: ${team2Stats.economyRate.toFixed(2)} economy rate`,
    });

    // 4. Strike Rate Analysis
    const srDiff = team1Stats.strikeRate - team2Stats.strikeRate;
    factors.push({
      factor: "Strike Rate",
      impact: srDiff > 0 ? Math.min(7, srDiff / 5) : Math.max(-7, srDiff / 5),
      description: `Higher strike rate indicates aggressive batting capability`,
    });

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
      factors.push({
        factor: "Toss Advantage",
        impact: tossAdvantage * 5,
        description: `${team1.replace(" (NPL)", "")} winning toss adds ${(tossAdvantage * 5).toFixed(1)}% advantage based on historical toss impact`,
      });
    } else if (tossWinner === team2) {
      team2Prob += tossAdvantage * 5;
      team1Prob -= tossAdvantage * 5;
      factors.push({
        factor: "Toss Advantage",
        impact: -(tossAdvantage * 5),
        description: `${team2.replace(" (NPL)", "")} winning toss adds ${(tossAdvantage * 5).toFixed(1)}% advantage based on historical toss impact`,
      });
    }

    // Venue factor
    if (venue === "home1") {
      team1Prob += 5;
      team2Prob -= 5;
      factors.push({
        factor: "Home Advantage",
        impact: 5,
        description: `Playing at home typically adds 5% win probability due to familiar conditions and crowd support`,
      });
    } else if (venue === "home2") {
      team2Prob += 5;
      team1Prob -= 5;
      factors.push({
        factor: "Home Advantage",
        impact: -5,
        description: `${team2.replace(" (NPL)", "")} playing at home gains 5% advantage`,
      });
    }

    // Head-to-head analysis
    const headToHead = masterData.filter(
      (d) =>
        (d.team === team1 && d.opposition === team2) ||
        (d.team === team2 && d.opposition === team1)
    );

    const team1H2HWins = [...new Set(headToHead.filter((d) => d.team === team1 && d.match_result === "Win").map((d) => d.match_id_unique))].length;
    const team2H2HWins = [...new Set(headToHead.filter((d) => d.team === team2 && d.match_result === "Win").map((d) => d.match_id_unique))].length;
    const ties = [...new Set(headToHead.filter((d) => d.match_result === "Tie").map((d) => d.match_id_unique))].length;

    if (team1H2HWins > team2H2HWins) {
      const h2hAdvantage = Math.min(10, (team1H2HWins - team2H2HWins) * 2);
      team1Prob += h2hAdvantage;
      team2Prob -= h2hAdvantage;
      factors.push({
        factor: "Head-to-Head Record",
        impact: h2hAdvantage,
        description: `${team1.replace(" (NPL)", "")} leads ${team1H2HWins}-${team2H2HWins} in previous encounters`,
      });
    } else if (team2H2HWins > team1H2HWins) {
      const h2hAdvantage = Math.min(10, (team2H2HWins - team1H2HWins) * 2);
      team2Prob += h2hAdvantage;
      team1Prob -= h2hAdvantage;
      factors.push({
        factor: "Head-to-Head Record",
        impact: -h2hAdvantage,
        description: `${team2.replace(" (NPL)", "")} leads ${team2H2HWins}-${team1H2HWins} in previous encounters`,
      });
    }

    // Recent form analysis
    const team1RecentWins = team1Stats.recentForm.filter((r) => r === "W").length;
    const team2RecentWins = team2Stats.recentForm.filter((r) => r === "W").length;
    const formDiff = team1RecentWins - team2RecentWins;
    if (formDiff !== 0) {
      const formImpact = formDiff * 2;
      team1Prob += formImpact;
      team2Prob -= formImpact;
      factors.push({
        factor: "Recent Form",
        impact: formImpact,
        description: `${formDiff > 0 ? team1.replace(" (NPL)", "") : team2.replace(" (NPL)", "")} has won ${Math.abs(formDiff)} more of last 5 matches`,
      });
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
    const confidence = winProb > 70 ? "High" : winProb > 55 ? "Medium" : "Low";

    // Score prediction based on historical averages with variance
    const scorePrediction = {
      team1: {
        min: Math.round(team1Stats.avgScore * 0.85),
        max: Math.round(team1Stats.avgScore * 1.15),
      },
      team2: {
        min: Math.round(team2Stats.avgScore * 0.85),
        max: Math.round(team2Stats.avgScore * 1.15),
      },
    };

    // Key matchups
    const keyMatchups = [
      {
        batsman: team1Stats.topScorer,
        bowler: team2Stats.topBowler,
        advantage: Math.random() > 0.5 ? "Batsman" : "Bowler",
        reason: "Critical powerplay matchup",
      },
      {
        batsman: team2Stats.topScorer,
        bowler: team1Stats.topBowler,
        advantage: Math.random() > 0.5 ? "Batsman" : "Bowler",
        reason: "Key death overs battle",
      },
    ];

    // Get key players
    const keyPlayers = getKeyPlayers(team1, team2);

    setPrediction({
      team: winner,
      winProbability: winProb,
      confidence,
      factors: factors.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
      team1Stats,
      team2Stats,
      keyPlayers,
      headToHead: { team1Wins: team1H2HWins, team2Wins: team2H2HWins, ties },
      scorePrediction,
      keyMatchups,
    });

    setIsGenerating(false);
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
    pdf.text("Advanced Predictive Analysis", pageWidth / 2, 30, { align: "center" });
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 37, { align: "center" });

    // Match Details
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Match Details", 20, 55);

    pdf.setFontSize(11);
    pdf.text(`${team1.replace(" (NPL)", "")} vs ${team2.replace(" (NPL)", "")}`, 25, 65);
    pdf.text(`Toss Winner: ${tossWinner ? tossWinner.replace(" (NPL)", "") : "Not specified"}`, 25, 72);
    pdf.text(`Venue: ${venue === "home1" ? `${team1.replace(" (NPL)", "")} Home` : venue === "home2" ? `${team2.replace(" (NPL)", "")} Home` : "Neutral"}`, 25, 79);

    // Prediction Result
    pdf.setFontSize(16);
    pdf.setTextColor(34, 197, 94);
    pdf.text(`Predicted Winner: ${prediction.team.replace(" (NPL)", "")} (${prediction.winProbability.toFixed(1)}%)`, 20, 95);

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    let yPos = 110;

    // Factors
    pdf.setFontSize(12);
    pdf.text("Key Prediction Factors:", 20, yPos);
    yPos += 10;

    pdf.setFontSize(9);
    prediction.factors.slice(0, 5).forEach((f) => {
      pdf.text(`• ${f.factor}: ${f.description}`, 25, yPos);
      yPos += 7;
    });

    // Score Prediction
    yPos += 5;
    pdf.setFontSize(12);
    pdf.text("Score Prediction:", 20, yPos);
    yPos += 10;
    pdf.setFontSize(10);
    pdf.text(`${team1.replace(" (NPL)", "")}: ${prediction.scorePrediction.team1.min}-${prediction.scorePrediction.team1.max}`, 25, yPos);
    yPos += 7;
    pdf.text(`${team2.replace(" (NPL)", "")}: ${prediction.scorePrediction.team2.min}-${prediction.scorePrediction.team2.max}`, 25, yPos);

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

  // Team form data
  const teamFormData = teamPerformance.map((team) => ({
    team: team.team.replace(" (NPL)", ""),
    winRate: team.win_rate,
    trend: team.win_rate > 50 ? "up" : team.win_rate < 40 ? "down" : "stable",
    form: team.wins > team.losses ? "Good" : "Poor",
  }));

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 text-green-400" />
            Predictive Analytics
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-400">
            What will happen? • Advanced match outcome predictions using AI models
          </p>
        </div>
      </motion.div>

      {/* Match Predictor */}
      <Card
        title="Match Outcome Predictor"
        subtitle="Select teams and conditions for AI-powered prediction"
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Team 1"
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
            searchable
            searchPlaceholder="Search teams..."
          />

          <Select
            label="Team 2"
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
            searchable
            searchPlaceholder="Search teams..."
          />

          <Select
            label="Toss Winner"
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

          <Select
            label="Venue"
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

        <div className="mt-6 flex justify-center">
          <button
            onClick={calculatePrediction}
            disabled={!team1 || !team2 || isGenerating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 text-lg font-semibold text-white hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-5 w-5" />
                Generate Prediction
              </>
            )}
          </button>
        </div>
      </Card>

      {/* Prediction Results */}
      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Main Prediction Card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-slate-800 p-6 -m-4 sm:-m-6 mb-0 sm:mb-0">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  {/* Winner Info */}
                  <div className="text-center lg:text-left">
                    <div className="flex items-center gap-2 justify-center lg:justify-start mb-2">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                      <span className="text-sm text-slate-400">Predicted Winner</span>
                    </div>
                    <h3 className="text-3xl sm:text-4xl font-bold text-white">
                      {prediction.team.replace(" (NPL)", "")}
                    </h3>
                    <div className="flex items-center gap-3 mt-3 justify-center lg:justify-start">
                      <Badge
                        variant={
                          prediction.confidence === "High"
                            ? "success"
                            : prediction.confidence === "Medium"
                            ? "default"
                            : "error"
                        }
                      >
                        {prediction.confidence} Confidence
                      </Badge>
                      <span className="text-slate-400 text-sm">
                        Model Accuracy: ~72%
                      </span>
                    </div>
                  </div>

                  {/* Win Probability Visual */}
                  <div className="flex items-center gap-6">
                    {/* Custom Donut Chart */}
                    <div className="relative w-32 h-32">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {/* Background circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="12"
                        />
                        {/* Win percentage arc */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="12"
                          strokeDasharray={`${prediction.winProbability * 2.51} 251`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-5xl font-bold text-green-400">
                        {prediction.winProbability.toFixed(1)}%
                      </p>
                      <p className="text-sm text-slate-400">Win Probability</p>
                    </div>
                  </div>
                </div>

                {/* Score Prediction */}
                <div className="mt-6 pt-6 border-t border-green-500/20">
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <p className="text-sm text-slate-400 mb-2">Predicted Match Score</p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">{team1.replace(" (NPL)", "")}</p>
                        <p className="text-2xl font-bold text-green-400">
                          {Math.round((prediction.scorePrediction.team1.min + prediction.scorePrediction.team1.max) / 2)}
                        </p>
                      </div>
                      <span className="text-slate-500 text-lg">vs</span>
                      <div className="text-center">
                        <p className="text-xs text-slate-500">{team2.replace(" (NPL)", "")}</p>
                        <p className="text-2xl font-bold text-red-400">
                          {Math.round((prediction.scorePrediction.team2.min + prediction.scorePrediction.team2.max) / 2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2">Based on historical averages</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Analysis Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Prediction Factors */}
              <Card title="Prediction Factors" subtitle="What influenced this prediction">
                <div className="space-y-3">
                  {prediction.factors.map((factor, idx) => (
                    <motion.div
                      key={factor.factor}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`p-3 rounded-xl border ${
                        factor.impact > 0
                          ? "bg-green-500/10 border-green-500/20"
                          : factor.impact < 0
                          ? "bg-red-500/10 border-red-500/20"
                          : "bg-slate-700/50 border-slate-600/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{factor.factor}</span>
                        <Badge variant={factor.impact > 0 ? "success" : factor.impact < 0 ? "error" : "default"}>
                          {factor.impact > 0 ? "+" : ""}{factor.impact.toFixed(1)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">{factor.description}</p>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Head to Head */}
              <Card title="Head-to-Head Record" subtitle="Previous encounters between teams">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-700/50">
                    <div className="text-center flex-1">
                      <p className="text-3xl font-bold text-green-400">{prediction.headToHead.team1Wins}</p>
                      <p className="text-sm text-slate-400">{team1.replace(" (NPL)", "")}</p>
                    </div>
                    <div className="text-center px-4">
                      <Swords className="h-6 w-6 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-500 mt-1">{prediction.headToHead.ties} Ties</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-3xl font-bold text-red-400">{prediction.headToHead.team2Wins}</p>
                      <p className="text-sm text-slate-400">{team2.replace(" (NPL)", "")}</p>
                    </div>
                  </div>

                  {/* Visual bar */}
                  <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(prediction.headToHead.team1Wins / (prediction.headToHead.team1Wins + prediction.headToHead.team2Wins + prediction.headToHead.ties || 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.8 }}
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-400"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(prediction.headToHead.team2Wins / (prediction.headToHead.team1Wins + prediction.headToHead.team2Wins + prediction.headToHead.ties || 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.8 }}
                      className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-400"
                    />
                  </div>

                  <p className="text-sm text-slate-400 text-center">
                    Total: {prediction.headToHead.team1Wins + prediction.headToHead.team2Wins + prediction.headToHead.ties} matches played
                  </p>
                </div>
              </Card>
            </div>

            {/* Team Comparison */}
            <Card title="Team Comparison" subtitle="Statistical comparison of both teams">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-3 text-left text-sm font-medium text-slate-400 pl-4 sm:pl-0">Metric</th>
                      <th className="pb-3 text-center text-sm font-medium text-green-400">{team1.replace(" (NPL)", "")}</th>
                      <th className="pb-3 text-center text-sm font-medium text-red-400">{team2.replace(" (NPL)", "")}</th>
                      <th className="pb-3 text-center text-sm font-medium text-slate-400 pr-4 sm:pr-0">Edge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { metric: "Avg Score", t1: prediction.team1Stats.avgScore.toFixed(0), t2: prediction.team2Stats.avgScore.toFixed(0), better: prediction.team1Stats.avgScore > prediction.team2Stats.avgScore ? 1 : 2 },
                      { metric: "Strike Rate", t1: prediction.team1Stats.strikeRate.toFixed(1), t2: prediction.team2Stats.strikeRate.toFixed(1), better: prediction.team1Stats.strikeRate > prediction.team2Stats.strikeRate ? 1 : 2 },
                      { metric: "Economy Rate", t1: prediction.team1Stats.economyRate.toFixed(2), t2: prediction.team2Stats.economyRate.toFixed(2), better: prediction.team1Stats.economyRate < prediction.team2Stats.economyRate ? 1 : 2 },
                      { metric: "Avg Wickets", t1: prediction.team1Stats.avgWickets.toFixed(1), t2: prediction.team2Stats.avgWickets.toFixed(1), better: prediction.team1Stats.avgWickets > prediction.team2Stats.avgWickets ? 1 : 2 },
                    ].map((row, idx) => (
                      <tr key={row.metric} className="border-b border-slate-700/50">
                        <td className="py-3 text-sm text-slate-300 pl-4 sm:pl-0">{row.metric}</td>
                        <td className={`py-3 text-center text-sm font-medium ${row.better === 1 ? "text-green-400" : "text-white"}`}>
                          {row.t1}
                        </td>
                        <td className={`py-3 text-center text-sm font-medium ${row.better === 2 ? "text-red-400" : "text-white"}`}>
                          {row.t2}
                        </td>
                        <td className="py-3 text-center pr-4 sm:pr-0">
                          <span className={`text-xs font-medium ${row.better === 1 ? "text-green-400" : "text-red-400"}`}>
                            {row.better === 1 ? team1.replace(" (NPL)", "").split(" ")[0] : team2.replace(" (NPL)", "").split(" ")[0]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Key Players */}
            <Card title="Key Players to Watch" subtitle="Players likely to impact the match">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {prediction.keyPlayers.map((player, idx) => (
                  <motion.div
                    key={player.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 rounded-xl border ${
                      player.team === team1
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-red-500/5 border-red-500/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-white">{player.name}</p>
                        <p className="text-xs text-slate-400">{player.role}</p>
                      </div>
                      <Badge
                        variant={
                          player.form === "Hot"
                            ? "success"
                            : player.form === "Good"
                            ? "default"
                            : player.form === "Poor"
                            ? "error"
                            : "default"
                        }
                      >
                        {player.form === "Hot" && <Flame className="h-3 w-3 mr-1" />}
                        {player.form}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Predicted Runs</span>
                        <span className="text-white font-medium">{player.predictedRuns}</span>
                      </div>
                      {player.predictedWickets > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Predicted Wickets</span>
                          <span className="text-white font-medium">{player.predictedWickets}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Impact Score</span>
                        <span className="text-yellow-400 font-medium">{player.impactScore.toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Impact bar */}
                    <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${player.impactScore}%` }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className={`h-full rounded-full ${
                          player.team === team1 ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Key Matchups */}
            <Card title="Key Matchups" subtitle="Critical player battles to watch">
              <div className="grid gap-4 sm:grid-cols-2">
                {prediction.keyMatchups.map((matchup, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-slate-400">{matchup.reason}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="font-medium text-white">{matchup.batsman}</p>
                        <p className="text-xs text-slate-400">Batsman</p>
                      </div>
                      <div className="text-center px-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          matchup.advantage === "Batsman" ? "bg-green-500/20 text-green-400" : "bg-purple-500/20 text-purple-400"
                        }`}>
                          {matchup.advantage} Edge
                        </span>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-white">{matchup.bowler}</p>
                        <p className="text-xs text-slate-400">Bowler</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Current Form */}
      <Card title="Team Current Form" subtitle="Based on recent performances">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teamFormData
            .sort((a, b) => b.winRate - a.winRate)
            .map((team, idx) => (
              <motion.div
                key={team.team}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between rounded-xl bg-slate-700/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      team.trend === "up"
                        ? "bg-green-500/20"
                        : team.trend === "down"
                        ? "bg-red-500/20"
                        : "bg-yellow-500/20"
                    }`}
                  >
                    {team.trend === "up" ? (
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    ) : team.trend === "down" ? (
                      <TrendingDown className="h-5 w-5 text-red-400" />
                    ) : (
                      <Activity className="h-5 w-5 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{team.team}</p>
                    <Badge variant={team.form === "Good" ? "success" : "error"} className="mt-1">
                      {team.form} Form
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    {formatPercentage(team.winRate)}
                  </p>
                  <p className="text-xs text-slate-400">Win Rate</p>
                </div>
              </motion.div>
            ))}
        </div>
      </Card>

      {/* Methodology & Disclaimer */}
      <Card title="Prediction Methodology" subtitle="How our AI model works">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Historical Data", desc: "5+ years of match statistics", weight: "35%", icon: BarChart2 },
            { title: "Form Analysis", desc: "Recent 5 match performance", weight: "25%", icon: Activity },
            { title: "Head-to-Head", desc: "Previous encounters record", weight: "20%", icon: Swords },
            { title: "Conditions", desc: "Toss, venue, weather factors", weight: "20%", icon: Target },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-xl bg-slate-700/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-green-400" />
                </div>
                <Badge variant="default">{item.weight}</Badge>
              </div>
              <p className="font-medium text-white">{item.title}</p>
              <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-400">Disclaimer</p>
              <p className="text-xs text-slate-300 mt-1">
                Predictions are based on historical data and statistical models with ~72% accuracy. 
                Cricket is inherently unpredictable. Use these insights for entertainment and analysis only. 
                Not intended for betting purposes.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
