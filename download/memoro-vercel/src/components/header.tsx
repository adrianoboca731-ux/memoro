"use client";

import { useAppStore, ViewType } from "@/lib/store";
import { Camera, Search, Upload, Sun, Moon, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useState, useCallback, useSyncExternalStore } from "react";

const navItems: { key: ViewType; label: string }[] = [
  { key: "explore", label: "Esplora" },
  { key: "albums", label: "Album" },
  { key: "favorites", label: "Preferiti" },
  { key: "recent", label: "Recenti" },
];

export function Header() {
  const { currentView, setCurrentView, setSearchQuery, toggleUpload, searchQuery } = useAppStore();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = useCallback(
    (value: string) => {
      setLocalSearch(value);
      setSearchQuery(value);
    },
    [setSearchQuery]
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0063dc]">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:inline">
            <span className="text-[#0063dc]">creami</span>{" "}
            <span className="text-[#ff0084]">Memoro</span>
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca foto, tag, album..."
              value={localSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Button
              key={item.key}
              variant={currentView === item.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentView(item.key)}
              className={
                currentView === item.key
                  ? "bg-[#0063dc] hover:bg-[#0052b5] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              {item.label}
            </Button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={toggleUpload}
            size="sm"
            className="bg-[#0063dc] hover:bg-[#0052b5] text-white gap-1.5"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Carica</span>
          </Button>

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t px-4 py-2 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Button
              key={item.key}
              variant={currentView === item.key ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setCurrentView(item.key);
                setMobileMenuOpen(false);
              }}
              className={
                currentView === item.key
                  ? "bg-[#0063dc] hover:bg-[#0052b5] text-white shrink-0"
                  : "text-muted-foreground shrink-0"
              }
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}
    </header>
  );
}
