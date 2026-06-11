"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { PhotoCard } from "@/components/photo-card";
import { EmptyState } from "@/components/empty-state";
import {
  ArrowLeft,
  LayoutGrid,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it, enUS, fr, de as deLocale, es as esLocale, ptBR, ja, ko, zhTW, zhCN } from "date-fns/locale";
import { useI18n } from "@/lib/i18n";

const dateLocales: Record<string, any> = { it, en: enUS, fr, de: deLocale, es: esLocale, "pt-BR": ptBR, ja, ko, "zh-TW": zhTW, "zh-CN": zhCN };

export default function GalleriaDetailPage() {
  const { t, locale } = useI18n();
  const dateLocale = dateLocales[locale] || it;
  const params = useParams();
  const router = useRouter();
  const galleryId = params.id as string;

  const [gallery, setGallery] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/galleries/${galleryId}`);
      if (res.ok) {
        const data = await res.json();
        setGallery(data);
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Error loading:", err);
    } finally {
      setLoading(false);
    }
  }, [galleryId]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-48 bg-white/5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <EmptyState icon={LayoutGrid} title={t("galleries.galleryNotFound")} description={t("galleries.galleryNotFoundDesc")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/gallerie")}
            className="text-white/50 hover:text-white hover:bg-white/5 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("galleries.allGalleries")}
          </Button>

          {/* Gallery header */}
          <div className="relative rounded-xl overflow-hidden">
            {gallery.cover ? (
              <div className="h-48 md:h-64 relative">
                <img src={gallery.cover} alt={gallery.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{gallery.name}</h1>
                  {gallery.description && (
                    <p className="text-white/60 mt-1 text-sm">{gallery.description}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-32 md:h-48 bg-gradient-to-br from-[#ff0084]/20 to-[#0063dc]/20 flex items-end p-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{gallery.name}</h1>
                  {gallery.description && (
                    <p className="text-white/50 mt-1 text-sm">{gallery.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-white/40">
              <span className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" /> {items.length} {t("common.photos")}
              </span>
              <span>&bull;</span>
              <span>{t("galleries.createdOn")} {format(new Date(gallery.createdAt), "d MMMM yyyy", { locale: dateLocale })}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 text-white/70 hover:bg-white/5 gap-1"
              onClick={() => router.push("/esplora")}
            >
              <ImageIcon className="h-4 w-4" /> {t("galleries.addPhotos")}
            </Button>
          </div>

          <Separator className="bg-white/5" />

          {items.length === 0 ? (
            <EmptyState
              icon={Camera}
              title={t("galleries.noPhotosInGallery")}
              description={t("galleries.exploreToAdd")}
              actionLabel={t("galleries.explorePhotos")}
              onAction={() => router.push("/esplora")}
            />
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {items.map((item: any, index: number) => {
                const photo = item.photo || item;
                return (
                  <motion.div
                    key={item.id || photo.id}
                    className="break-inside-avoid"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
                  >
                    <PhotoCard photo={photo} />
                    {item.note && (
                      <p className="text-xs text-white/30 mt-1 px-0.5 italic">{item.note}</p>
                    )}
                  </motion.div>
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
