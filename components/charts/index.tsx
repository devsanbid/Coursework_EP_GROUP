"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { getTeamColor } from "@/lib/utils";

const COLORS = [
  "#E63946", "#F4A261", "#2A9D8F", "#264653", "#8338EC",
  "#FB5607", "#3A86FF", "#FF006E", "#38B000", "#9B5DE5"
];

interface ChartProps {
  data: Record<string, string | number>[];
  className?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/95 p-3 shadow-xl backdrop-blur-sm">
        <p className="mb-2 text-sm font-medium text-white">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Win/Loss Bar Chart
interface WinLossBarChartProps extends ChartProps {
  showTies?: boolean;
}

export function WinLossBarChart({ data, showTies = false, className }: WinLossBarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9CA3AF" 
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => <span className="text-slate-300">{value}</span>}
          />
          <Bar dataKey="wins" name="Wins" fill="#22C55E" radius={[4, 4, 0, 0]} />
          <Bar dataKey="losses" name="Losses" fill="#EF4444" radius={[4, 4, 0, 0]} />
          {showTies && <Bar dataKey="ties" name="Ties" fill="#F59E0B" radius={[4, 4, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Stacked Bar Chart for Team Contribution
interface StackedBarChartProps extends ChartProps {
  keys: string[];
  colors?: string[];
}

export function StackedBarChart({ data, keys, colors = COLORS, className }: StackedBarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => <span className="text-slate-300">{value}</span>}
          />
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={colors[index % colors.length]}
              radius={index === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Win Rate Pie Chart
interface WinRatePieChartProps {
  wins: number;
  losses: number;
  ties?: number;
  className?: string;
}

export function WinRatePieChart({ wins, losses, ties = 0, className }: WinRatePieChartProps) {
  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
    ...(ties > 0 ? [{ name: "Ties", value: ties }] : []),
  ];
  const pieColors = ["#22C55E", "#EF4444", "#F59E0B"];

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={pieColors[index]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom"
            formatter={(value) => <span className="text-slate-300 text-sm">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Player Comparison Radar Chart
interface RadarChartProps {
  data: { subject: string; player1: number; player2?: number; fullMark: number }[];
  player1Name: string;
  player2Name?: string;
  className?: string;
}

export function PlayerRadarChart({ data, player1Name, player2Name, className }: RadarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
          <Radar
            name={player1Name}
            dataKey="player1"
            stroke="#8338EC"
            fill="#8338EC"
            fillOpacity={0.4}
          />
          {player2Name && (
            <Radar
              name={player2Name}
              dataKey="player2"
              stroke="#3A86FF"
              fill="#3A86FF"
              fillOpacity={0.4}
            />
          )}
          <Legend 
            formatter={(value) => <span className="text-slate-300">{value}</span>}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Performance Trend Line Chart
interface TrendChartProps extends ChartProps {
  dataKey: string;
  color?: string;
}

export function TrendLineChart({ data, dataKey, color = "#8338EC", className }: TrendChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill="url(#colorGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Pareto Chart (Top Contributors)
interface ParetoChartProps extends ChartProps {
  valueKey: string;
  cumulativeKey: string;
}

export function ParetoChart({ data, valueKey, cumulativeKey, className }: ParetoChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis yAxisId="left" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: "20px" }}
            formatter={(value) => <span className="text-slate-300">{value}</span>}
          />
          <Bar yAxisId="left" dataKey={valueKey} fill="#8338EC" radius={[4, 4, 0, 0]} name="Contribution" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={cumulativeKey}
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: "#F59E0B" }}
            name="Cumulative %"
          />
          <ReferenceLine yAxisId="right" y={80} stroke="#EF4444" strokeDasharray="3 3" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Horizontal Bar Chart for Rankings
interface HorizontalBarChartProps extends ChartProps {
  valueKey: string;
  maxValue?: number;
}

export function HorizontalBarChart({ data, valueKey, maxValue, className }: HorizontalBarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
          <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={[0, maxValue || 'auto']} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={valueKey} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Team Colors Bar Chart
interface TeamBarChartProps extends ChartProps {
  valueKey: string;
}

export function TeamBarChart({ data, valueKey, className }: TeamBarChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={valueKey} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getTeamColor(entry.name as string)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Heatmap-style chart for scoring zones
interface HeatmapData {
  zone: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  className?: string;
}

export function HeatmapChart({ data, className }: HeatmapChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  const getHeatColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity > 0.8) return "#DC2626";
    if (intensity > 0.6) return "#EA580C";
    if (intensity > 0.4) return "#F59E0B";
    if (intensity > 0.2) return "#84CC16";
    return "#22C55E";
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="zone" 
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getHeatColor(entry.value)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
