"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef } from "react";
import { GripVertical, Info } from "lucide-react";

export interface ShotData {
  id: string;
  batsmanName: string;
  zone: string;
  runs: number;
  shotType: "four" | "six" | "single" | "double" | "triple" | "dot" | "out";
  angle: number;
  distance: number;
  timestamp?: string;
  matchId?: string;
}

export interface FielderPosition {
  id: string;
  name: string;
  x: number;
  y: number;
  zone: string;
  image?: string;
}

export interface PlayerForField {
  id: string;
  name: string;
  team: string;
  role: "batsman" | "bowler" | "allrounder" | "wicketkeeper";
  image?: string;
}

interface InteractiveCricketFieldProps {
  batsman: string;
  shots: ShotData[];
  fielders: FielderPosition[];
  onFielderMove?: (fielder: FielderPosition) => void;
  onZoneClick?: (zone: string) => void;
  selectedZone?: string;
  showAnimation?: boolean;
  className?: string;
  availablePlayers?: PlayerForField[];
  onPlayerDrop?: (player: PlayerForField, x: number, y: number) => void;
  editMode?: boolean;
}

// Field zones with realistic positions
const fieldZones = [
  { id: "third_man", name: "Third Man", shortName: "3M", cx: 420, cy: 70, angle: -60 },
  { id: "slip", name: "Slip", shortName: "SL", cx: 340, cy: 120, angle: -45 },
  { id: "gully", name: "Gully", shortName: "GU", cx: 390, cy: 150, angle: -30 },
  { id: "point", name: "Point", shortName: "PT", cx: 440, cy: 210, angle: 0 },
  { id: "cover", name: "Cover", shortName: "CV", cx: 450, cy: 290, angle: 30 },
  { id: "extra_cover", name: "Extra Cover", shortName: "EC", cx: 430, cy: 370, angle: 50 },
  { id: "mid_off", name: "Mid Off", shortName: "MO", cx: 370, cy: 440, angle: 70 },
  { id: "long_off", name: "Long Off", shortName: "LO", cx: 300, cy: 500, angle: 90 },
  { id: "straight", name: "Straight", shortName: "ST", cx: 250, cy: 520, angle: 100 },
  { id: "long_on", name: "Long On", shortName: "LN", cx: 200, cy: 500, angle: 110 },
  { id: "mid_on", name: "Mid On", shortName: "MN", cx: 130, cy: 440, angle: 130 },
  { id: "mid_wicket", name: "Mid Wicket", shortName: "MW", cx: 70, cy: 370, angle: 150 },
  { id: "square_leg", name: "Square Leg", shortName: "SQ", cx: 50, cy: 290, angle: 180 },
  { id: "leg_gully", name: "Leg Gully", shortName: "LG", cx: 60, cy: 210, angle: 200 },
  { id: "fine_leg", name: "Fine Leg", shortName: "FL", cx: 80, cy: 130, angle: 225 },
  { id: "leg_slip", name: "Leg Slip", shortName: "LS", cx: 160, cy: 120, angle: 240 },
  { id: "behind_wicket", name: "Wicket Keeper", shortName: "WK", cx: 250, cy: 90, angle: 270 },
];

const getShotColor = (shotType: ShotData["shotType"]) => {
  switch (shotType) {
    case "six": return "#FFD700";
    case "four": return "#22C55E";
    case "triple": return "#3B82F6";
    case "double": return "#8B5CF6";
    case "single": return "#06B6D4";
    case "dot": return "#64748B";
    case "out": return "#EF4444";
    default: return "#94A3B8";
  }
};

const getShotLabel = (shotType: ShotData["shotType"]) => {
  switch (shotType) {
    case "six": return "6";
    case "four": return "4";
    case "triple": return "3";
    case "double": return "2";
    case "single": return "1";
    case "dot": return "•";
    case "out": return "W";
    default: return "";
  }
};

// Get player initials
const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Get role color
const getRoleColor = (role: string) => {
  switch (role) {
    case "batsman": return { bg: "#3B82F6", border: "#60A5FA" };
    case "bowler": return { bg: "#8B5CF6", border: "#A78BFA" };
    case "allrounder": return { bg: "#10B981", border: "#34D399" };
    case "wicketkeeper": return { bg: "#F59E0B", border: "#FBBF24" };
    default: return { bg: "#6B7280", border: "#9CA3AF" };
  }
};

