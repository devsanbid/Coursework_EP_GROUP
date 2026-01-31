"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Users,
  Download,
  RefreshCw,
  Play,
  Pause,
  Settings,
  ChevronDown,
  TrendingUp,
  Shield,
  Zap,
  Eye,
} from "lucide-react";
import { Card, LoadingSpinner } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import { InteractiveCricketField, ShotData, FielderPosition } from "@/components/cricket-field/interactive-field";
import { loadMasterData } from "@/lib/data";
import { PlayerMatchData } from "@/lib/types";
import Papa from "papaparse";

interface BatsmanShotData {
  id: string;
  batsman_name: string;
  team: string;
  zone: string;
  runs: number;
  shot_type: string;
  angle: number;
  distance: number;
  match_id: string;
  season: number;
  bowler: string;
  over: number;
  ball: number;
}

// Default fielder positions
const defaultFielders: FielderPosition[] = [
  { id: "f1", name: "Slip", x: 320, y: 160, zone: "slip" },
  { id: "f2", name: "Point", x: 420, y: 240, zone: "point" },
  { id: "f3", name: "Cover", x: 430, y: 320, zone: "cover" },
  { id: "f4", name: "Mid Off", x: 360, y: 420, zone: "mid_off" },
  { id: "f5", name: "Mid On", x: 140, y: 420, zone: "mid_on" },
  { id: "f6", name: "Mid Wicket", x: 70, y: 350, zone: "mid_wicket" },
  { id: "f7", name: "Square Leg", x: 60, y: 280, zone: "square_leg" },
  { id: "f8", name: "Fine Leg", x: 100, y: 160, zone: "fine_leg" },
  { id: "f9", name: "WK", x: 250, y: 320, zone: "behind_wicket" },
];

