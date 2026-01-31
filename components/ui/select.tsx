"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  searchable = false,
  searchPlaceholder = "Search...",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 300; // Approximate max height
      const dropdownWidth = Math.max(rect.width, 250);
      
      // Calculate if dropdown should appear above or below
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      
      // Calculate left position, ensuring it doesn't go off-screen
      let left = rect.left;
      if (left + dropdownWidth > viewportWidth) {
        left = Math.max(10, viewportWidth - dropdownWidth - 10);
      }
      
      setDropdownPosition({
        top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: left,
        width: rect.width,
      });
      
      // Focus search input when dropdown opens
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    } else {
      setSearchQuery("");
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find((opt) => opt.value === value);
  
  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter((opt) => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const dropdownContent = isOpen && mounted && (
    <div
      ref={dropdownRef}
      className="fixed rounded-lg border border-slate-600 bg-slate-900 shadow-2xl overflow-hidden"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: Math.max(dropdownPosition.width, 250),
        maxWidth: "calc(100vw - 20px)",
        maxHeight: "300px",
        zIndex: 99999,
      }}
    >
      {/* Search Input */}
      {searchable && (
        <div className="sticky top-0 bg-slate-900 p-2 border-b border-slate-700 z-10">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-md bg-slate-800 border border-slate-600 py-2 pl-9 pr-9 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Options List */}
      <div className="max-h-[200px] overflow-y-auto overflow-x-hidden">
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-4 text-sm text-slate-500 text-center">
            No results found
          </div>
        ) : (
          filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center px-3 py-2.5 text-left text-sm transition-colors",
                option.value === value
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-white hover:bg-slate-700"
              )}
            >
              {option.label}
            </button>
          ))
        )}
      </div>
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
