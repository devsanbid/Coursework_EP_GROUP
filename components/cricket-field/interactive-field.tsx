"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";

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
}

// Field zones with realistic positions
const fieldZones = [
  { id: "third_man", name: "Third Man", cx: 420, cy: 80, angle: -60 },
  { id: "slip", name: "Slip", cx: 350, cy: 140, angle: -45 },
  { id: "gully", name: "Gully", cx: 400, cy: 160, angle: -30 },
  { id: "point", name: "Point", cx: 450, cy: 220, angle: 0 },
  { id: "cover", name: "Cover", cx: 460, cy: 300, angle: 30 },
  { id: "extra_cover", name: "Extra Cover", cx: 440, cy: 380, angle: 50 },
  { id: "mid_off", name: "Mid Off", cx: 380, cy: 450, angle: 70 },
  { id: "long_off", name: "Long Off", cx: 300, cy: 520, angle: 90 },
  { id: "straight", name: "Straight", cx: 250, cy: 540, angle: 100 },
  { id: "long_on", name: "Long On", cx: 200, cy: 520, angle: 110 },
  { id: "mid_on", name: "Mid On", cx: 120, cy: 450, angle: 130 },
  { id: "mid_wicket", name: "Mid Wicket", cx: 60, cy: 380, angle: 150 },
  { id: "square_leg", name: "Square Leg", cx: 40, cy: 300, angle: 180 },
  { id: "leg_gully", name: "Leg Gully", cx: 50, cy: 220, angle: 200 },
  { id: "fine_leg", name: "Fine Leg", cx: 80, cy: 140, angle: 225 },
  { id: "leg_slip", name: "Leg Slip", cx: 150, cy: 140, angle: 240 },
  { id: "behind_wicket", name: "Behind Wicket", cx: 250, cy: 100, angle: 270 },
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

export function InteractiveCricketField({
  batsman,
  shots,
  fielders,
  onFielderMove,
  onZoneClick,
  selectedZone,
  showAnimation = true,
  className,
}: InteractiveCricketFieldProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [animatingShot, setAnimatingShot] = useState<ShotData | null>(null);
  const [draggingFielder, setDraggingFielder] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate shot end position based on angle and distance
  const getShotEndPosition = useCallback((shot: ShotData) => {
    const centerX = 250;
    const centerY = 280;
    const maxDistance = 220;
    const normalizedDistance = (shot.distance / 100) * maxDistance;
    
    const angleRad = (shot.angle - 90) * (Math.PI / 180);
    const endX = centerX + Math.cos(angleRad) * normalizedDistance;
    const endY = centerY + Math.sin(angleRad) * normalizedDistance;
    
    return { x: endX, y: endY };
  }, []);

  // Handle fielder drag
  const handleFielderDrag = useCallback((e: React.MouseEvent, fielderId: string) => {
    if (!svgRef.current || !onFielderMove) return;
    
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    const fielder = fielders.find(f => f.id === fielderId);
    if (fielder) {
      onFielderMove({
        ...fielder,
        x: svgP.x,
        y: svgP.y,
      });
    }
  }, [fielders, onFielderMove]);

  // Animate a shot
  const animateShot = useCallback((shot: ShotData) => {
    setAnimatingShot(shot);
    setTimeout(() => setAnimatingShot(null), 1500);
  }, []);

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
    <div className={cn("relative", className)}>
      <svg
        ref={svgRef}
        viewBox="0 0 500 600"
        className="w-full max-w-2xl mx-auto"
        style={{ filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))" }}
      >
        {/* Definitions */}
        <defs>
          {/* Grass gradient */}
          <radialGradient id="grassGradient" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="40%" stopColor="#16A34A" />
            <stop offset="70%" stopColor="#15803D" />
            <stop offset="100%" stopColor="#166534" />
          </radialGradient>
          
          {/* Outfield gradient */}
          <radialGradient id="outfieldGradient" cx="50%" cy="45%" r="60%">
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
        </defs>

        {/* Main field (oval) */}
        <ellipse
          cx="250"
          cy="300"
          rx="240"
          ry="280"
          fill="url(#outfieldGradient)"
          stroke="#0D9488"
          strokeWidth="4"
        />

        {/* Inner grass area */}
        <ellipse
          cx="250"
          cy="300"
          rx="220"
          ry="260"
          fill="url(#grassGradient)"
        />

        {/* Grass texture lines */}
        {[...Array(12)].map((_, i) => (
          <ellipse
            key={`grass-line-${i}`}
            cx="250"
            cy="300"
            rx={220 - i * 18}
            ry={260 - i * 21}
            fill="none"
            stroke="rgba(34, 197, 94, 0.15)"
            strokeWidth="8"
          />
        ))}

        {/* 30-yard circle */}
        <ellipse
          cx="250"
          cy="300"
          rx="110"
          ry="130"
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="2"
          strokeDasharray="8,4"
        />

        {/* Inner circle (close catching area) */}
        <ellipse
          cx="250"
          cy="280"
          rx="50"
          ry="60"
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* Pitch */}
        <rect
          x="232"
          y="240"
          width="36"
          height="80"
          rx="2"
          fill="url(#pitchGradient)"
          stroke="#8B7355"
          strokeWidth="1"
        />

        {/* Pitch markings */}
        <line x1="232" y1="255" x2="268" y2="255" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="232" y1="305" x2="268" y2="305" stroke="#FFFFFF" strokeWidth="2" />
        
        {/* Crease lines */}
        <line x1="220" y1="255" x2="280" y2="255" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="220" y1="305" x2="280" y2="305" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="248" y1="255" x2="248" y2="245" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="252" y1="255" x2="252" y2="245" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="248" y1="305" x2="248" y2="315" stroke="#FFFFFF" strokeWidth="2" />
        <line x1="252" y1="305" x2="252" y2="315" stroke="#FFFFFF" strokeWidth="2" />

        {/* Stumps */}
        {[244, 248, 252, 256].map((x, i) => (
          <g key={`stump-top-${i}`}>
            <rect x={x} y="248" width="2" height="12" fill="#DDD" rx="1" />
          </g>
        ))}
        {[244, 248, 252, 256].map((x, i) => (
          <g key={`stump-bottom-${i}`}>
            <rect x={x} y="300" width="2" height="12" fill="#DDD" rx="1" />
          </g>
        ))}

        {/* Batsman position */}
        <g transform="translate(250, 280)">
          <circle r="12" fill="#1E40AF" stroke="#3B82F6" strokeWidth="2" filter="url(#shadow)" />
          <text y="4" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">B</text>
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
                r={isHovered || isSelected ? 32 : 28}
                fill={hasShots ? "rgba(34, 197, 94, 0.3)" : "rgba(100, 116, 139, 0.2)"}
                stroke={isSelected ? "#F59E0B" : isHovered ? "#3B82F6" : "rgba(148, 163, 184, 0.4)"}
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
              
              {/* Zone label */}
              <text
                x={zone.cx}
                y={zone.cy - 8}
                textAnchor="middle"
                fill="white"
                fontSize="9"
                fontWeight="500"
                style={{ pointerEvents: "none" }}
              >
                {zone.name}
              </text>
              
              {/* Shot count */}
              {stats.total > 0 && (
                <text
                  x={zone.cx}
                  y={zone.cy + 8}
                  textAnchor="middle"
                  fill="#22C55E"
                  fontSize="11"
                  fontWeight="bold"
                  style={{ pointerEvents: "none" }}
                >
                  {stats.runs}r ({stats.total})
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
                      x={zone.cx - 45}
                      y={zone.cy + 25}
                      width="90"
                      height="50"
                      rx="6"
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="#334155"
                    />
                    <text x={zone.cx} y={zone.cy + 42} textAnchor="middle" fill="#94A3B8" fontSize="9">
                      4s: {stats.fours} | 6s: {stats.sixes}
                    </text>
                    <text x={zone.cx} y={zone.cy + 56} textAnchor="middle" fill="#EF4444" fontSize="9">
                      Outs: {stats.outs}
                    </text>
                    <text x={zone.cx} y={zone.cy + 70} textAnchor="middle" fill="#22C55E" fontSize="9">
                      Total: {stats.runs} runs
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>
            </g>
          );
        })}

        {/* Fielder positions */}
        {fielders.map((fielder) => (
          <motion.g
            key={fielder.id}
            style={{ cursor: onFielderMove ? "grab" : "default" }}
            drag={!!onFielderMove}
            dragConstraints={svgRef}
            onDrag={(e) => handleFielderDrag(e as unknown as React.MouseEvent, fielder.id)}
            whileHover={{ scale: 1.2 }}
            whileDrag={{ scale: 1.3 }}
          >
            <circle
              cx={fielder.x}
              cy={fielder.y}
              r="14"
              fill="#7C3AED"
              stroke="#A78BFA"
              strokeWidth="2"
              filter="url(#shadow)"
            />
            <text
              x={fielder.x}
              y={fielder.y + 4}
              textAnchor="middle"
              fill="white"
              fontSize="8"
              fontWeight="bold"
            >
              {fielder.name.substring(0, 2).toUpperCase()}
            </text>
          </motion.g>
        ))}

        {/* Shot trajectories */}
        {shots.map((shot, index) => {
          const endPos = getShotEndPosition(shot);
          return (
            <g key={`shot-${shot.id}-${index}`}>
              {/* Shot line */}
              <motion.line
                x1={250}
                y1={280}
                x2={endPos.x}
                y2={endPos.y}
                stroke={getShotColor(shot.shotType)}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.6}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
              
              {/* Shot end point */}
              <motion.circle
                cx={endPos.x}
                cy={endPos.y}
                r="10"
                fill={getShotColor(shot.shotType)}
                stroke="white"
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
                filter="url(#glow)"
              />
              
              {/* Shot label */}
              <motion.text
                x={endPos.x}
                y={endPos.y + 4}
                textAnchor="middle"
                fill={shot.shotType === "six" ? "#000" : "#FFF"}
                fontSize="10"
                fontWeight="bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.4 }}
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
              cy={280}
              r="6"
              fill="url(#ballGradient)"
              stroke="#FEE2E2"
              strokeWidth="1"
              initial={{ cx: 250, cy: 280 }}
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
          cy="300"
          rx="235"
          ry="275"
          fill="none"
          stroke="#DC2626"
          strokeWidth="4"
          strokeDasharray="15,5"
          opacity="0.8"
        />

        {/* Legend */}
        <g transform="translate(20, 530)">
          <rect x="0" y="0" width="460" height="50" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#334155" />
          <text x="230" y="18" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">SHOT LEGEND</text>
          
          {[
            { type: "six", label: "Six", x: 40 },
            { type: "four", label: "Four", x: 110 },
            { type: "triple", label: "3 Runs", x: 180 },
            { type: "double", label: "2 Runs", x: 250 },
            { type: "single", label: "Single", x: 320 },
            { type: "out", label: "Out", x: 390 },
          ].map((item) => (
            <g key={item.type} transform={`translate(${item.x}, 35)`}>
              <circle r="8" fill={getShotColor(item.type as ShotData["shotType"])} />
              <text x="15" y="4" fill="#94A3B8" fontSize="9">{item.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

export default InteractiveCricketField;
