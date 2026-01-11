"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";

interface ShotData {
  zone: string;
  runs: number;
  fours: number;
  sixes: number;
  dismissals: number;
}

interface CricketFieldProps {
  shotData?: ShotData[];
  selectedZone?: string;
  onZoneClick?: (zone: string) => void;
  className?: string;
  mode?: "shots" | "fours" | "sixes" | "dismissals";
}

// Cricket field zones with SVG coordinates
const zones = [
  { id: "third_man", name: "Third Man", path: "M 250 50 L 350 50 L 400 150 L 300 200 L 200 150 Z", angle: 315 },
  { id: "point", name: "Point", path: "M 400 150 L 450 50 L 480 150 L 450 250 L 400 200 Z", angle: 0 },
  { id: "cover", name: "Cover", path: "M 450 250 L 480 150 L 500 250 L 480 350 L 450 300 Z", angle: 30 },
  { id: "extra_cover", name: "Extra Cover", path: "M 450 300 L 480 350 L 450 450 L 400 400 L 400 350 Z", angle: 60 },
  { id: "mid_off", name: "Mid Off", path: "M 400 400 L 450 450 L 400 500 L 300 480 L 320 420 Z", angle: 90 },
  { id: "long_off", name: "Long Off", path: "M 300 480 L 400 500 L 300 550 L 200 500 Z", angle: 120 },
  { id: "long_on", name: "Long On", path: "M 200 500 L 300 550 L 200 550 L 100 500 Z", angle: 150 },
  { id: "mid_on", name: "Mid On", path: "M 200 400 L 200 480 L 100 500 L 50 450 L 100 400 Z", angle: 180 },
  { id: "mid_wicket", name: "Mid Wicket", path: "M 100 300 L 100 400 L 50 450 L 20 350 L 50 300 Z", angle: 210 },
  { id: "square_leg", name: "Square Leg", path: "M 50 200 L 100 300 L 50 300 L 20 250 L 20 200 Z", angle: 270 },
  { id: "fine_leg", name: "Fine Leg", path: "M 100 100 L 150 200 L 100 250 L 50 200 L 50 100 Z", angle: 300 },
  { id: "behind", name: "Behind Wicket", path: "M 150 50 L 250 50 L 200 150 L 150 150 Z", angle: 330 },
];

// Simplified zone boundaries for rendering
const fieldZones = [
  { id: "third_man", name: "Third Man", cx: 380, cy: 100, runs: 0 },
  { id: "point", name: "Point", cx: 450, cy: 180, runs: 0 },
  { id: "cover", name: "Cover", cx: 470, cy: 280, runs: 0 },
  { id: "extra_cover", name: "Extra Cover", cx: 450, cy: 380, runs: 0 },
  { id: "mid_off", name: "Mid Off", cx: 380, cy: 450, runs: 0 },
  { id: "long_off", name: "Long Off", cx: 300, cy: 500, runs: 0 },
  { id: "long_on", name: "Long On", cx: 200, cy: 500, runs: 0 },
  { id: "mid_on", name: "Mid On", cx: 120, cy: 450, runs: 0 },
  { id: "mid_wicket", name: "Mid Wicket", cx: 50, cy: 380, runs: 0 },
  { id: "square_leg", name: "Square Leg", cx: 30, cy: 280, runs: 0 },
  { id: "fine_leg", name: "Fine Leg", cx: 50, cy: 180, runs: 0 },
  { id: "leg_slip", name: "Leg Slip", cx: 120, cy: 100, runs: 0 },
];

const getZoneColor = (value: number, maxValue: number, mode: string) => {
  if (maxValue === 0) return "#1E3A5F";
  const intensity = value / maxValue;
  
  if (mode === "dismissals") {
    if (intensity > 0.8) return "#DC2626";
    if (intensity > 0.6) return "#EA580C";
    if (intensity > 0.4) return "#F59E0B";
    if (intensity > 0.2) return "#84CC16";
    return "#22C55E";
  }
  
  // For runs/fours/sixes - green to red gradient
  if (intensity > 0.8) return "#22C55E";
  if (intensity > 0.6) return "#84CC16";
  if (intensity > 0.4) return "#F59E0B";
  if (intensity > 0.2) return "#3B82F6";
  return "#1E3A5F";
};