export function InteractiveCricketField({
  batsman,
  shots,
  fielders,
  onFielderMove,
  onZoneClick,
  selectedZone,
  showAnimation = true,
  className,
  availablePlayers = [],
  onPlayerDrop,
  editMode = false,
}: InteractiveCricketFieldProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [animatingShot, setAnimatingShot] = useState<ShotData | null>(null);
  const [draggingFielder, setDraggingFielder] = useState<string | null>(null);
  const [draggedPlayer, setDraggedPlayer] = useState<PlayerForField | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate shot end position based on zone (more accurate) or angle
  const getShotEndPosition = useCallback((shot: ShotData) => {
    const centerX = 250;
    const centerY = 270;
    
    // First try to find the zone position for accurate placement
    const zone = fieldZones.find(z => z.id === shot.zone);
    if (zone) {
      // Calculate position towards the zone, adjusted by distance
      const dx = zone.cx - centerX;
      const dy = zone.cy - centerY;
      const zoneDistance = Math.sqrt(dx * dx + dy * dy);
      const normalizedDistance = (shot.distance / 100);
      
      // Scale the position based on shot distance (boundaries go further)
      const scale = normalizedDistance * 0.9 + 0.1; // Range from 0.1 to 1.0
      const endX = centerX + dx * scale;
      const endY = centerY + dy * scale;
      
      return { x: endX, y: endY };
    }
    
    // Fallback to angle-based calculation if zone not found
    // Cricket angle convention: 0° = point (off-side), 90° = straight, 180° = square leg
    // SVG: Y increases downward, so we need to invert
    const maxDistance = 200;
    const normalizedDistance = (shot.distance / 100) * maxDistance;
    
    // Convert cricket angle to SVG angle
    // Cricket: 0° is to the right (point), goes counter-clockwise
    // SVG: 0° is to the right, goes clockwise
    // We need: angle 0 -> right, angle 90 -> up (negative Y in SVG)
    const svgAngle = -shot.angle; // Negate for counter-clockwise
    const angleRad = svgAngle * (Math.PI / 180);
    const endX = centerX + Math.cos(angleRad) * normalizedDistance;
    const endY = centerY + Math.sin(angleRad) * normalizedDistance;
    
    return { x: endX, y: endY };
  }, []);

  // Handle fielder drag
  const handleFielderDrag = useCallback((e: React.MouseEvent | React.TouchEvent, fielderId: string) => {
    if (!svgRef.current || !onFielderMove) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    
    if ('touches' in e) {
      pt.x = e.touches[0].clientX;
      pt.y = e.touches[0].clientY;
    } else {
      pt.x = e.clientX;
      pt.y = e.clientY;
    }
    
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    const fielder = fielders.find(f => f.id === fielderId);
    if (fielder) {
      onFielderMove({
        ...fielder,
        x: Math.max(30, Math.min(470, svgP.x)),
        y: Math.max(30, Math.min(530, svgP.y)),
      });
    }
  }, [fielders, onFielderMove]);

  // Handle drop on field
  const handleFieldDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!svgRef.current || !draggedPlayer || !onPlayerDrop) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    onPlayerDrop(draggedPlayer, svgP.x, svgP.y);
    setDraggedPlayer(null);
  }, [draggedPlayer, onPlayerDrop]);

  // Get zone statistics
  const getZoneStats = useCallback((zoneId: string) => {
    const zoneShots = shots.filter(s => s.zone === zoneId);
    return {
      total: zoneShots.length,
      runs: zoneShots.reduce((sum, s) => sum + s.runs, 0),
      fours: zoneShots.filter(s => s.shotType === "four").length,
      sixes: zoneShots.filter(s => s.shotType === "six").length,
      outs: zoneShots.filter(s => s.shotType === "out").length,
    };
  }, [shots]);

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {/* Field SVG */}
      <svg
        ref={svgRef}
        viewBox="0 0 500 560"
        className="w-full max-w-4xl mx-auto"
        style={{ filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))" }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFieldDrop}
      >
        {/* Definitions */}
        <defs>
          {/* Grass gradient */}
          <radialGradient id="grassGradient" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="40%" stopColor="#16A34A" />
            <stop offset="70%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#166534" />
          </radialGradient>
          
          {/* Outfield gradient */}
          <radialGradient id="outfieldGradient" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="100%" stopColor="#14532D" />
          </radialGradient>
          
          {/* Pitch gradient */}
          <linearGradient id="pitchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4A574" />
            <stop offset="50%" stopColor="#C4956A" />
            <stop offset="100%" stopColor="#B8875C" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Ball gradient */}
          <radialGradient id="ballGradient" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </radialGradient>

          {/* Shadow filter */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
          
          {/* Grass pattern */}
          <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="20" height="20">
            <line x1="0" y1="0" x2="20" y2="20" stroke="rgba(34, 197, 94, 0.1)" strokeWidth="1"/>
            <line x1="20" y1="0" x2="0" y2="20" stroke="rgba(34, 197, 94, 0.1)" strokeWidth="1"/>
          </pattern>
        </defs>

        {/* Main field (oval) */}
        <ellipse
          cx="250"
          cy="280"
          rx="235"
          ry="265"
          fill="url(#outfieldGradient)"
          stroke="#0D9488"
          strokeWidth="4"
        />

        {/* Inner grass area */}
        <ellipse
          cx="250"
          cy="280"
          rx="215"
          ry="245"
          fill="url(#grassGradient)"
        />
        
        {/* Grass pattern overlay */}
        <ellipse
          cx="250"
          cy="280"
          rx="215"
          ry="245"
          fill="url(#grassPattern)"
        />

        {/* Grass texture lines - mowing pattern */}
        {[...Array(8)].map((_, i) => (
          <ellipse
            key={`grass-line-${i}`}
            cx="250"
            cy="280"
            rx={215 - i * 25}
            ry={245 - i * 28}
            fill="none"
            stroke="rgba(34, 197, 94, 0.12)"
            strokeWidth="12"
          />
        ))}

        {/* 30-yard circle */}
        <ellipse
          cx="250"
          cy="280"
          rx="100"
          ry="115"
          fill="none"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="2.5"
          strokeDasharray="10,5"
        />

        {/* Inner circle (close catching area) */}
        <ellipse
          cx="250"
          cy="270"
          rx="45"
          ry="55"
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="1.5"
          strokeDasharray="5,5"
        />

        {/* Pitch */}
        <rect
          x="233"
          y="230"
          width="34"
          height="75"
          rx="2"
          fill="url(#pitchGradient)"
          stroke="#8B7355"
          strokeWidth="1"
        />

        {/* Pitch markings - creases */}
        <line x1="220" y1="243" x2="280" y2="243" stroke="#FFFFFF" strokeWidth="2.5" />
        <line x1="220" y1="293" x2="280" y2="293" stroke="#FFFFFF" strokeWidth="2.5" />
        
        {/* Popping crease */}
        <line x1="233" y1="248" x2="267" y2="248" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="233" y1="288" x2="267" y2="288" stroke="#FFFFFF" strokeWidth="1.5" />
        
        {/* Return creases */}
        <line x1="247" y1="243" x2="247" y2="233" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="253" y1="243" x2="253" y2="233" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="247" y1="293" x2="247" y2="303" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="253" y1="293" x2="253" y2="303" stroke="#FFFFFF" strokeWidth="1.5" />

        {/* Stumps - more realistic */}
        {[243, 247, 251, 255].map((x, i) => (
          <g key={`stump-top-${i}`}>
            <rect x={x} y="236" width="3" height="14" fill="#E5E7EB" rx="1" />
            <ellipse cx={x + 1.5} cy="236" rx="2.5" ry="1.5" fill="#F3F4F6" />
          </g>
        ))}
        {[243, 247, 251, 255].map((x, i) => (
          <g key={`stump-bottom-${i}`}>
            <rect x={x} y="288" width="3" height="14" fill="#E5E7EB" rx="1" />
            <ellipse cx={x + 1.5} cy="288" rx="2.5" ry="1.5" fill="#F3F4F6" />
          </g>
        ))}
        
        {/* Bails */}
        <rect x="244" y="234" width="12" height="2" fill="#D1D5DB" rx="1" />
        <rect x="244" y="286" width="12" height="2" fill="#D1D5DB" rx="1" />

        {/* Batsman position */}
        <g transform="translate(250, 268)">
          <circle r="14" fill="#1E40AF" stroke="#3B82F6" strokeWidth="3" filter="url(#shadow)" />
          <text y="5" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">B</text>
        </g>

        {/* Zone indicators */}
        {fieldZones.map((zone) => {
          const stats = getZoneStats(zone.id);
          const isHovered = hoveredZone === zone.id;
          const isSelected = selectedZone === zone.id;
          const hasShots = stats.total > 0;

          return (
            <g key={zone.id}>
              {/* Zone hit area */}
              <motion.circle
                cx={zone.cx}
                cy={zone.cy}
                r={isHovered || isSelected ? 30 : 26}
                fill={hasShots ? "rgba(34, 197, 94, 0.35)" : "rgba(100, 116, 139, 0.2)"}
                stroke={isSelected ? "#F59E0B" : isHovered ? "#3B82F6" : "rgba(148, 163, 184, 0.5)"}
                strokeWidth={isSelected ? 3 : 2}
                style={{ cursor: "pointer" }}
                onClick={() => onZoneClick?.(zone.id)}
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                animate={{
                  scale: isHovered || isSelected ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              
              {/* Zone short name */}
              <text
                x={zone.cx}
                y={zone.cy - 6}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="600"
                style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
              >
                {zone.shortName}
              </text>
              
              {/* Shot count */}
              {stats.total > 0 && (
                <text
                  x={zone.cx}
                  y={zone.cy + 10}
                  textAnchor="middle"
                  fill="#22C55E"
                  fontSize="10"
                  fontWeight="bold"
                  style={{ pointerEvents: "none" }}
                >
                  {stats.runs}
                </text>
              )}

              {/* Hover tooltip */}
              <AnimatePresence>
                {isHovered && stats.total > 0 && (
                  <motion.g
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <rect
                      x={zone.cx - 50}
                      y={zone.cy + 25}
                      width="100"
                      height="55"
                      rx="6"
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="#334155"
                    />
                    <text x={zone.cx} y={zone.cy + 40} textAnchor="middle" fill="#FFF" fontSize="9" fontWeight="bold">
                      {zone.name}
                    </text>
                    <text x={zone.cx} y={zone.cy + 54} textAnchor="middle" fill="#94A3B8" fontSize="9">
                      4s: {stats.fours} | 6s: {stats.sixes}
                    </text>
                    <text x={zone.cx} y={zone.cy + 68} textAnchor="middle" fill="#EF4444" fontSize="9">
                      Dismissals: {stats.outs}
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </g>
          );
        })}

        {/* Fielder positions */}
        {fielders.map((fielder) => {
          const colors = getRoleColor("bowler");
          return (
            <motion.g
              key={fielder.id}
              style={{ cursor: editMode ? "grab" : "default" }}
              drag={editMode}
              dragConstraints={{ left: 30, right: 470, top: 30, bottom: 530 }}
              onDrag={(e) => editMode && handleFielderDrag(e as unknown as React.MouseEvent, fielder.id)}
              whileHover={{ scale: editMode ? 1.15 : 1 }}
              whileDrag={{ scale: 1.2, cursor: "grabbing" }}
            >
              <circle
                cx={fielder.x}
                cy={fielder.y}
                r="16"
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth="2.5"
                filter="url(#shadow)"
              />
              <text
                x={fielder.x}
                y={fielder.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="bold"
              >
                {getInitials(fielder.name)}
              </text>
              {editMode && (
                <circle
                  cx={fielder.x}
                  cy={fielder.y}
                  r="20"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  opacity="0.7"
                />
              )}
            </motion.g>
          );
        })}

        {/* Shot trajectories */}
        {shots.map((shot, index) => {
          const endPos = getShotEndPosition(shot);
          return (
            <g key={`shot-${shot.id}-${index}`}>
              {/* Shot line */}
              <motion.line
                x1={250}
                y1={268}
                x2={endPos.x}
                y2={endPos.y}
                stroke={getShotColor(shot.shotType)}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity={0.7}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              />
              
              {/* Shot end point */}
              <motion.circle
                cx={endPos.x}
                cy={endPos.y}
                r="12"
                fill={getShotColor(shot.shotType)}
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 + 0.3 }}
                filter="url(#glow)"
              />
              
              {/* Shot label */}
              <motion.text
                x={endPos.x}
                y={endPos.y + 4}
                textAnchor="middle"
                fill={shot.shotType === "six" ? "#000" : "#FFF"}
                fontSize="11"
                fontWeight="bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.4 }}
              >
                {getShotLabel(shot.shotType)}
              </motion.text>
            </g>
          );
        })}

        {/* Animating ball */}
        <AnimatePresence>
          {animatingShot && (
            <motion.circle
              cx={250}
              cy={268}
              r="7"
              fill="url(#ballGradient)"
              stroke="#FEE2E2"
              strokeWidth="1"
              initial={{ cx: 250, cy: 268 }}
              animate={{
                cx: getShotEndPosition(animatingShot).x,
                cy: getShotEndPosition(animatingShot).y,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              filter="url(#glow)"
            />
          )}
        </AnimatePresence>

        {/* Boundary rope */}
        <ellipse
          cx="250"
          cy="280"
          rx="230"
          ry="260"
          fill="none"
          stroke="#DC2626"
          strokeWidth="5"
          strokeDasharray="18,6"
          opacity="0.9"
        />
      </svg>

      {/* Shot Legend - Below the field */}
      <div className="mt-4 w-full max-w-4xl">
        <div className="rounded-xl bg-slate-800/90 border border-slate-700 p-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Info className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-300">Shot Type Legend</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { type: "six", label: "Six (6 runs)", color: "#FFD700", symbol: "6" },
              { type: "four", label: "Four (4 runs)", color: "#22C55E", symbol: "4" },
              { type: "triple", label: "Three (3 runs)", color: "#3B82F6", symbol: "3" },
              { type: "double", label: "Two (2 runs)", color: "#8B5CF6", symbol: "2" },
              { type: "single", label: "Single (1 run)", color: "#06B6D4", symbol: "1" },
              { type: "dot", label: "Dot (0 runs)", color: "#64748B", symbol: "•" },
              { type: "out", label: "Wicket (W)", color: "#EF4444", symbol: "W" },
            ].map((item) => (
              <div key={item.type} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white/30"
                  style={{ backgroundColor: item.color, color: item.type === "six" ? "#000" : "#FFF" }}
                >
                  {item.symbol}
                </div>
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Field Position Abbreviations */}
      <div className="mt-3 w-full max-w-4xl">
        <div className="rounded-xl bg-slate-800/70 border border-slate-700 p-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-400">Field Position Abbreviations</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span><strong className="text-slate-300">3M</strong>=Third Man</span>
            <span><strong className="text-slate-300">SL</strong>=Slip</span>
            <span><strong className="text-slate-300">GU</strong>=Gully</span>
            <span><strong className="text-slate-300">PT</strong>=Point</span>
            <span><strong className="text-slate-300">CV</strong>=Cover</span>
            <span><strong className="text-slate-300">EC</strong>=Extra Cover</span>
            <span><strong className="text-slate-300">MO</strong>=Mid Off</span>
            <span><strong className="text-slate-300">LO</strong>=Long Off</span>
            <span><strong className="text-slate-300">ST</strong>=Straight</span>
            <span><strong className="text-slate-300">LN</strong>=Long On</span>
            <span><strong className="text-slate-300">MN</strong>=Mid On</span>
            <span><strong className="text-slate-300">MW</strong>=Mid Wicket</span>
            <span><strong className="text-slate-300">SQ</strong>=Square Leg</span>
            <span><strong className="text-slate-300">LG</strong>=Leg Gully</span>
            <span><strong className="text-slate-300">FL</strong>=Fine Leg</span>
            <span><strong className="text-slate-300">LS</strong>=Leg Slip</span>
            <span><strong className="text-slate-300">WK</strong>=Wicket Keeper</span>
            <span><strong className="text-slate-300">B</strong>=Batsman</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Player Card for drag and drop
export function PlayerCard({ 
  player, 
  onDragStart,
  isDragging 
}: { 
  player: PlayerForField; 
  onDragStart?: (player: PlayerForField) => void;
  isDragging?: boolean;
}) {
  const colors = getRoleColor(player.role);
  
  return (
    <motion.div
      draggable
      onDragStart={() => onDragStart?.(player)}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all",
        "bg-slate-700/50 hover:bg-slate-700 border border-slate-600",
        isDragging && "opacity-50"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: colors.bg, border: `2px solid ${colors.border}` }}
      >
        {player.image ? (
          <img src={player.image} alt={player.name} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-white">{getInitials(player.name)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{player.name}</p>
        <p className="text-[10px] text-slate-400 capitalize">{player.role}</p>
      </div>
      <GripVertical className="h-4 w-4 text-slate-500" />
    </motion.div>
  );
}

export default InteractiveCricketField;
