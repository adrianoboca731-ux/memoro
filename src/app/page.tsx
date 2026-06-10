"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Header } from "@/components/header";
import { PhotoGrid } from "@/components/photo-grid";
import { PhotoDetail } from "@/components/photo-detail";
import { UploadModal } from "@/components/upload-modal";
import { AlbumsView } from "@/components/albums-view";
import { Image as ImageIcon, Heart, Clock, Compass, BarChart3 } from "lucide-react";

export default function HomePage() {
  const {
    currentView,
    photos,
    albums,
    searchQuery,
    isLoadingPhotos,
    isLoadingAlbums,
    setPhotos,
    setAlbums,
    setStats,
    setLoadingPhotos,
    setLoadingAlbums,
    stats,
  } = useAppStore();

  // Fetch photos
  const fetchPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/photos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch (err) {
      console.error("Failed to fetch photos:", err);
    } finally {
      setLoadingPhotos(false);
    }
  }, [searchQuery, setPhotos, setLoadingPhotos]);

  // Fetch albums
  const fetchAlbums = useCallback(async () => {
    setLoadingAlbums(true);
    try {
      const res = await fetch("/api/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data);
      }
    } catch (err) {
      console.error("Failed to fetch albums:", err);
    } finally {
      setLoadingAlbums(false);
    }
  }, [setAlbums, setLoadingAlbums]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [setStats]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Filter photos based on current view
  const getFilteredPhotos = () => {
    switch (currentView) {
      case "favorites":
        return photos.filter((p) => p.favorite);
      case "recent":
        return [...photos].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 20);
      case "search":
        return photos; // already filtered by API
      case "explore":
      default:
        return photos;
    }
  };

  const filteredPhotos = getFilteredPhotos();

  const getViewTitle = () => {
    switch (currentView) {
      case "favorites":
        return { title: "Preferiti", icon: Heart, desc: "Le tue foto preferite" };
      case "recent":
        return { title: "Recenti", icon: Clock, desc: "Le foto più recenti" };
      case "search":
        return {
          title: `Risultati per "${searchQuery}"`,
          icon: ImageIcon,
          desc: `${filteredPhotos.length} foto trovate`,
        };
      case "explore":
      default:
        return { title: "Esplora", icon: Compass, desc: "Scopri foto straordinarie" };
    }
  };

  const viewInfo = getViewTitle();
  const ViewIcon = viewInfo.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Stats bar */}
        <div className="border-b bg-muted/30">
          <div className="flex items-center gap-6 px-4 py-2 text-xs text-muted-foreground overflow-x-auto">
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <BarChart3 className="h-3.5 w-3.5" />
              {stats.totalPhotos} foto
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <ImageIcon className="h-3.5 w-3.5" />
              {stats.totalAlbums} album
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Heart className="h-3.5 w-3.5" />
              {photos.filter((p) => p.favorite).length} preferiti
            </span>
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <Compass className="h-3.5 w-3.5" />
              {stats.totalViews.toLocaleString()} visualizzazioni
            </span>
          </div>
        </div>

        {currentView === "albums" ? (
          <AlbumsView />
        ) : (
          <div>
            {/* View header */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <ViewIcon className="h-5 w-5 text-[#0063dc]" />
                <h1 className="text-lg font-bold">{viewInfo.title}</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{viewInfo.desc}</p>
            </div>

            {/* Photo grid */}
            <PhotoGrid photos={filteredPhotos} loading={isLoadingPhotos} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-4 px-4 text-center text-xs text-muted-foreground mt-auto">
        <span className="text-[#ff0084]">Memoro</span> — Condividi i Tuoi Ricordi
      </footer>

      {/* Overlays */}
      <PhotoDetail />
      <UploadModal />
    </div>
  );
}
