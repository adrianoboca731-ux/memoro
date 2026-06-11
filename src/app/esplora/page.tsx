"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { PhotoCard } from "@/components/photo-card";
import { EmptyState } from "@/components/empty-state";
import { Compass, TrendingUp, Eye, Clock, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type FilterType = "interesting" | "recent" | "popular";

export default function EsploraPage() {
  const { t } = useI18n();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("interesting");
  const [trendingTags, setTrendingTags] = useState<string[]>([]);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filter === "recent") params.set("sort", "createdAt");
      if (filter === "popular") params.set("sort", "views");
      const res = await fetch(`/api/photos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || data);
      }
    } catch (err) {
      console.error("Error loading photos:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  useEffect(() => {
    // Simulate trending tags
    setTrendingTags(["paesaggio", "ritratto", "natura", "città", "tramonto", "mare", "montagna", "fotografia", "architettura", "viaggio"]);
  }, []);

  const filters: { key: FilterType; label: string; icon: typeof Compass }[] = [
    { key: "interesting", label: t("explore.interesting"), icon: Compass },
    { key: "recent", label: t("explore.recent"), icon: Clock },
    { key: "popular", label: t("explore.popular"), icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Page header */}
        <div className="border-b border-white/5 bg-[#141416]">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Compass className="h-8 w-8 text-[#ff0084]" />
                {t("explore.title")}
              </h1>
              <p className="text-white/40 mt-1">{t("explore.subtitle")}</p>
            </motion.div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 mt-4">
              {filters.map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(f.key)}
                  className={
                    filter === f.key
                      ? "bg-white/10 text-white hover:bg-white/15"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }
                >
                  <f.icon className="h-4 w-4 mr-1.5" />
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Main photo grid */}
            <div className="flex-1">
              {loading ? (
                <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="break-inside-avoid">
                      <Skeleton
                        className="w-full rounded-lg bg-white/5"
                        style={{ height: `${150 + Math.random() * 200}px` }}
                      />
                    </div>
                  ))}
                </div>
              ) : photos.length === 0 ? (
                <EmptyState
                  icon={Camera}
                  title={t("explore.noPhotos")}
                  description={t("explore.noPhotosDesc")}
                />
              ) : (
                <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
                  {photos.map((photo, index) => (
                    <motion.div
                      key={photo.id}
                      className="break-inside-avoid"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
                    >
                      <PhotoCard photo={photo} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block w-72 shrink-0 space-y-6">
              {/* Trending */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-[#ff0084]" />
                  {t("explore.trending")}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {trendingTags.map((tag) => (
                    <Link key={tag} href={`/cerca?q=${tag}`}>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white/10 text-white/60 hover:bg-white/15 border-0 cursor-pointer"
                      >
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Most viewed today */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-[#0063dc]" />
                  {t("explore.mostViewedToday")}
                </h3>
                <div className="space-y-2">
                  {photos.slice(0, 5).map((photo) => (
                    <Link
                      key={photo.id}
                      href={`/foto/${photo.id}`}
                      className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80 transition-colors"
                    >
                      <img
                        src={photo.thumbnail || photo.filepath}
                        alt={photo.title}
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs">{photo.title}</p>
                        <p className="text-[10px] text-white/30">{photo.views} {t("explore.views")}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; {t("home.footerTagline")}</span>
      </footer>
    </div>
  );
}
