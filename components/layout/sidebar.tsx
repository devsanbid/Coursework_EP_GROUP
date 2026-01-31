"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  Search,
  TrendingUp,
  Lightbulb,
  Menu,
  X,
  Target,
  Trophy,
} from "lucide-react";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Shot Analyzer", href: "/", icon: Target, description: "Interactive cricket field analysis" },
  { name: "Descriptive", href: "/descriptive", icon: BarChart3, description: "What happened?" },
  { name: "Diagnostics", href: "/diagnostics", icon: Search, description: "Why did it happen?" },
  { name: "Predictive", href: "/predictive", icon: TrendingUp, description: "What will happen?" },
  { name: "Prescriptive", href: "/prescriptive", icon: Lightbulb, description: "What should we do?" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-slate-800 p-2 text-white lg:hidden"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 flex-shrink-0",
          "transition-transform duration-300 ease-in-out",
          // Desktop: fixed positioning
          "lg:fixed lg:inset-y-0 lg:left-0 lg:translate-x-0 lg:z-30",
          // Mobile: fixed positioning with slide animation
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40",
          isMobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-slate-700/50 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">NPL Analytics</h1>
              <p className="text-xs text-slate-400">Nepal Premier League</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "group relative flex flex-col rounded-xl px-4 py-3 transition-all",
                    isActive
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute left-0 h-full w-1 rounded-r-full bg-indigo-500"
                      transition={{ type: "spring", duration: 0.5 }}
                    />
                  )}
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isActive
                          ? "text-indigo-400"
                          : "text-slate-500 group-hover:text-white"
                      )}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <p className="ml-8 text-xs text-slate-500 mt-1">{item.description}</p>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-700/50 p-4">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4">
              <p className="text-xs font-medium text-indigo-400">
                Analytics Dashboard
              </p>
              <p className="mt-1 text-xs text-slate-400">
                NPL Season 1 & 2 • Advanced Analysis
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