export default function ShotAnalyzerPage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [shotData, setShotData] = useState<BatsmanShotData[]>([]);
  const [selectedBatsman, setSelectedBatsman] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [fielders, setFielders] = useState<FielderPosition[]>(defaultFielders);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFielderEditor, setShowFielderEditor] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<"shots" | "dismissals" | "boundaries">("shots");
  const reportRef = useRef<HTMLDivElement>(null);

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [master, shotsResponse] = await Promise.all([
          loadMasterData(),
          fetch("/data/batsman_shots.csv").then((r) => r.text()),
        ]);

        setMasterData(master);

        // Parse shot data
        Papa.parse(shotsResponse, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            setShotData(results.data as BatsmanShotData[]);
          },
        });
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Get unique batsmen
  const batsmen = [...new Set(shotData.map((s) => s.batsman_name))].sort();

  // Calculate top 3 batsmen by runs
  const topBatsmen = batsmen
    .map((name) => {
      const playerShots = shotData.filter((s) => s.batsman_name === name);
      const runs = playerShots.reduce((sum, s) => sum + s.runs, 0);
      const fours = playerShots.filter((s) => s.shot_type === "four").length;
      const sixes = playerShots.filter((s) => s.shot_type === "six").length;
      const shots = playerShots.length;
      return { name, runs, fours, sixes, shots };
    })
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 3);

  // Filter shots by selected batsman
  const filteredShots: ShotData[] = shotData
    .filter((s) => !selectedBatsman || s.batsman_name === selectedBatsman)
    .filter((s) => !selectedZone || s.zone === selectedZone)
    .map((s) => ({
      id: s.id,
      batsmanName: s.batsman_name,
      zone: s.zone,
      runs: s.runs,
      shotType: s.shot_type as ShotData["shotType"],
      angle: s.angle,
      distance: s.distance,
      matchId: s.match_id,
    }));

  // Calculate statistics
  // Calculate actual balls faced from master data for accurate strike rate
  const getPlayerBallsFaced = (batsmanName: string) => {
    const playerMatches = masterData.filter(
      (m) => m.player_name === batsmanName && m.balls_faced > 0
    );
    return playerMatches.reduce((sum, m) => sum + m.balls_faced, 0);
  };

  const getTotalBallsFaced = () => {
    if (selectedBatsman) {
      return getPlayerBallsFaced(selectedBatsman);
    }
    // For all batsmen, sum up unique player balls
    const uniqueBatsmen = new Set(filteredShots.map(s => s.batsmanName));
    return Array.from(uniqueBatsmen).reduce((sum, name) => sum + getPlayerBallsFaced(name), 0);
  };

  const ballsFaced = getTotalBallsFaced();
  
  const stats = {
    totalShots: filteredShots.length,
    totalRuns: filteredShots.reduce((sum, s) => sum + s.runs, 0),
    fours: filteredShots.filter((s) => s.shotType === "four").length,
    sixes: filteredShots.filter((s) => s.shotType === "six").length,
    dismissals: filteredShots.filter((s) => s.shotType === "out").length,
    ballsFaced: ballsFaced,
    strikeRate: ballsFaced > 0 
      ? ((filteredShots.reduce((sum, s) => sum + s.runs, 0) / ballsFaced) * 100).toFixed(1)
      : "N/A",
  };

  // Zone-wise statistics
  const zoneStats = filteredShots.reduce((acc, shot) => {
    if (!acc[shot.zone]) {
      acc[shot.zone] = { runs: 0, shots: 0, fours: 0, sixes: 0, outs: 0 };
    }
    acc[shot.zone].runs += shot.runs;
    acc[shot.zone].shots += 1;
    if (shot.shotType === "four") acc[shot.zone].fours += 1;
    if (shot.shotType === "six") acc[shot.zone].sixes += 1;
    if (shot.shotType === "out") acc[shot.zone].outs += 1;
    return acc;
  }, {} as Record<string, { runs: number; shots: number; fours: number; sixes: number; outs: number }>);

  // Get strongest zone
  const strongestZone = Object.entries(zoneStats)
    .sort((a, b) => b[1].runs - a[1].runs)[0];

  // Get weakness zone (most dismissals)
  const weaknessZone = Object.entries(zoneStats)
    .filter(([_, data]) => data.outs > 0)
    .sort((a, b) => b[1].outs - a[1].outs)[0];

  // Handle fielder movement
  const handleFielderMove = useCallback((fielder: FielderPosition) => {
    setFielders((prev) =>
      prev.map((f) => (f.id === fielder.id ? fielder : f))
    );
  }, []);

  // Download PDF report
  const downloadReport = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Title
    pdf.setFontSize(24);
    pdf.setTextColor(79, 70, 229);
    pdf.text("NPL Shot Analysis Report", pageWidth / 2, 20, { align: "center" });

    // Batsman name
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Batsman: ${selectedBatsman || "All Batsmen"}`, pageWidth / 2, 35, { align: "center" });

    // Date
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 42, { align: "center" });

    // Stats section
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text("Performance Summary", 20, 55);

    pdf.setFontSize(11);
    const statsY = 65;
    const statsData = [
      [`Total Runs: ${stats.totalRuns}`, `Balls Faced: ${stats.ballsFaced}`],
      [`Fours: ${stats.fours}`, `Sixes: ${stats.sixes}`],
      [`Dismissals: ${stats.dismissals}`, `Strike Rate: ${stats.strikeRate}`],
    ];

    statsData.forEach((row, i) => {
      pdf.text(row[0], 20, statsY + i * 8);
      pdf.text(row[1], 100, statsY + i * 8);
    });

    // Zone analysis
    pdf.setFontSize(14);
    pdf.text("Zone Analysis", 20, 100);

    pdf.setFontSize(10);
    let zoneY = 110;
    Object.entries(zoneStats)
      .sort((a, b) => b[1].runs - a[1].runs)
      .slice(0, 8)
      .forEach(([zone, data]) => {
        pdf.text(
          `${zone.replace(/_/g, " ").toUpperCase()}: ${data.runs} runs (${data.shots} shots, ${data.fours} 4s, ${data.sixes} 6s)`,
          25,
          zoneY
        );
        zoneY += 7;
      });

    // Capture field visualization with error handling for oklab colors
    if (reportRef.current) {
      try {
        const canvas = await html2canvas(reportRef.current, {
          scale: 2,
          backgroundColor: "#0F172A",
          useCORS: true,
          logging: false,
          // Ignore unsupported CSS features
          onclone: (clonedDoc) => {
            // Replace any oklab/oklch colors with fallback hex colors
            const allElements = clonedDoc.querySelectorAll("*");
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              const computedStyle = window.getComputedStyle(htmlEl);
              
              // Check for gradient backgrounds that might use oklab
              const bgImage = computedStyle.backgroundImage;
              if (bgImage && (bgImage.includes("oklab") || bgImage.includes("oklch"))) {
                htmlEl.style.backgroundImage = "none";
                htmlEl.style.backgroundColor = "#1E293B";
              }
              
              // Check background color
              const bgColor = computedStyle.backgroundColor;
              if (bgColor && (bgColor.includes("oklab") || bgColor.includes("oklch"))) {
                htmlEl.style.backgroundColor = "#1E293B";
              }
              
              // Check text color
              const color = computedStyle.color;
              if (color && (color.includes("oklab") || color.includes("oklch"))) {
                htmlEl.style.color = "#FFFFFF";
              }
            });
          },
        });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 170;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add field image title
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Shot Map Visualization", 20, 175);
        
        // Add the field image
        pdf.addImage(imgData, "PNG", (pageWidth - imgWidth) / 2, 180, imgWidth, Math.min(imgHeight, 100));
      } catch (error) {
        console.error("Error capturing field image:", error);
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text("(Field visualization could not be captured)", pageWidth / 2, 190, { align: "center" });
      }
    }

    // Recommendations
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text("Analysis & Recommendations", 20, 20);

    pdf.setFontSize(11);
    let recY = 35;

    if (strongestZone) {
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Strongest Zone: ${strongestZone[0].replace(/_/g, " ")} (${strongestZone[1].runs} runs)`, 20, recY);
      recY += 10;
    }

    if (weaknessZone) {
      pdf.setTextColor(239, 68, 68);
      pdf.text(`Weakness Zone: ${weaknessZone[0].replace(/_/g, " ")} (${weaknessZone[1].outs} dismissals)`, 20, recY);
      recY += 10;
    }

    pdf.setTextColor(0, 0, 0);
    recY += 5;
    pdf.text("Fielding Recommendations:", 20, recY);
    recY += 10;

    if (strongestZone) {
      pdf.text(`• Place an extra fielder in ${strongestZone[0].replace(/_/g, " ")} region`, 25, recY);
      recY += 7;
    }

    if (stats.sixes > stats.fours) {
      pdf.text("• Batsman favors aerial shots - consider deeper fielders", 25, recY);
      recY += 7;
    }

    if (weaknessZone) {
      pdf.text(`• Bowl to ${weaknessZone[0].replace(/_/g, " ")} for higher dismissal chance`, 25, recY);
    }

    pdf.save(`shot-analysis-${selectedBatsman || "all"}-${Date.now()}.pdf`);
  }, [selectedBatsman, stats, zoneStats, strongestZone, weaknessZone]);

  // Reset fielders
  const resetFielders = () => {
    setFielders(defaultFielders);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-400">Loading Shot Analyzer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Target className="h-8 w-8 text-indigo-400" />
            Shot Analyzer
          </h1>
          <p className="mt-1 text-slate-400">
            Interactive cricket field analysis with fielding optimization
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
          <button
            onClick={resetFielders}
            className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reset Fielders
          </button>
        </div>
      </div>

      {/* Top 3 Batsmen Quick Select */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topBatsmen.map((player, index) => (
          <motion.button
            key={player.name}
            onClick={() => setSelectedBatsman(selectedBatsman === player.name ? "" : player.name)}
            className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${
              selectedBatsman === player.name
                ? "bg-indigo-600 ring-2 ring-indigo-400"
                : "bg-gradient-to-br from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Rank Badge */}
            <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              index === 0 ? "bg-yellow-500 text-yellow-900" :
              index === 1 ? "bg-gray-300 text-gray-700" :
              "bg-amber-600 text-amber-100"
            }`}>
              #{index + 1}
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                selectedBatsman === player.name ? "bg-white/20" : "bg-indigo-500/30"
              }`}>
                {player.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-white">{player.name}</p>
                <p className="text-xs text-slate-300">
                  {player.runs} runs • {player.shots} shots
                </p>
              </div>
            </div>
            
            <div className="mt-3 flex gap-3 text-xs">
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">
                {player.fours} fours
              </span>
              <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                {player.sixes} sixes
              </span>
            </div>
            
            {selectedBatsman === player.name && (
              <div className="absolute bottom-2 right-2">
                <Eye className="h-4 w-4 text-white/70" />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-400 mb-1">
              Select Batsman
            </label>
            <Select
              value={selectedBatsman}
              onChange={(value) => setSelectedBatsman(value)}
              options={[
                { value: "", label: "All Batsmen" },
                ...batsmen.map((b) => ({ value: b, label: b })),
              ]}
              searchable
              searchPlaceholder="Search batsman..."
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
              Analysis Mode
              <span className="text-xs text-slate-500 cursor-help" title="Filter the shots displayed on the field">ⓘ</span>
            </label>
            <Select
              value={analysisMode}
              onChange={(value) => setAnalysisMode(value as typeof analysisMode)}
              options={[
                { value: "shots", label: "All Shots - Show every shot played" },
                { value: "boundaries", label: "Boundaries Only - Only 4s and 6s" },
                { value: "dismissals", label: "Dismissals - Only wickets (W)" },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFielderEditor(!showFielderEditor)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                showFielderEditor
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <Settings className="h-4 w-4" />
              {showFielderEditor ? "Editing Fielders" : "Edit Fielders"}
            </button>
          </div>
        </div>
        
        {/* Analysis Mode Explanation */}
        <div className="mt-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600">
          <p className="text-xs text-slate-400">
            <strong className="text-slate-300">💡 Mode Explanation:</strong>{" "}
            {analysisMode === "shots" && "Showing all shots played by the batsman - includes singles, doubles, boundaries, dots, and dismissals."}
            {analysisMode === "boundaries" && "Showing only boundary shots (4s shown in green, 6s shown in gold) - helps identify where the batsman scores most runs."}
            {analysisMode === "dismissals" && "Showing only wickets (W in red) - helps identify the batsman's weak zones where they tend to get out."}
          </p>
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cricket Field */}
        <div className="lg:col-span-2" ref={reportRef}>
          <Card title={`Shot Map${selectedBatsman ? ` - ${selectedBatsman}` : ""}`} subtitle="Click zones to filter • Click again to show all • Hover for details">
            <InteractiveCricketField
              batsman={selectedBatsman || "All"}
              shots={
                analysisMode === "boundaries"
                  ? filteredShots.filter((s) => s.shotType === "four" || s.shotType === "six")
                  : analysisMode === "dismissals"
                  ? filteredShots.filter((s) => s.shotType === "out")
                  : filteredShots
              }
              fielders={fielders}
              onFielderMove={showFielderEditor ? handleFielderMove : undefined}
              onZoneClick={(zone) => setSelectedZone(selectedZone === zone ? "" : zone)}
              selectedZone={selectedZone}
              showAnimation={isAnimating}
              editMode={showFielderEditor}
            />
            {selectedZone && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-sm text-slate-400">
                  Filtering by: <strong className="text-indigo-400 capitalize">{selectedZone.replace(/_/g, " ")}</strong>
                </span>
                <button
                  onClick={() => setSelectedZone("")}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Stats Panel */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card title="Performance Stats">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-700/50 p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.totalRuns}</p>
                <p className="text-xs text-slate-400">Total Runs</p>
              </div>
              <div className="rounded-xl bg-slate-700/50 p-4 text-center">
                <p className="text-2xl font-bold text-white">{stats.ballsFaced}</p>
                <p className="text-xs text-slate-400">Balls Faced</p>
              </div>
              <div className="rounded-xl bg-green-500/20 p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{stats.fours}</p>
                <p className="text-xs text-slate-400">Fours</p>
              </div>
              <div className="rounded-xl bg-yellow-500/20 p-4 text-center">
                <p className="text-2xl font-bold text-yellow-400">{stats.sixes}</p>
                <p className="text-xs text-slate-400">Sixes</p>
              </div>
              <div className="rounded-xl bg-red-500/20 p-4 text-center">
                <p className="text-2xl font-bold text-red-400">{stats.dismissals}</p>
                <p className="text-xs text-slate-400">Dismissals</p>
              </div>
              <div className="rounded-xl bg-indigo-500/20 p-4 text-center" title="Strike Rate = (Runs / Balls Faced) × 100">
                <p className="text-2xl font-bold text-indigo-400">{stats.strikeRate}</p>
                <p className="text-xs text-slate-400">Strike Rate</p>
              </div>
            </div>
          </Card>

          {/* Zone Analysis */}
          <Card title="Zone Analysis">
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {Object.entries(zoneStats)
                .sort((a, b) => b[1].runs - a[1].runs)
                .map(([zone, data]) => (
                  <motion.div
                    key={zone}
                    onClick={() => setSelectedZone(selectedZone === zone ? "" : zone)}
                    className={`rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedZone === zone
                        ? "bg-indigo-500/30 border border-indigo-500"
                        : "bg-slate-700/50 hover:bg-slate-700"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white capitalize">
                        {zone.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-bold text-indigo-400">
                        {data.runs} runs
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span>{data.shots} shots</span>
                      <span className="text-green-400">{data.fours} 4s</span>
                      <span className="text-yellow-400">{data.sixes} 6s</span>
                      {data.outs > 0 && (
                        <span className="text-red-400">{data.outs} out</span>
                      )}
                    </div>
                  </motion.div>
                ))}
            </div>
          </Card>

          {/* Insights */}
          <Card title="AI Insights">
            <div className="space-y-3">
              {strongestZone && (
                <div className="flex items-start gap-3 rounded-lg bg-green-500/10 p-3">
                  <TrendingUp className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-400">Strongest Zone</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {strongestZone[0].replace(/_/g, " ")} with {strongestZone[1].runs} runs 
                      from {strongestZone[1].shots} shots
                    </p>
                  </div>
                </div>
              )}

              {weaknessZone && (
                <div className="flex items-start gap-3 rounded-lg bg-red-500/10 p-3">
                  <Shield className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Vulnerability</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {weaknessZone[0].replace(/_/g, " ")} - {weaknessZone[1].outs} dismissal(s)
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 rounded-lg bg-indigo-500/10 p-3">
                <Zap className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-indigo-400">Fielding Tip</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {stats.sixes > stats.fours
                      ? "Batsman prefers aerial shots. Keep fielders deep on the boundary."
                      : "Ground shots are preferred. Strengthen the inner ring."}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Fielder Editor Panel */}
      <AnimatePresence>
        {showFielderEditor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card title="Fielder Positions" subtitle="Drag fielders on the field or edit here">
              <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-5">
                {fielders.map((fielder) => (
                  <div
                    key={fielder.id}
                    className="rounded-lg bg-slate-700/50 p-3"
                  >
                    <p className="text-sm font-medium text-white">{fielder.name}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Position: ({Math.round(fielder.x)}, {Math.round(fielder.y)})
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
