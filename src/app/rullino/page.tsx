"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import { Film, Camera, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it, enUS, fr, de as deLocale, es as esLocale, ptBR, ja, ko, zhTW, zhCN } from "date-fns/locale";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const dateLocales: Record<string, any> = { it, en: enUS, fr, de: deLocale, es: esLocale, "pt-BR": ptBR, ja, ko, "zh-TW": zhTW, "zh-CN": zhCN };

export default function RullinoPage() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const dateLocale = dateLocales[locale] || it;

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/photos?limit=200");
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || data);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) fetchPhotos();
  }, [session, fetchPhotos]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Group photos by date
  const groupedPhotos = photos.reduce((acc: Record<string, any[]>, photo) => {
    const dateKey = format(new Date(photo.createdAt), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(photo);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedPhotos).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <EmptyState
          icon={Film}
          title={t("cameraRoll.loginToSee")}
          description={t("cameraRoll.loginToSeeDesc")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Film className="h-8 w-8 text-[#0063dc]" />
                  {t("cameraRoll.title")}
                </h1>
                <p className="text-white/40 mt-1">{t("cameraRoll.subtitle")}</p>
              </div>
              <Button
                variant={selectMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectMode(!selectMode);
                  setSelectedIds(new Set());
                }}
                className={
                  selectMode
                    ? "bg-[#0063dc] text-white"
                    : "border-white/10 text-white/70 hover:bg-white/5"
                }
              >
                {selectMode ? t("cameraRoll.cancelSelection") : t("cameraRoll.select")}
              </Button>
            </div>
          </motion.div>

          {selectMode && selectedIds.size > 0 && (
            <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-white/60">{selectedIds.size} {t("cameraRoll.selectedPhotos")}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-white/10 text-white/70 text-xs">
                  {t("cameraRoll.addToAlbum")}
                </Button>
                <Button size="sm" variant="outline" className="border-red-500/20 text-red-400 text-xs hover:bg-red-500/10">
                  {t("cameraRoll.deleteSelected")}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, gi) => (
                <div key={gi} className="space-y-2">
                  <Skeleton className="h-5 w-40 bg-white/5" />
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square bg-white/5 rounded-sm" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : photos.length === 0 ? (
            <EmptyState
              icon={Camera}
              title={t("cameraRoll.noPhotos")}
              description={t("cameraRoll.noPhotosDesc")}
              actionLabel={t("cameraRoll.uploadPhotos")}
              onAction={() => (window.location.href = "/carica")}
            />
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => {
                const datePhotos = groupedPhotos[dateKey];
                const dateLabel = format(new Date(dateKey), "d MMMM yyyy", { locale: dateLocale });
                return (
                  <div key={dateKey} className="space-y-2">
                    <h3 className="text-sm font-medium text-white/50 sticky top-14 bg-[#0d0d0d]/95 py-1 z-10">
                      {dateLabel}
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1">
                      {datePhotos.map((photo: any) => (
                        <motion.div
                          key={photo.id}
                          className="relative group"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Link href={selectMode ? "#" : `/foto/${photo.id}`}>
                            <div
                              className={`aspect-square overflow-hidden rounded-sm cursor-pointer relative ${
                                selectedIds.has(photo.id) ? "ring-2 ring-[#0063dc]" : ""
                              }`}
                              onClick={() => selectMode && toggleSelect(photo.id)}
                            >
                              <img
                                src={photo.thumbnail || photo.filepath}
                                alt={photo.title}
                                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                loading="lazy"
                              />
                              {/* Select checkbox */}
                              {selectMode && (
                                <div className="absolute top-1 right-1">
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                                      selectedIds.has(photo.id)
                                        ? "bg-[#0063dc] text-white"
                                        : "bg-black/40 text-white/30"
                                    }`}
                                  >
                                    {selectedIds.has(photo.id) && (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; {t("home.footerShort")}</span>
      </footer>
    </div>
  );
}