export function CricketField({
  shotData = [],
  selectedZone,
  onZoneClick,
  className,
  mode = "shots",
}: CricketFieldProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Calculate max values for color scaling
  const maxRuns = Math.max(...shotData.map(d => d.runs), 1);
  const maxFours = Math.max(...shotData.map(d => d.fours), 1);
  const maxSixes = Math.max(...shotData.map(d => d.sixes), 1);
  const maxDismissals = Math.max(...shotData.map(d => d.dismissals), 1);

  const getValue = (zone: string) => {
    const data = shotData.find(d => d.zone.toLowerCase().replace(/\s+/g, '_') === zone);
    if (!data) return 0;
    switch (mode) {
      case "fours": return data.fours;
      case "sixes": return data.sixes;
      case "dismissals": return data.dismissals;
      default: return data.runs;
    }
  };

  const getMaxValue = () => {
    switch (mode) {
      case "fours": return maxFours;
      case "sixes": return maxSixes;
      case "dismissals": return maxDismissals;
      default: return maxRuns;
    }
  };

  const getZoneData = (zone: string) => {
    return shotData.find(d => d.zone.toLowerCase().replace(/\s+/g, '_') === zone);
  };

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 500 550"
        className="w-full max-w-lg mx-auto"
        style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))" }}
      >
        {/* Field background - ellipse for cricket ground */}
        <defs>
          <radialGradient id="fieldGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="70%" stopColor="#14532D" />
            <stop offset="100%" stopColor="#052E16" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main field */}
        <ellipse
          cx="250"
          cy="275"
          rx="230"
          ry="250"
          fill="url(#fieldGradient)"
          stroke="#22C55E"
          strokeWidth="3"
        />

        {/* Inner circle (30-yard circle) */}
        <ellipse
          cx="250"
          cy="275"
          rx="100"
          ry="110"
          fill="none"
          stroke="#22C55E"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.6"
        />

        {/* Pitch */}
        <rect
          x="230"
          y="230"
          width="40"
          height="90"
          fill="#C4A574"
          stroke="#8B7355"
          strokeWidth="1"
        />

        {/* Crease lines */}
        <line x1="220" y1="250" x2="280" y2="250" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="220" y1="300" x2="280" y2="300" stroke="#FFFFFF" strokeWidth="2" />

        {/* Zone indicators */}
        {fieldZones.map((zone) => {
          const value = getValue(zone.id);
          const maxVal = getMaxValue();
          const isHovered = hoveredZone === zone.id;
          const isSelected = selectedZone === zone.id;

          return (
            <g key={zone.id}>
              {/* Zone circle */}
              <motion.circle
                cx={zone.cx}
                cy={zone.cy}
                r={isHovered || isSelected ? 28 : 24}
                fill={getZoneColor(value, maxVal, mode)}
                stroke={isSelected ? "#FFFFFF" : isHovered ? "#F59E0B" : "#374151"}
                strokeWidth={isSelected ? 3 : 2}
                style={{ cursor: "pointer" }}
                onClick={() => onZoneClick?.(zone.id)}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                initial={false}
                animate={{
                  scale: isHovered || isSelected ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
                filter={isHovered || isSelected ? "url(#glow)" : undefined}
              />
              {/* Value display */}
              <text
                x={zone.cx}
                y={zone.cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#FFFFFF"
                fontSize="12"
                fontWeight="bold"
                style={{ pointerEvents: "none" }}
              >
                {value}
              </text>
              {/* Zone name on hover */}
              {isHovered && (
                <motion.text
                  x={zone.cx}
                  y={zone.cy - 35}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="500"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {zone.name}
                </motion.text>
              )}
            </g>
          );
        })}

        {/* Batsman position */}
        <circle cx="250" cy="285" r="5" fill="#FFFFFF" />
      </svg>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#22C55E]" />
          <span>High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#F59E0B]" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[#1E3A5F]" />
          <span>Low</span>
        </div>
      </div>

      {/* Zone details tooltip */}
      {hoveredZone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-lg bg-slate-800/95 p-3 shadow-xl backdrop-blur-sm"
        >
          {(() => {
            const data = getZoneData(hoveredZone);
            const zone = fieldZones.find(z => z.id === hoveredZone);
            if (!data || !zone) return null;
            return (
              <div className="text-center">
                <p className="font-semibold text-white">{zone.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-slate-400">Runs:</span>
                  <span className="text-white font-medium">{data.runs}</span>
                  <span className="text-slate-400">Fours:</span>
                  <span className="text-green-400 font-medium">{data.fours}</span>
                  <span className="text-slate-400">Sixes:</span>
                  <span className="text-purple-400 font-medium">{data.sixes}</span>
                  <span className="text-slate-400">Dismissals:</span>
                  <span className="text-red-400 font-medium">{data.dismissals}</span>
                </div>
              </div>
            );
          })()}
        </motion.div>
      )}
    </div>
  );
}

// Mode selector for the cricket field
interface FieldModeSelectorProps {
  mode: "shots" | "fours" | "sixes" | "dismissals";
  onChange: (mode: "shots" | "fours" | "sixes" | "dismissals") => void;
  className?: string;
}

export function FieldModeSelector({ mode, onChange, className }: FieldModeSelectorProps) {
  const modes = [
    { id: "shots", label: "Total Runs", color: "bg-blue-500" },
    { id: "fours", label: "Fours", color: "bg-green-500" },
    { id: "sixes", label: "Sixes", color: "bg-purple-500" },
    { id: "dismissals", label: "Dismissals", color: "bg-red-500" },
  ] as const;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            mode === m.id
              ? `${m.color} text-white shadow-lg`
              : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
