import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return (wins / total) * 100;
}

export function getTeamShortName(fullName: string): string {
  const teamMap: Record<string, string> = {
    "Biratnagar Kings (NPL)": "BIK",
    "Janakpur Bolts (NPL)": "JAB",
    "Kathmandu Gurkhas (NPL)": "KAG",
    "Kathmandu Gorkhas (NPL)": "KAG",
    "Chitwan Rhinos (NPL)": "CHR",
    "Karnali Yaks (NPL)": "KAY",
    "Lumbini Lions (NPL)": "LUL",
    "Pokhara Avengers (NPL)": "POA",
    "Sudur Paschim Royals (NPL)": "SPR",
  };
  return teamMap[fullName] || fullName.substring(0, 3).toUpperCase();
}

export function getTeamColor(team: string): string {
  const colorMap: Record<string, string> = {
    "Biratnagar Kings (NPL)": "#E63946",
    "BIK": "#E63946",
    "Janakpur Bolts (NPL)": "#F4A261",
    "JAB": "#F4A261",
    "Kathmandu Gurkhas (NPL)": "#2A9D8F",
    "Kathmandu Gorkhas (NPL)": "#2A9D8F",
    "KAG": "#2A9D8F",
    "Chitwan Rhinos (NPL)": "#264653",
    "CHR": "#264653",
    "Karnali Yaks (NPL)": "#8338EC",
    "KAY": "#8338EC",
    "Lumbini Lions (NPL)": "#FB5607",
    "LUL": "#FB5607",
    "Pokhara Avengers (NPL)": "#3A86FF",
    "POA": "#3A86FF",
    "Sudur Paschim Royals (NPL)": "#FF006E",
    "SPR": "#FF006E",
  };
  return colorMap[team] || "#6B7280";
}

export function getPerformanceColor(rate: number): string {
  if (rate >= 70) return "text-green-500";
  if (rate >= 50) return "text-yellow-500";
  if (rate >= 30) return "text-orange-500";
  return "text-red-500";
}

export function getPerformanceBgColor(rate: number): string {
  if (rate >= 70) return "bg-green-500/20";
  if (rate >= 50) return "bg-yellow-500/20";
  if (rate >= 30) return "bg-orange-500/20";
  return "bg-red-500/20";
}
