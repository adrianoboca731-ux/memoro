"use client";

import { useAppStore, ViewType } from "@/lib/store";
import { Search, Upload, Bell, Mail, Camera, Menu, X, User, Users, Compass, LayoutGrid, Image as ImageIcon, Clock, Heart, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useCallback } from "react";
import Link from "next/link";

const mainNav: { key: ViewType; label: string }[] = [
  { key: "home", label: "Tu" },
  { key: "explore", label: "Esplora" },
  { key: "groups", label: "Gruppi" },
];

const youNav: { key: ViewType; label: string; icon: any }[] = [
  { key: "home", label: "Photostream", icon: Compass },
  { key: "albums", label: "Album", icon: ImageIcon },
  { key: "galleries", label: "Gallerie", icon: LayoutGrid },
  { key: "favorites", label: "Preferiti", icon: Heart },
  { key: "camera-roll", label: "Rullino", icon: Film },
  { key: "recent", label: "Recenti", icon: Clock },
  { key: "people", label: "Persone", icon: Users },
];

export function Header() {
  const { currentView, setCurrentView, toggleUpload, unreadNotifications, unreadMessages, searchQuery, setSearchQuery } = useAppStore();
  const [localSearch, setLocalSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [youDropdownOpen, setYouDropdownOpen] = useState(false);

  const handleSearch = useCallback((value: string) => {
    setLocalSearch(value);
    if (value) setSearchQuery(value);
  }, [setSearchQuery]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch) setSearchQuery(localSearch);
  }, [localSearch, setSearchQuery]);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#212124] border-b border-white/10">
      <div className="flex items-center h-12 px-4 gap-3">
        {/* Logo */}
        <button onClick={() => setCurrentView('explore')} className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-[#0063dc]">
            <Camera className="h-4 w-4 text-white" />
          </div>
          <span className="text-[#ff0084] font-bold text-base hidden sm:inline">Memoro</span>
        </button>

        {/* Main nav */}
        <nav className="hidden md:flex items-center gap-0.5 ml-2">
          {mainNav.map((item) => (
            <Button key={item.key} variant="ghost" size="sm"
              className={`h-8 text-sm ${currentView === item.key ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"}`}
              onClick={() => setCurrentView(item.key)}>
              {item.label}
            </Button>
          ))}
          {/* Tu dropdown */}
          <div className="relative">
            <Button variant="ghost" size="sm"
              className="h-8 text-sm text-white/60 hover:text-white hover:bg-white/5 gap-0.5"
              onClick={() => setYouDropdownOpen(!youDropdownOpen)}
              onMouseEnter={() => setYouDropdownOpen(true)}>
              Tu ▾
            </Button>
            {youDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-[#2a2a2d] border border-white/10 rounded-lg shadow-xl py-1 z-50"
                onMouseLeave={() => setYouDropdownOpen(false)}>
                {youNav.map((item) => (
                  <button key={item.key}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5"
                    onClick={() => { setCurrentView(item.key); setYouDropdownOpen(false); }}>
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input placeholder="Foto, persone o gruppi" value={localSearch} onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-8 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-white/20" />
          </div>
        </form>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="sm" className="h-8 text-white/60 hover:text-white hover:bg-white/5 gap-1.5" onClick={toggleUpload}>
            <Upload className="h-4 w-4" />
            <span className="hidden lg:inline text-sm">Carica</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 relative text-white/60 hover:text-white hover:bg-white/5" onClick={() => setCurrentView('notifications')}>
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 text-[9px] bg-[#ff0084] text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 relative text-white/60 hover:text-white hover:bg-white/5" onClick={() => setCurrentView('messages')}>
            <Mail className="h-4 w-4" />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 text-[9px] bg-[#0063dc] text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Button>
          <Link href="/login" className="w-8 h-8 rounded-full bg-[#0063dc] flex items-center justify-center ml-1">
            <User className="h-4 w-4 text-white" />
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8 text-white/60" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 px-3 py-2 flex gap-1 overflow-x-auto">
          {[...mainNav, ...youNav].map((item) => (
            <Button key={item.key} variant="ghost" size="sm"
              className={`shrink-0 h-7 text-xs ${currentView === item.key ? "text-white bg-white/10" : "text-white/60"}`}
              onClick={() => { setCurrentView(item.key); setMobileMenuOpen(false); }}>
              {item.label}
            </Button>
          ))}
        </div>
      )}
    </header>
  );
}
