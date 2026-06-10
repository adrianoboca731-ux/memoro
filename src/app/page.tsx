"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Header } from "@/components/header";
import { PhotoGrid } from "@/components/photo-grid";
import { PhotoDetail } from "@/components/photo-detail";
import { UploadModal } from "@/components/upload-modal";
import { AlbumsView } from "@/components/albums-view";
import { GroupsView } from "@/components/groups-view";
import { GalleriesView } from "@/components/galleries-view";
import { MessagesView } from "@/components/messages-view";
import { NotificationsView } from "@/components/notifications-view";
import { Compass, Heart, Clock, Image as ImageIcon, BarChart3, Users, Film } from "lucide-react";

export default function HomePage() {
  const {
    currentView, photos, searchQuery, isLoadingPhotos,
    setPhotos, setAlbums, setStats, setLoadingPhotos,
    setGroups, setGalleries, setMessages, setNotifications, setUnreadNotifications,
    stats,
  } = useAppStore();

  const fetchPhotos = useCallback(async () => {
    setLoadingPhotos(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/photos?${params.toString()}`);
      if (res.ok) setPhotos(await res.json());
    } catch {} finally { setLoadingPhotos(false); }
  }, [searchQuery, setPhotos, setLoadingPhotos]);

  const fetchAlbums = useCallback(async () => {
    try { const res = await fetch("/api/albums"); if (res.ok) setAlbums(await res.json()); } catch {}
  }, [setAlbums]);

  const fetchStats = useCallback(async () => {
    try { const res = await fetch("/api/stats"); if (res.ok) setStats(await res.json()); } catch {}
  }, [setStats]);

  const fetchGroups = useCallback(async () => {
    try { const res = await fetch("/api/groups"); if (res.ok) setGroups(await res.json()); } catch {}
  }, [setGroups]);

  const fetchGalleries = useCallback(async () => {
    try { const res = await fetch("/api/galleries"); if (res.ok) setGalleries(await res.json()); } catch {}
  }, [setGalleries]);

  const fetchMessages = useCallback(async () => {
    try { const res = await fetch("/api/messages"); if (res.ok) setMessages(await res.json()); } catch {}
  }, [setMessages]);

  const fetchNotifications = useCallback(async () => {
    try { const res = await fetch("/api/notifications"); if (res.ok) { const d = await res.json(); setNotifications(d.notifications); setUnreadNotifications(d.unreadCount); } } catch {}
  }, [setNotifications, setUnreadNotifications]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);
  useEffect(() => { fetchAlbums(); }, [fetchAlbums]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchGroups(); }, [fetchGroups]);
  useEffect(() => { fetchGalleries(); }, [fetchGalleries]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const getFilteredPhotos = () => {
    switch (currentView) {
      case "favorites": return photos.filter(p => p.isFavorited);
      case "recent": return [...photos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);
      case "search": return photos;
      default: return photos;
    }
  };

  const filteredPhotos = getFilteredPhotos();
  const getViewTitle = () => {
    switch (currentView) {
      case "home": return { title: "Photostream", icon: Compass, desc: "Le tue foto" };
      case "favorites": return { title: "Preferiti", icon: Heart, desc: "Le tue foto preferite" };
      case "recent": return { title: "Recenti", icon: Clock, desc: "Le foto più recenti" };
      case "camera-roll": return { title: "Rullino", icon: Film, desc: "Tutte le foto in ordine cronologico" };
      case "search": return { title: `Risultati per "${searchQuery}"`, icon: ImageIcon, desc: `${filteredPhotos.length} foto trovate` };
      default: return { title: "Esplora", icon: Compass, desc: "Scopri foto straordinarie" };
    }
  };
  const viewInfo = getViewTitle();
  const ViewIcon = viewInfo.icon;

  if (currentView === "albums") return <div className="min-h-screen bg-[#212124]"><Header /><AlbumsView /><PhotoDetail /><UploadModal /></div>;
  if (currentView === "groups") return <div className="min-h-screen bg-[#212124]"><Header /><GroupsView /><PhotoDetail /><UploadModal /></div>;
  if (currentView === "galleries") return <div className="min-h-screen bg-[#212124]"><Header /><GalleriesView /><PhotoDetail /><UploadModal /></div>;
  if (currentView === "messages") return <div className="min-h-screen bg-[#212124]"><Header /><MessagesView /></div>;
  if (currentView === "notifications") return <div className="min-h-screen bg-[#212124]"><Header /><NotificationsView /></div>;

  return (
    <div className="min-h-screen bg-[#212124]">
      <Header />
      <div className="border-b border-white/5 bg-[#1a1a1d]">
        <div className="flex items-center gap-6 px-4 py-2 text-xs text-white/30">
          <span className="flex items-center gap-1.5"><BarChart3 className="h-3 w-3" />{stats.totalPhotos} foto</span>
          <span className="flex items-center gap-1.5"><ImageIcon className="h-3 w-3" />{stats.totalAlbums} album</span>
          <span className="flex items-center gap-1.5"><Heart className="h-3 w-3" />{photos.filter(p => p.isFavorited).length} preferiti</span>
          <span className="flex items-center gap-1.5"><Users className="h-3 w-3" />{stats.totalUsers || 0} persone</span>
        </div>
      </div>
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <ViewIcon className="h-5 w-5 text-[#ff0084]" />
          <h1 className="text-lg font-bold text-white">{viewInfo.title}</h1>
        </div>
        <p className="text-sm text-white/30 mt-0.5">{viewInfo.desc}</p>
      </div>
      <PhotoGrid photos={filteredPhotos} loading={isLoadingPhotos} />
      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="text-[#ff0084]">Memoro</span> — Condividi i Tuoi Ricordi • 1TB Gratuito
      </footer>
      <PhotoDetail />
      <UploadModal />
    </div>
  );
}
