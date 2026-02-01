"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Zap,
  Shield,
  Award,
  Star,
  ChevronRight,
  Lightbulb,
  PieChart,
  Coins,
  Trophy,
} from "lucide-react";
import { Card, LoadingSpinner, Badge } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import {
  WinLossBarChart,
  PlayerRadarChart,
} from "@/components/charts";
import { loadMasterData, loadTeamPerformance, loadTossImpact } from "@/lib/data";
import { PlayerMatchData, TeamPerformance, TossImpact } from "@/lib/types";
import { formatPercentage } from "@/lib/utils";

export default function DiagnosticsPage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([]);
  const [tossImpact, setTossImpact] = useState<TossImpact[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"team" | "player">("team");

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

  // Get unique teams and players
  const teams = useMemo(() => [...new Set(masterData.map((d) => d.team))], [masterData]);
  const players = useMemo(() => {
    const playerSet = new Set<string>();
    masterData.forEach((d) => playerSet.add(d.player_name));
    return Array.from(playerSet).sort();
  }, [masterData]);

  // Calculate comprehensive team diagnostics with winning reasons
  const getTeamDiagnostics = useMemo(() => {
    return (teamName: string) => {
      const teamData = masterData.filter((d) => d.team === teamName);
      const teamMatches = [...new Set(teamData.map((d) => d.match_id_unique))];
      
      const wins = teamData.filter((d) => d.match_result === "Win");
      const losses = teamData.filter((d) => d.match_result === "Loss");
      const uniqueWins = [...new Set(wins.map((d) => d.match_id_unique))].length;
      const uniqueLosses = [...new Set(losses.map((d) => d.match_id_unique))].length;

      // Batting stats
      const totalRuns = teamData.reduce((sum, d) => sum + d.runs_scored, 0);
      const totalBallsFaced = teamData.reduce((sum, d) => sum + d.balls_faced, 0);
      const battingAvg = totalRuns / teamData.filter(d => d.runs_scored > 0).length || 0;
      const strikeRate = totalBallsFaced > 0 ? (totalRuns / totalBallsFaced) * 100 : 0;
      const totalFours = teamData.reduce((sum, d) => sum + d.fours, 0);
      const totalSixes = teamData.reduce((sum, d) => sum + d.sixes, 0);

      // Bowling stats
      const bowlers = teamData.filter((d) => d.wickets_taken > 0 || d.overs_bowled > 0);
      const totalWickets = teamData.reduce((sum, d) => sum + d.wickets_taken, 0);
      const avgEconomy = bowlers.length > 0 
        ? bowlers.reduce((sum, d) => sum + d.economy_rate, 0) / bowlers.length 
        : 0;

      // Toss stats
      const tossWins = teamData.filter((d) => d.toss_winner === teamName);
      const tossWinRate = (tossWins.length / teamData.length) * 100;
      const winsAfterTossWin = tossWins.filter((d) => d.match_result === "Win").length;

      // Win analysis - reasons why team wins
      const winningMatches = wins;
      const avgRunsInWins = winningMatches.reduce((sum, d) => sum + d.runs_scored, 0) / winningMatches.length || 0;
      const avgWicketsInWins = winningMatches.filter(d => d.wickets_taken > 0).reduce((sum, d) => sum + d.wickets_taken, 0) / winningMatches.filter(d => d.wickets_taken > 0).length || 0;

      // Top performers
      const topScorer = teamData.reduce((best, d) => d.runs_scored > best.runs_scored ? d : best, teamData[0]);
      const topWicketTaker = teamData.reduce((best, d) => d.wickets_taken > best.wickets_taken ? d : best, teamData[0]);

      // Calculate winning reasons
      const winningReasons: { reason: string; impact: string; icon: string; score: number }[] = [];

      const winRate = (uniqueWins / teamMatches.length) * 100;
      
      // Strong win rate
      if (winRate > 55) {
        winningReasons.push({
          reason: "Strong Win Rate",
          impact: `${winRate.toFixed(1)}% win rate (${uniqueWins}W/${uniqueLosses}L) shows consistent performance`,
          icon: "trophy",
          score: Math.min(100, winRate),
        });
      }

      if (battingAvg > 20) {
        winningReasons.push({
          reason: "Strong Batting Average",
          impact: `${battingAvg.toFixed(1)} runs per batsman is above league average`,
          icon: "bat",
          score: Math.min(100, battingAvg * 4),
        });
      }

      if (strikeRate > 118) {
        winningReasons.push({
          reason: "High Strike Rate",
          impact: `Strike rate of ${strikeRate.toFixed(1)} shows aggressive batting`,
          icon: "zap",
          score: Math.min(100, (strikeRate / 130) * 100),
        });
      }

      if (avgEconomy < 8) {
        winningReasons.push({
          reason: "Economical Bowling",
          impact: `Economy of ${avgEconomy.toFixed(2)} restricts opponent scoring`,
          icon: "shield",
          score: Math.min(100, (10 - avgEconomy) * 15),
        });
      }

      if (totalWickets > 100) {
        winningReasons.push({
          reason: "Wicket-Taking Ability",
          impact: `${totalWickets} wickets shows strong bowling attack`,
          icon: "target",
          score: Math.min(100, (totalWickets / 150) * 100),
        });
      }

      if (totalSixes > 90) {
        winningReasons.push({
          reason: "Power Hitting",
          impact: `${totalSixes} sixes demonstrates big-hitting capability`,
          icon: "power",
          score: Math.min(100, (totalSixes / 130) * 100),
        });
      }

      // Calculate toss win percentage
      const tossWinMatches = [...new Set(tossWins.map(d => d.match_id_unique))].length;
      const matchWinsAfterToss = [...new Set(tossWins.filter(d => d.match_result === "Win").map(d => d.match_id_unique))].length;
      const tossConversionRate = tossWinMatches > 0 ? (matchWinsAfterToss / tossWinMatches) * 100 : 0;
      
      // Show toss utilization if team has won tosses and converted well
      if (tossWinMatches > 0 && tossConversionRate >= 45) {
        winningReasons.push({
          reason: "Toss Advantage Utilization",
          impact: `Won ${matchWinsAfterToss} of ${tossWinMatches} matches after winning toss (${tossConversionRate.toFixed(0)}% conversion)`,
          icon: "coin",
          score: Math.min(100, tossConversionRate),
        });
      }
      
      // Show toss independence for teams that win despite not winning many tosses
      const tossLossMatches = teamMatches.length - tossWinMatches;
      const winsAfterTossLoss = uniqueWins - matchWinsAfterToss;
      const tossIndependenceRate = tossLossMatches > 0 ? (winsAfterTossLoss / tossLossMatches) * 100 : 0;
      if (tossLossMatches > 3 && tossIndependenceRate > 60) {
        winningReasons.push({
          reason: "Toss Independence",
          impact: `Won ${winsAfterTossLoss} of ${tossLossMatches} matches even after losing toss (${tossIndependenceRate.toFixed(0)}% win rate)`,
          icon: "coin",
          score: Math.min(100, tossIndependenceRate),
        });
      }

      // Calculate losing reasons - why team loses
      const losingReasons: { reason: string; impact: string; icon: string; score: number }[] = [];

      // Loss analysis stats
      const avgRunsInLosses = losses.reduce((sum, d) => sum + d.runs_scored, 0) / losses.length || 0;
      const avgWicketsInLosses = losses.filter(d => d.wickets_taken > 0).reduce((sum, d) => sum + d.wickets_taken, 0) / losses.filter(d => d.wickets_taken > 0).length || 0;
      const lossStrikeRate = losses.reduce((sum, d) => sum + d.balls_faced, 0) > 0 
        ? (losses.reduce((sum, d) => sum + d.runs_scored, 0) / losses.reduce((sum, d) => sum + d.balls_faced, 0)) * 100 
        : 0;
      const lossEconomy = losses.filter(d => d.overs_bowled > 0).length > 0
        ? losses.filter(d => d.overs_bowled > 0).reduce((sum, d) => sum + d.economy_rate, 0) / losses.filter(d => d.overs_bowled > 0).length
        : 0;

      if (battingAvg < 18) {
        losingReasons.push({
          reason: "Low Batting Average",
          impact: `${battingAvg.toFixed(1)} runs per batsman is below league average`,
          icon: "bat",
          score: Math.min(100, (20 - battingAvg) * 8),
        });
      }

      if (strikeRate < 112) {
        losingReasons.push({
          reason: "Slow Scoring Rate",
          impact: `Strike rate of ${strikeRate.toFixed(1)} indicates lack of aggressive batting`,
          icon: "zap",
          score: Math.min(100, (120 - strikeRate) * 1.5),
        });
      }

      if (avgEconomy > 8.5) {
        losingReasons.push({
          reason: "Expensive Bowling",
          impact: `Economy of ${avgEconomy.toFixed(2)} allows opponents to score freely`,
          icon: "shield",
          score: Math.min(100, (avgEconomy - 6) * 20),
        });
      }

      if (totalWickets < 90) {
        losingReasons.push({
          reason: "Weak Wicket-Taking",
          impact: `Only ${totalWickets} wickets shows inability to break partnerships`,
          icon: "target",
          score: Math.min(100, (100 - totalWickets) * 1.5),
        });
      }

      if (uniqueLosses > uniqueWins) {
        losingReasons.push({
          reason: "Negative Win-Loss Ratio",
          impact: `${uniqueLosses} losses vs ${uniqueWins} wins shows inconsistency`,
          icon: "trend",
          score: Math.min(100, ((uniqueLosses - uniqueWins) / teamMatches.length) * 150),
        });
      }

      const tossLossMatchData = teamData.filter((d) => d.toss_winner !== teamName);
      const uniqueTossLossMatchCount = [...new Set(tossLossMatchData.map(d => d.match_id_unique))].length;
      const matchLossesAfterTossLoss = [...new Set(tossLossMatchData.filter(d => d.match_result === "Loss").map(d => d.match_id_unique))].length;
      const tossLossRate = uniqueTossLossMatchCount > 0 ? (matchLossesAfterTossLoss / uniqueTossLossMatchCount) * 100 : 0;
      
      // Show poor toss recovery if loss rate is above 50%
      if (uniqueTossLossMatchCount > 0 && tossLossRate >= 50) {
        losingReasons.push({
          reason: "Poor Toss Recovery",
          impact: `Lost ${matchLossesAfterTossLoss} of ${uniqueTossLossMatchCount} matches after losing toss (${tossLossRate.toFixed(0)}% loss rate)`,
          icon: "coin",
          score: Math.min(100, tossLossRate),
        });
      }

      if (avgRunsInLosses < avgRunsInWins * 0.7) {
        losingReasons.push({
          reason: "Collapse in Losing Games",
          impact: `Avg ${avgRunsInLosses.toFixed(1)} runs in losses vs ${avgRunsInWins.toFixed(1)} in wins`,
          icon: "collapse",
          score: Math.min(100, ((avgRunsInWins - avgRunsInLosses) / avgRunsInWins) * 100),
        });
      }

      if (totalSixes < 85) {
        losingReasons.push({
          reason: "Lack of Power Hitting",
          impact: `Only ${totalSixes} sixes shows inability to accelerate`,
          icon: "power",
          score: Math.min(100, (90 - totalSixes) * 2),
        });
      }

      return {
        teamMatches: teamMatches.length,
        wins: uniqueWins,
        losses: uniqueLosses,
        winRate: (uniqueWins / teamMatches.length) * 100,
        battingAvg,
        strikeRate,
        totalRuns,
        totalFours,
        totalSixes,
        totalWickets,
        avgEconomy,
        tossWinRate,
        winsAfterTossWin,
        topScorer,
        topWicketTaker,
        winningReasons,
        losingReasons,
        avgRunsInWins,
        avgRunsInLosses,
        avgWicketsInWins,
      };
    };
  }, [masterData]);

  // Calculate comprehensive player diagnostics
  const getPlayerDiagnostics = useMemo(() => {
    return (playerName: string) => {
      const playerData = masterData.filter((d) => d.player_name === playerName);
      if (playerData.length === 0) return null;

      const matchesPlayed = [...new Set(playerData.map((d) => d.match_id_unique))].length;
      const team = playerData[0].team;
      const role = playerData[0].player_role;

      // Batting stats
      const totalRuns = playerData.reduce((sum, d) => sum + d.runs_scored, 0);
      const totalBallsFaced = playerData.reduce((sum, d) => sum + d.balls_faced, 0);
      const strikeRate = totalBallsFaced > 0 ? (totalRuns / totalBallsFaced) * 100 : 0;
      const battingAvg = totalRuns / playerData.filter(d => d.out_status === "Yes").length || totalRuns;
      const fours = playerData.reduce((sum, d) => sum + d.fours, 0);
      const sixes = playerData.reduce((sum, d) => sum + d.sixes, 0);
      const highestScore = Math.max(...playerData.map((d) => d.runs_scored));
      const fifties = playerData.filter((d) => d.runs_scored >= 50 && d.runs_scored < 100).length;
      const hundreds = playerData.filter((d) => d.runs_scored >= 100).length;

      // Bowling stats
      const totalWickets = playerData.reduce((sum, d) => sum + d.wickets_taken, 0);
      const totalOversBowled = playerData.reduce((sum, d) => sum + d.overs_bowled, 0);
      const runsConceded = playerData.reduce((sum, d) => sum + d.runs_conceded, 0);
      const economy = totalOversBowled > 0 ? runsConceded / totalOversBowled : 0;
      const bowlingAvg = totalWickets > 0 ? runsConceded / totalWickets : 0;
      const bestBowling = playerData.reduce((best, d) => d.wickets_taken > best.wickets_taken ? d : best, playerData[0]);

      // Fielding
      const catches = playerData.reduce((sum, d) => sum + d.catches, 0);
      const runOuts = playerData.reduce((sum, d) => sum + d.run_outs, 0);

      // Performance in wins vs losses
      const winMatches = playerData.filter((d) => d.match_result === "Win");
      const lossMatches = playerData.filter((d) => d.match_result === "Loss");
      const runsInWins = winMatches.reduce((sum, d) => sum + d.runs_scored, 0);
      const runsInLosses = lossMatches.reduce((sum, d) => sum + d.runs_scored, 0);
      const avgInWins = runsInWins / winMatches.length || 0;
      const avgInLosses = runsInLosses / lossMatches.length || 0;

      // Calculate performance reasons
      const performanceReasons: { reason: string; detail: string; type: "strength" | "weakness" | "neutral" }[] = [];

      // Batting analysis
      if (totalRuns > 200) {
        performanceReasons.push({
          reason: "Consistent Run Scorer",
          detail: `Scored ${totalRuns} runs across ${matchesPlayed} matches showing reliability`,
          type: "strength",
        });
      }

      if (strikeRate > 130) {
        performanceReasons.push({
          reason: "Aggressive Batting Style",
          detail: `Strike rate of ${strikeRate.toFixed(1)} indicates quick scoring ability`,
          type: "strength",
        });
      } else if (strikeRate < 100 && totalRuns > 100) {
        performanceReasons.push({
          reason: "Conservative Approach",
          detail: `Strike rate of ${strikeRate.toFixed(1)} - could improve scoring rate`,
          type: "weakness",
        });
      }

      if (sixes > 10) {
        performanceReasons.push({
          reason: "Power Hitter",
          detail: `${sixes} sixes show ability to clear boundaries consistently`,
          type: "strength",
        });
      }

      if (avgInWins > avgInLosses * 1.5 && avgInWins > 20) {
        performanceReasons.push({
          reason: "Match Winner",
          detail: `Averages ${avgInWins.toFixed(1)} in wins vs ${avgInLosses.toFixed(1)} in losses`,
          type: "strength",
        });
      }

      // Bowling analysis
      if (totalWickets > 10) {
        performanceReasons.push({
          reason: "Wicket-Taking Bowler",
          detail: `${totalWickets} wickets at economy ${economy.toFixed(2)} is valuable`,
          type: "strength",
        });
      }

      if (economy > 0 && economy < 7) {
        performanceReasons.push({
          reason: "Economical Bowler",
          detail: `Economy of ${economy.toFixed(2)} helps restrict opposition`,
          type: "strength",
        });
      } else if (economy > 9 && totalOversBowled > 10) {
        performanceReasons.push({
          reason: "Expensive Bowling",
          detail: `Economy of ${economy.toFixed(2)} gives away too many runs`,
          type: "weakness",
        });
      }

      // Fielding
      if (catches > 5) {
        performanceReasons.push({
          reason: "Safe Fielder",
          detail: `${catches} catches shows reliable fielding skills`,
          type: "strength",
        });
      }

      // Consistency
      const goodScores = playerData.filter((d) => d.runs_scored >= 20).length;
      const consistencyRate = (goodScores / matchesPlayed) * 100;
      if (consistencyRate > 50) {
        performanceReasons.push({
          reason: "Consistent Performer",
          detail: `Scores 20+ runs in ${consistencyRate.toFixed(0)}% of matches`,
          type: "strength",
        });
      }

      // Calculate overall rating
      let overallRating = 0;
      if (totalRuns > 0) overallRating += Math.min(35, (totalRuns / 500) * 35);
      if (strikeRate > 0) overallRating += Math.min(20, (strikeRate / 150) * 20);
      if (totalWickets > 0) overallRating += Math.min(25, (totalWickets / 20) * 25);
      if (economy > 0 && economy < 10) overallRating += Math.min(10, ((10 - economy) / 10) * 10);
      if (catches > 0) overallRating += Math.min(10, catches);

      return {
        playerName,
        team,
        role,
        matchesPlayed,
        totalRuns,
        totalBallsFaced,
        strikeRate,
        battingAvg,
        fours,
        sixes,
        highestScore,
        fifties,
        hundreds,
        totalWickets,
        totalOversBowled,
        economy,
        bowlingAvg,
        bestBowling,
        catches,
        runOuts,
        avgInWins,
        avgInLosses,
        performanceReasons,
        overallRating: Math.min(100, overallRating),
      };
    };
  }, [masterData]);

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

    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Team Performance Analysis", 20, 55);

    pdf.setFontSize(10);
    let yPos = 65;

    teamPerformance.sort((a, b) => b.win_rate - a.win_rate).forEach((team) => {
      const diagnostics = getTeamDiagnostics(team.team);
      pdf.text(
        `${team.team.replace(" (NPL)", "")}: ${formatPercentage(team.win_rate)} win rate`,
        25,
        yPos
      );
      yPos += 5;
      if (diagnostics.winningReasons.length > 0) {
        pdf.setTextColor(100, 100, 100);
        pdf.text(`  Key strength: ${diagnostics.winningReasons[0]?.reason || "N/A"}`, 25, yPos);
        pdf.setTextColor(0, 0, 0);
      }
      yPos += 8;
    });

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

  const selectedTeamData = selectedTeam ? getTeamDiagnostics(selectedTeam) : null;
  const selectedPlayerData = selectedPlayer ? getPlayerDiagnostics(selectedPlayer) : null;

  // Toss chart data
  const tossChartData = tossImpact.map((t) => ({
    name: `Toss ${t.toss_status}`,
    wins: t.wins,
    losses: t.losses,
    ties: t.ties,
  }));

  // Team performance radar data
  const teamRadarData = selectedTeamData ? [
    { subject: "Batting", player1: Math.min(100, selectedTeamData.battingAvg * 4), fullMark: 100 },
    { subject: "Strike Rate", player1: Math.min(100, selectedTeamData.strikeRate * 0.7), fullMark: 100 },
    { subject: "Wickets", player1: Math.min(100, selectedTeamData.totalWickets * 1.5), fullMark: 100 },
    { subject: "Economy", player1: Math.min(100, (12 - selectedTeamData.avgEconomy) * 10), fullMark: 100 },
    { subject: "Power", player1: Math.min(100, selectedTeamData.totalSixes * 2), fullMark: 100 },
  ] : [];

  // Player radar data
  const playerRadarData = selectedPlayerData ? [
    { subject: "Runs", player1: Math.min(100, (selectedPlayerData.totalRuns / 500) * 100), fullMark: 100 },
    { subject: "Strike Rate", player1: Math.min(100, selectedPlayerData.strikeRate * 0.6), fullMark: 100 },
    { subject: "Wickets", player1: Math.min(100, selectedPlayerData.totalWickets * 5), fullMark: 100 },
    { subject: "Economy", player1: selectedPlayerData.economy > 0 ? Math.min(100, (12 - selectedPlayerData.economy) * 10) : 50, fullMark: 100 },
    { subject: "Fielding", player1: Math.min(100, (selectedPlayerData.catches + selectedPlayerData.runOuts) * 10), fullMark: 100 },
  ] : [];

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
            <Search className="h-7 w-7 sm:h-8 sm:w-8 text-orange-400" />
            Diagnostic Analytics
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-400">
            Why did it happen? • Root cause analysis and performance factors
          </p>
        </div>
        <button
          onClick={downloadReport}
          className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 transition-all hover:scale-105"
        >
          <Download className="h-4 w-4" />
          Download Report
        </button>
      </motion.div>

      {/* Tab Selector */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "team"
              ? "bg-orange-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Team Analysis
        </button>
        <button
          onClick={() => setActiveTab("player")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "player"
              ? "bg-orange-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-700"
          }`}
        >
          <Target className="h-4 w-4 inline mr-2" />
          Player Analysis
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "team" ? (
          <motion.div
            key="team"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Team Selector */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full sm:w-auto">
                  <Select
                    label="Select Team to Analyze"
                    value={selectedTeam}
                    onChange={setSelectedTeam}
                    options={[
                      { value: "", label: "Choose a team..." },
                      ...teams.map((t) => ({ value: t, label: t.replace(" (NPL)", "") })),
                    ]}
                    searchable
                    searchPlaceholder="Search teams..."
                  />
                </div>
                {selectedTeam && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Badge variant={selectedTeamData && selectedTeamData.winRate >= 50 ? "success" : "error"}>
                      {selectedTeamData ? formatPercentage(selectedTeamData.winRate) : "0%"} Win Rate
                    </Badge>
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Toss Impact Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card title="Toss Impact Analysis" subtitle="How toss affects match outcomes">
                <WinLossBarChart data={tossChartData} showTies />
              </Card>

              <Card title="Toss Decision Breakdown">
                <div className="space-y-4">
                  {tossImpact.map((item, idx) => (
                    <motion.div
                      key={item.toss_status}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-4 border border-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        {item.toss_status === "Won" ? (
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-red-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">Toss {item.toss_status}</p>
                          <p className="text-xs text-slate-400">{item.total_matches} matches</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">{formatPercentage(item.win_rate)}</p>
                        <p className="text-xs text-slate-400">Win Rate</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="mt-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-400">Key Insight</p>
                        <p className="text-xs text-slate-300 mt-1">
                          Winning the toss provides a {((tossImpact.find(t => t.toss_status === "Won")?.win_rate || 50) - 50).toFixed(1)}% advantage. 
                          Teams should strategize based on conditions when winning toss.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Team Diagnostic Details */}
            {selectedTeam && selectedTeamData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: "Total Runs", value: selectedTeamData.totalRuns.toLocaleString(), icon: Target, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Strike Rate", value: selectedTeamData.strikeRate.toFixed(1), icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/10" },
                    { label: "Wickets Taken", value: selectedTeamData.totalWickets, icon: Shield, color: "text-purple-400", bg: "bg-purple-500/10" },
                    { label: "Economy Rate", value: selectedTeamData.avgEconomy.toFixed(2), icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
                  ].map((stat, idx) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                          </div>
                          <div>
                            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-slate-400">{stat.label}</p>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Why Team Wins Section */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card 
                    title={`Why ${selectedTeam.replace(" (NPL)", "")} Wins`} 
                    subtitle="Key winning factors identified"
                  >
                    <div className="space-y-3">
                      {selectedTeamData.winningReasons.length > 0 ? (
                        selectedTeamData.winningReasons.map((reason, idx) => (
                          <motion.div
                            key={reason.reason}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20"
                          >
                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                              {reason.icon === "trophy" && <Trophy className="h-4 w-4 text-green-400" />}
                              {reason.icon === "bat" && <Target className="h-4 w-4 text-green-400" />}
                              {reason.icon === "zap" && <Zap className="h-4 w-4 text-green-400" />}
                              {reason.icon === "shield" && <Shield className="h-4 w-4 text-green-400" />}
                              {reason.icon === "target" && <Target className="h-4 w-4 text-green-400" />}
                              {reason.icon === "power" && <TrendingUp className="h-4 w-4 text-green-400" />}
                              {reason.icon === "coin" && <Coins className="h-4 w-4 text-green-400" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-green-400">{reason.reason}</p>
                                <span className="text-xs text-slate-400">{reason.score.toFixed(0)}%</span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1">{reason.impact}</p>
                              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${reason.score}%` }}
                                  transition={{ delay: 0.5, duration: 0.8 }}
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No significant winning factors identified</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card title="Performance Radar" subtitle="Overall team strength visualization">
                    {teamRadarData.length > 0 && (
                      <PlayerRadarChart
                        data={teamRadarData}
                        player1Name={selectedTeam.replace(" (NPL)", "")}
                      />
                    )}
                  </Card>
                </div>

                {/* Why Team Loses Section */}
                <Card 
                  title={`Why ${selectedTeam.replace(" (NPL)", "")} Loses`} 
                  subtitle="Key factors contributing to losses"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedTeamData.losingReasons && selectedTeamData.losingReasons.length > 0 ? (
                      selectedTeamData.losingReasons.map((reason, idx) => (
                        <motion.div
                          key={reason.reason}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/5 border border-red-500/20"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                            {reason.icon === "bat" && <Target className="h-4 w-4 text-red-400" />}
                            {reason.icon === "zap" && <Zap className="h-4 w-4 text-red-400" />}
                            {reason.icon === "shield" && <Shield className="h-4 w-4 text-red-400" />}
                            {reason.icon === "target" && <Target className="h-4 w-4 text-red-400" />}
                            {reason.icon === "power" && <TrendingDown className="h-4 w-4 text-red-400" />}
                            {reason.icon === "coin" && <Coins className="h-4 w-4 text-red-400" />}
                            {reason.icon === "trend" && <TrendingDown className="h-4 w-4 text-red-400" />}
                            {reason.icon === "collapse" && <AlertTriangle className="h-4 w-4 text-red-400" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-red-400">{reason.reason}</p>
                              <span className="text-xs text-slate-400">{reason.score.toFixed(0)}%</span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1">{reason.impact}</p>
                            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${reason.score}%` }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-slate-400">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
                        <p className="text-sm">No significant losing factors identified</p>
                        <p className="text-xs text-slate-500 mt-1">Team is performing well across all metrics</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Top Performers */}
                <Card title="Top Performers" subtitle="Key players driving team success">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Award className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Top Scorer</p>
                          <p className="font-semibold text-white">{selectedTeamData.topScorer?.player_name || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-emerald-400">{selectedTeamData.topScorer?.runs_scored || 0} runs</span>
                        <span className="text-slate-400">SR: {selectedTeamData.topScorer?.strike_rate?.toFixed(1) || 0}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Top Wicket Taker</p>
                          <p className="font-semibold text-white">{selectedTeamData.topWicketTaker?.player_name || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-purple-400">{selectedTeamData.topWicketTaker?.wickets_taken || 0} wickets</span>
                        <span className="text-slate-400">Econ: {selectedTeamData.topWicketTaker?.economy_rate?.toFixed(2) || 0}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Team Comparison Table */}
            <Card title="Team Performance Comparison" subtitle="Comprehensive analysis across all teams">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="pb-3 text-left text-xs font-medium text-slate-400 pl-4 sm:pl-0">Team</th>
                      <th className="pb-3 text-center text-xs font-medium text-slate-400">W-L</th>
                      <th className="pb-3 text-center text-xs font-medium text-slate-400">Win Rate</th>
                      <th className="pb-3 text-center text-xs font-medium text-slate-400">Avg Runs</th>
                      <th className="pb-3 text-center text-xs font-medium text-slate-400">Wickets</th>
                      <th className="pb-3 text-center text-xs font-medium text-slate-400 pr-4 sm:pr-0">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamPerformance
                      .sort((a, b) => b.win_rate - a.win_rate)
                      .map((team, idx) => {
                        const teamDiag = getTeamDiagnostics(team.team);
                        return (
                          <motion.tr
                            key={team.team}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors cursor-pointer"
                            onClick={() => setSelectedTeam(team.team)}
                          >
                            <td className="py-3 text-sm font-medium text-white pl-4 sm:pl-0">
                              <div className="flex items-center gap-2">
                                {idx < 3 && (
                                  <Star className={`h-4 w-4 ${idx === 0 ? "text-yellow-400" : idx === 1 ? "text-slate-300" : "text-amber-600"}`} />
                                )}
                                {team.team.replace(" (NPL)", "")}
                              </div>
                            </td>
                            <td className="py-3 text-center text-sm">
                              <span className="text-green-400">{team.wins}</span>
                              <span className="text-slate-500 mx-1">-</span>
                              <span className="text-red-400">{team.losses}</span>
                            </td>
                            <td className="py-3 text-center text-sm text-white font-medium">
                              {formatPercentage(team.win_rate)}
                            </td>
                            <td className="py-3 text-center text-sm text-slate-300">
                              {teamDiag.battingAvg.toFixed(1)}
                            </td>
                            <td className="py-3 text-center text-sm text-slate-300">
                              {teamDiag.totalWickets}
                            </td>
                            <td className="py-3 text-center pr-4 sm:pr-0">
                              <Badge
                                variant={team.win_rate >= 50 ? "success" : team.win_rate >= 40 ? "default" : "error"}
                              >
                                {team.win_rate >= 50 ? "Strong" : team.win_rate >= 40 ? "Average" : "Weak"}
                              </Badge>
                            </td>
                          </motion.tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="player"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Player Selector */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full sm:w-auto sm:min-w-[300px]">
                  <Select
                    label="Select Player to Analyze"
                    value={selectedPlayer}
                    onChange={setSelectedPlayer}
                    options={[
                      { value: "", label: "Choose a player..." },
                      ...players.map((p) => ({ value: p, label: p })),
                    ]}
                    searchable
                    searchPlaceholder="Search players..."
                  />
                </div>
                {selectedPlayer && selectedPlayerData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <Badge variant="default">{selectedPlayerData.role}</Badge>
                    <Badge variant="success">{selectedPlayerData.overallRating.toFixed(0)}% Rating</Badge>
                  </motion.div>
                )}
              </div>
            </Card>

            {/* Player Analysis */}
            {selectedPlayer && selectedPlayerData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Player Stats Grid */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                  {[
                    { label: "Matches", value: selectedPlayerData.matchesPlayed, color: "text-white" },
                    { label: "Runs", value: selectedPlayerData.totalRuns, color: "text-emerald-400" },
                    { label: "Strike Rate", value: selectedPlayerData.strikeRate.toFixed(1), color: "text-yellow-400" },
                    { label: "Wickets", value: selectedPlayerData.totalWickets, color: "text-purple-400" },
                    { label: "Catches", value: selectedPlayerData.catches, color: "text-blue-400" },
                  ].map((stat, idx) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 text-center"
                    >
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Performance Reasons */}
                  <Card
                    title="Why This Player Performs"
                    subtitle="Strengths and areas for improvement"
                  >
                    <div className="space-y-3">
                      {selectedPlayerData.performanceReasons.map((reason, idx) => (
                        <motion.div
                          key={reason.reason}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`flex items-start gap-3 p-3 rounded-xl border ${
                            reason.type === "strength"
                              ? "bg-green-500/10 border-green-500/20"
                              : reason.type === "weakness"
                              ? "bg-red-500/10 border-red-500/20"
                              : "bg-slate-700/50 border-slate-600/50"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            reason.type === "strength" ? "bg-green-500/20" : reason.type === "weakness" ? "bg-red-500/20" : "bg-slate-600/50"
                          }`}>
                            {reason.type === "strength" ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : reason.type === "weakness" ? (
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                            ) : (
                              <Activity className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${
                              reason.type === "strength" ? "text-green-400" : reason.type === "weakness" ? "text-red-400" : "text-slate-300"
                            }`}>
                              {reason.reason}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">{reason.detail}</p>
                          </div>
                        </motion.div>
                      ))}

                      {selectedPlayerData.performanceReasons.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Insufficient data for detailed analysis</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Player Radar */}
                  <Card title="Skill Radar" subtitle="Overall ability visualization">
                    <PlayerRadarChart
                      data={playerRadarData}
                      player1Name={selectedPlayer}
                    />
                  </Card>
                </div>

                {/* Detailed Stats */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Batting Card */}
                  <Card title="Batting Analysis">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-700/50">
                        <p className="text-xs text-slate-400">Highest Score</p>
                        <p className="text-xl font-bold text-white">{selectedPlayerData.highestScore}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-700/50">
                        <p className="text-xs text-slate-400">Batting Average</p>
                        <p className="text-xl font-bold text-white">{selectedPlayerData.battingAvg.toFixed(1)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-700/50">
                        <p className="text-xs text-slate-400">Fours / Sixes</p>
                        <p className="text-xl font-bold text-white">{selectedPlayerData.fours} / {selectedPlayerData.sixes}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-700/50">
                        <p className="text-xs text-slate-400">50s / 100s</p>
                        <p className="text-xl font-bold text-white">{selectedPlayerData.fifties} / {selectedPlayerData.hundreds}</p>
                      </div>
                    </div>

                    {/* Win vs Loss Performance */}
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 via-slate-800/50 to-red-500/10">
                      <p className="text-xs text-slate-400 mb-2">Performance Comparison</p>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-400">{selectedPlayerData.avgInWins.toFixed(1)}</p>
                          <p className="text-xs text-slate-400">Avg in Wins</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-500" />
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-400">{selectedPlayerData.avgInLosses.toFixed(1)}</p>
                          <p className="text-xs text-slate-400">Avg in Losses</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Bowling Card */}
                  <Card title="Bowling Analysis">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-700/50">
                        <p className="text-xs text-slate-400">Wickets</p>
                        <p className="text-xl font-bold text-purple-400">{selectedPlayerData.totalWickets}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-700/50">
                        <p className="text-xs text-slate-400">Economy</p>
                        <p className="text-xl font-bold text-white">{selectedPlayerData.economy.toFixed(2)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-700/50">
                        <p className="text-xs text-slate-400">Bowling Average</p>
                        <p className="text-xl font-bold text-white">
                          {selectedPlayerData.bowlingAvg > 0 ? selectedPlayerData.bowlingAvg.toFixed(1) : "-"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-700/50">
                        <p className="text-xs text-slate-400">Best Bowling</p>
                        <p className="text-xl font-bold text-white">{selectedPlayerData.bestBowling?.wickets_taken || 0} wickets</p>
                      </div>
                    </div>

                    {/* Fielding Stats */}
                    <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-slate-400 mb-2">Fielding Contribution</p>
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-lg font-bold text-blue-400">{selectedPlayerData.catches}</p>
                          <p className="text-xs text-slate-400">Catches</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-blue-400">{selectedPlayerData.runOuts}</p>
                          <p className="text-xs text-slate-400">Run Outs</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Player Prompt */}
            {!selectedPlayer && (
              <Card className="p-12">
                <div className="text-center">
                  <Target className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Player</h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Choose a player from the dropdown above to view detailed performance analysis, 
                    strengths, weaknesses, and career statistics.
                  </p>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
