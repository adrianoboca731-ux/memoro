"use client";

import { useSession, signOut } from "next-auth/react";
import { Search, Upload, Bell, Mail, Camera, Menu, X, User, Settings, Image as ImageIcon, LayoutGrid, Heart, Film, LogOut, Users, Compass, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const { t } = useI18n();
  const [localSearch, setLocalSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (localSearch.trim()) {
        router.push(`/cerca?q=${encodeURIComponent(localSearch.trim())}`);
      }
    },
    [localSearch, router]
  );

  const mobileNavItems = [
    { href: `/persone/${(session?.user as any)?.username || ""}`, label: t("nav.you") },
    { href: "/esplora", label: t("nav.explore") },
    { href: "/album", label: t("nav.album") },
    { href: "/gruppi", label: t("nav.groups") },
    { href: "/gallerie", label: t("nav.galleries") },
    { href: "/preferiti", label: t("nav.favorites") },
    { href: "/rullino", label: t("nav.cameraRoll") },
    { href: "/chisiamo", label: t("nav.about") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#212124] dark:bg-[#212124] border-b border-white/10">
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Logo */}
        <Link
          href="/esplora"
          className="flex items-center gap-2 shrink-0"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded bg-gradient-to-br from-[#0063dc] to-[#ff0084]">
            <Camera className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent hidden sm:inline">
            memoro
          </span>
        </Link>
        <Link
          href="/chisiamo"
          className="shrink-0 hidden sm:block"
        >
          <span className="text-xs text-white/40 hover:text-white/70 transition-colors">
            {t("nav.about")}
          </span>
        </Link>

        {/* Left nav - Only when logged in */}
        {session?.user && (
          <nav className="hidden md:flex items-center gap-0.5 ml-2">
            <Link href="/esplora">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-sm text-white/60 hover:text-white hover:bg-white/5"
              >
                <Compass className="h-4 w-4 mr-1" />
                {t("nav.explore")}
              </Button>
            </Link>
            <Link href="/carica">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-sm text-white/60 hover:text-white hover:bg-white/5 gap-1.5"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden lg:inline">{t("nav.upload")}</span>
              </Button>
            </Link>
          </nav>
        )}

        {/* Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-lg mx-auto"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              ref={searchInputRef}
              placeholder={t("nav.searchPlaceholder")}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-8 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-white/20 rounded-full"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 text-[10px] font-medium text-white/30">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Right side - Authenticated */}
        {session?.user ? (
          <div className="flex items-center gap-0.5 shrink-0">
            <Link href="/notifiche">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 relative text-white/60 hover:text-white hover:bg-white/5"
              >
                <Bell className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/messaggi">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 relative text-white/60 hover:text-white hover:bg-white/5"
              >
                <Mail className="h-4 w-4" />
              </Button>
            </Link>
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={(session.user as any).image || undefined}
                      alt={session.user.name || ""}
                    />
                    <AvatarFallback className="bg-[#0063dc] text-white text-xs">
                      {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-[#2a2a2d] border-white/10"
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-white/50">
                    @{(session.user as any).username || t("common.user")}
                  </p>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                  onClick={() => router.push(`/persone/${(session.user as any).username || ""}`)}
                >
                  <User className="h-4 w-4 mr-2" />
                  {t("nav.yourProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                  onClick={() => router.push("/album")}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {t("nav.yourAlbums")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                  onClick={() => router.push("/gallerie")}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  {t("nav.yourGalleries")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                  onClick={() => router.push("/gruppi")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {t("nav.yourGroups")}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                  onClick={() => router.push("/rullino")}
                >
                  <Film className="h-4 w-4 mr-2" />
                  {t("nav.cameraRoll")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                  onClick={() => router.push("/preferiti")}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  {t("nav.favorites")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                  onClick={() => router.push("/impostazioni")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {t("nav.settings")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                  onClick={() => router.push("/chisiamo")}
                >
                  <Info className="h-4 w-4 mr-2" />
                  {t("nav.about")}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className="text-red-400 focus:text-red-300 focus:bg-white/5 cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-white/60"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          /* Right side - Not authenticated */
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />
            <Link href="/auth/accedi">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/5"
              >
                {t("nav.login")}
              </Button>
            </Link>
            <Link href="/auth/registrati">
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white"
              >
                {t("nav.register")}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && session?.user && (
        <div className="md:hidden border-t border-white/10 px-3 py-2 flex gap-1 overflow-x-auto">
          {mobileNavItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-7 text-xs text-white/60"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
