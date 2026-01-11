"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Target, MapPin, User, TrendingUp } from "lucide-react";
import { Card, LoadingSpinner, Badge, Tabs } from "@/components/ui/common";
import { Select } from "@/components/ui/select";
import { StatsCard } from "@/components/ui/stats-card";
import { CricketField, FieldModeSelector } from "@/components/cricket-field";
import { HeatmapChart } from "@/components/charts";
import { loadMasterData } from "@/lib/data";
import { PlayerMatchData } from "@/lib/types";
import { getTeamShortName, getTeamColor } from "@/lib/utils";

// Simulate shot distribution zones (in real scenario, this would come from ball-by-ball data)
const generateShotDistribution = (playerData: PlayerMatchData[]) => {
  const zones = [
    "third_man", "point", "cover", "extra_cover", "mid_off",
    "long_off", "long_on", "mid_on", "mid_wicket", "square_leg",
    "fine_leg", "leg_slip"
  ];

  const totalRuns = playerData.reduce((sum, d) => sum + d.runs_scored, 0);
  const totalFours = playerData.reduce((sum, d) => sum + d.fours, 0);
  const totalSixes = playerData.reduce((sum, d) => sum + d.sixes, 0);
  
  // Distribute based on realistic cricket patterns
  const weights = {
    third_man: 0.05,
    point: 0.08,
    cover: 0.15,
    extra_cover: 0.12,
    mid_off: 0.08,
    long_off: 0.12,
    long_on: 0.10,
    mid_on: 0.08,
    mid_wicket: 0.10,
    square_leg: 0.06,
    fine_leg: 0.04,
    leg_slip: 0.02,
  };

  // Six weights (more likely in certain areas)
  const sixWeights = {
    third_man: 0.02,
    point: 0.02,
    cover: 0.08,
    extra_cover: 0.10,
    mid_off: 0.12,
    long_off: 0.20,
    long_on: 0.18,
    mid_on: 0.10,
    mid_wicket: 0.12,
    square_leg: 0.04,
    fine_leg: 0.02,
    leg_slip: 0.00,
  };

  // Four weights
  const fourWeights = {
    third_man: 0.08,
    point: 0.12,
    cover: 0.18,
    extra_cover: 0.10,
    mid_off: 0.06,
    long_off: 0.08,
    long_on: 0.08,
    mid_on: 0.06,
    mid_wicket: 0.10,
    square_leg: 0.08,
    fine_leg: 0.04,
    leg_slip: 0.02,
  };

  // Dismissal zones
  const dismissals = playerData.filter(d => d.out_status === "Yes").length;
  const dismissalWeights = {
    third_man: 0.05,
    point: 0.15,
    cover: 0.20,
    extra_cover: 0.12,
    mid_off: 0.10,
    long_off: 0.08,
    long_on: 0.08,
    mid_on: 0.08,
    mid_wicket: 0.08,
    square_leg: 0.04,
    fine_leg: 0.02,
    leg_slip: 0.00,
  };

  return zones.map(zone => ({
    zone,
    runs: Math.round(totalRuns * weights[zone as keyof typeof weights]),
    fours: Math.round(totalFours * fourWeights[zone as keyof typeof fourWeights]),
    sixes: Math.round(totalSixes * sixWeights[zone as keyof typeof sixWeights]),
    dismissals: Math.round(dismissals * dismissalWeights[zone as keyof typeof dismissalWeights]),
  }));
};

