"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const dropdownContent = isOpen && mounted && (
    <div
      ref={dropdownRef}
      className="fixed max-h-60 overflow-auto rounded-lg border border-slate-600 bg-slate-900 py-1 shadow-2xl"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 99999,
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            onChange(option.value);
            setIsOpen(false);
          }}
          className={cn(
            "flex w-full items-center px-3 py-2 text-left text-sm transition-colors",
            option.value === value
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-white hover:bg-slate-700"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={cn("relative", className)}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-left text-sm text-white transition-colors",
          "hover:border-indigo-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
          isOpen && "border-indigo-500 ring-1 ring-indigo-500"
        )}
      >
        <span className={!selectedOption ? "text-slate-500" : ""}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {mounted && createPortal(dropdownContent, document.body)}
    </div>
  );
}

interface FilterBarProps {
  seasons: number[];
  teams: string[];
  selectedSeason: string;
  selectedTeam: string;
  onSeasonChange: (value: string) => void;
  onTeamChange: (value: string) => void;
  className?: string;
}

export function FilterBar({
  seasons,
  teams,
  selectedSeason,
  selectedTeam,
  onSeasonChange,
  onTeamChange,
  className,
}: FilterBarProps) {
  const seasonOptions = [
    { value: "all", label: "All Seasons" },
    ...seasons.map((s) => ({ value: String(s), label: `Season ${s}` })),
  ];

  const teamOptions = [
    { value: "all", label: "All Teams" },
    ...teams.map((t) => ({ value: t, label: t.replace(" (NPL)", "") })),
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      <Select
        label="Season"
        value={selectedSeason}
        onChange={onSeasonChange}
        options={seasonOptions}
        className="w-40"
      />
      <Select
        label="Team"
        value={selectedTeam}
        onChange={onTeamChange}
        options={teamOptions}
        className="w-56"
      />
    </div>
  );
}
