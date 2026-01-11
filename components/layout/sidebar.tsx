"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  Trophy,
  Users,
  Target,
  TrendingUp,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Match Analysis", href: "/matches", icon: Trophy },
  { name: "Team Performance", href: "/teams", icon: BarChart3 },
  { name: "Player Stats", href: "/players", icon: Users },
  { name: "Cricket Field", href: "/field", icon: Target },
  { name: "Insights", href: "/insights", icon: TrendingUp },
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
          // Desktop: always visible, static positioning
          "lg:relative lg:translate-x-0",
          // Mobile: fixed positioning with slide animation
          "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40",
          isMobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
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
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
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
                  <item.icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive
                        ? "text-indigo-400"
                        : "text-slate-500 group-hover:text-white"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-700/50 p-4">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-4">
              <p className="text-xs font-medium text-indigo-400">
                Season 1 & 2 Data
              </p>
              <p className="mt-1 text-xs text-slate-400">
                64 Matches • 8 Teams • 100+ Players
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