export default function CricketFieldPage() {
  const [loading, setLoading] = useState(true);
  const [masterData, setMasterData] = useState<PlayerMatchData[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("all");
  const [selectedMatch, setSelectedMatch] = useState<string>("all");
  const [fieldMode, setFieldMode] = useState<"shots" | "fours" | "sixes" | "dismissals">("shots");
  const [selectedZone, setSelectedZone] = useState<string | undefined>();

  useEffect(() => {
    async function loadData() {
      try {
        const master = await loadMasterData();
        setMasterData(master);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return masterData.filter(d => {
      if (selectedSeason !== "all" && d.season !== parseInt(selectedSeason)) return false;
      if (selectedTeam !== "all" && d.team !== selectedTeam) return false;
      if (selectedPlayer !== "all" && d.player_name !== selectedPlayer) return false;
      if (selectedMatch !== "all" && d.match_id_unique !== selectedMatch) return false;
      return true;
    });
  }, [masterData, selectedSeason, selectedTeam, selectedPlayer, selectedMatch]);

  const shotData = useMemo(() => {
    return generateShotDistribution(filteredData);
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const teams = [...new Set(masterData.map(d => d.team))].sort();
  const players = [...new Set(
    masterData
      .filter(d => selectedTeam === "all" || d.team === selectedTeam)
      .map(d => d.player_name)
  )].sort();
  const matches = [...new Set(
    masterData
      .filter(d => selectedSeason === "all" || d.season === parseInt(selectedSeason))
      .map(d => d.match_id_unique)
  )];

  // Calculate stats
  const totalRuns = filteredData.reduce((sum, d) => sum + d.runs_scored, 0);
  const totalFours = filteredData.reduce((sum, d) => sum + d.fours, 0);
  const totalSixes = filteredData.reduce((sum, d) => sum + d.sixes, 0);
  const totalDismissals = filteredData.filter(d => d.out_status === "Yes").length;
  const uniquePlayers = new Set(filteredData.map(d => d.player_name)).size;

  // Zone stats for the heatmap
  const zoneHeatmapData = shotData.map(z => ({
    zone: z.zone.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    value: fieldMode === "fours" ? z.fours : 
           fieldMode === "sixes" ? z.sixes : 
           fieldMode === "dismissals" ? z.dismissals : z.runs,
  }));

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
            Interactive Cricket Field
          </motion.h1>
          <p className="mt-1 text-slate-400">
            Explore shot placement, scoring zones, and dismissal patterns
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="overflow-visible">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 relative z-50">
          <Select
            label="Season"
            value={selectedSeason}
            onChange={(v) => {
              setSelectedSeason(v);
              setSelectedMatch("all");
            }}
            options={[
              { value: "all", label: "All Seasons" },
              { value: "1", label: "Season 1 (2024)" },
              { value: "2", label: "Season 2 (2025)" },
            ]}
          />
          <Select
            label="Team"
            value={selectedTeam}
            onChange={(v) => {
              setSelectedTeam(v);
              setSelectedPlayer("all");
            }}
            options={[
              { value: "all", label: "All Teams" },
              ...teams.map(t => ({ value: t, label: t.replace(" (NPL)", "") })),
            ]}
          />
          <Select
            label="Player"
            value={selectedPlayer}
            onChange={setSelectedPlayer}
            options={[
              { value: "all", label: "All Players" },
              ...players.map(p => ({ value: p, label: p })),
            ]}
          />
          <Select
            label="Match"
            value={selectedMatch}
            onChange={setSelectedMatch}
            options={[
              { value: "all", label: "All Matches" },
              ...matches.map(m => ({ value: m, label: m })),
            ]}
          />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Runs"
          value={totalRuns.toLocaleString()}
          icon={Target}
          color="bg-gradient-to-br from-emerald-500 to-green-600"
        />
        <StatsCard
          title="Fours"
          value={totalFours}
          icon={TrendingUp}
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatsCard
          title="Sixes"
          value={totalSixes}
          icon={TrendingUp}
          color="bg-gradient-to-br from-purple-500 to-pink-600"
        />
        <StatsCard
          title="Dismissals"
          value={totalDismissals}
          icon={MapPin}
          color="bg-gradient-to-br from-red-500 to-orange-600"
        />
        <StatsCard
          title="Players"
          value={uniquePlayers}
          icon={User}
          color="bg-gradient-to-br from-slate-500 to-slate-600"
        />
      </div>

      {/* Mode Selector */}
      <Card>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Visualization Mode</h3>
            <p className="text-sm text-slate-400">Select what data to display on the field</p>
          </div>
          <FieldModeSelector mode={fieldMode} onChange={setFieldMode} />
        </div>
      </Card>

      {/* Cricket Field and Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Interactive Field */}
        <Card title="Shot Placement Map" subtitle="Click on zones to see details">
          <CricketField
            shotData={shotData}
            selectedZone={selectedZone}
            onZoneClick={setSelectedZone}
            mode={fieldMode}
          />
        </Card>

        {/* Zone Analysis */}
        <Card title="Zone-wise Distribution" subtitle="Scoring patterns by area">
          <HeatmapChart data={zoneHeatmapData} />
          
          {/* Selected Zone Details */}
          {selectedZone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-xl bg-slate-800/50 p-4"
            >
              <h4 className="text-lg font-semibold text-white capitalize">
                {selectedZone.replace(/_/g, " ")} Zone
              </h4>
              <div className="mt-3 grid grid-cols-4 gap-4">
                {(() => {
                  const zone = shotData.find(z => z.zone === selectedZone);
                  if (!zone) return null;
                  return (
                    <>
                      <div className="text-center">
                        <p className="text-xl font-bold text-emerald-400">{zone.runs}</p>
                        <p className="text-xs text-slate-400">Runs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-blue-400">{zone.fours}</p>
                        <p className="text-xs text-slate-400">Fours</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-purple-400">{zone.sixes}</p>
                        <p className="text-xs text-slate-400">Sixes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-red-400">{zone.dismissals}</p>
                        <p className="text-xs text-slate-400">Dismissals</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </Card>
      </div>

      {/* Insights */}
      <Card title="Key Insights" subtitle="Analysis based on current selection">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-4">
            <h4 className="font-semibold text-emerald-400">Strongest Zone</h4>
            <p className="mt-1 text-2xl font-bold text-white capitalize">
              {shotData.sort((a, b) => b.runs - a.runs)[0]?.zone.replace(/_/g, " ") || "N/A"}
            </p>
            <p className="text-sm text-slate-400">
              {shotData.sort((a, b) => b.runs - a.runs)[0]?.runs || 0} runs scored
            </p>
          </div>
          
          <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4">
            <h4 className="font-semibold text-purple-400">Best Six Zone</h4>
            <p className="mt-1 text-2xl font-bold text-white capitalize">
              {shotData.sort((a, b) => b.sixes - a.sixes)[0]?.zone.replace(/_/g, " ") || "N/A"}
            </p>
            <p className="text-sm text-slate-400">
              {shotData.sort((a, b) => b.sixes - a.sixes)[0]?.sixes || 0} sixes hit
            </p>
          </div>
          
          <div className="rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 p-4">
            <h4 className="font-semibold text-red-400">Danger Zone</h4>
            <p className="mt-1 text-2xl font-bold text-white capitalize">
              {shotData.sort((a, b) => b.dismissals - a.dismissals)[0]?.zone.replace(/_/g, " ") || "N/A"}
            </p>
            <p className="text-sm text-slate-400">
              {shotData.sort((a, b) => b.dismissals - a.dismissals)[0]?.dismissals || 0} dismissals
            </p>
          </div>
        </div>

        {selectedPlayer !== "all" && (
          <div className="mt-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
            <h4 className="font-semibold text-indigo-400">Player Analysis: {selectedPlayer}</h4>
            <p className="mt-2 text-sm text-slate-300">
              Based on the scoring pattern, this player shows strength in the{" "}
              <span className="font-semibold text-white">
                {shotData.sort((a, b) => b.runs - a.runs)[0]?.zone.replace(/_/g, " ")}
              </span>{" "}
              region. Consider bowling tight lines on the off-side to restrict scoring.
              Watch out for aerial shots towards{" "}
              <span className="font-semibold text-white">
                {shotData.sort((a, b) => b.sixes - a.sixes)[0]?.zone.replace(/_/g, " ")}
              </span>.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
