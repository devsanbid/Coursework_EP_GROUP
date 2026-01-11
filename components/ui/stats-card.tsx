"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  color?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  color = "bg-gradient-to-br from-indigo-500 to-purple-600",
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 text-white shadow-lg",
        color,
        className
      )}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/80">{title}</p>
          {Icon && <Icon className="h-5 w-5 text-white/60" />}
        </div>
        <p className="mt-2 text-3xl font-bold">{value}</p>
        {subtitle && (
          <p className="mt-1 text-sm text-white/70">{subtitle}</p>
        )}
        {trend && (
          <div
            className={cn(
              "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trend.isPositive
                ? "bg-green-500/20 text-green-200"
                : "bg-red-500/20 text-red-200"
            )}
          >
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      {/* Decorative elements */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5" />
    </motion.div>
  );
}

interface MiniStatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
}

export function MiniStatsCard({ label, value, icon: Icon, className }: MiniStatsCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl bg-slate-800/50 p-4 backdrop-blur-sm",
        className
      )}
    >
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20">
          <Icon className="h-5 w-5 text-indigo-400" />
        </div>
      )}
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
