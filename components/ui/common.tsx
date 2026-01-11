"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-xl bg-slate-800/50 p-1 backdrop-blur-sm",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "text-white"
              : "text-slate-400 hover:text-white"
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-lg bg-indigo-500"
              transition={{ type: "spring", duration: 0.5 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  headerAction?: React.ReactNode;
}

export function Card({
  children,
  title,
  subtitle,
  className,
  headerAction,
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm",
        className
      )}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-400">{subtitle}</p>
            )}
          </div>
          {headerAction}
        </div>
      )}
      <div className="p-6 overflow-visible">{children}</div>
    </motion.div>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500",
          sizeClasses[size]
        )}
      />
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-slate-700 text-slate-300",
    success: "bg-green-500/20 text-green-400",
    warning: "bg-yellow-500/20 text-yellow-400",
    error: "bg-red-500/20 text-red-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
