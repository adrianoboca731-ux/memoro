"use client";

import { useAppStore, Photo } from "@/lib/store";
import { Eye, Heart, Folder } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface PhotoGridProps { photos: Photo[]; loading?: boolean; }

export function PhotoGrid({ photos, loading }: PhotoGridProps) {
  const { selectPhoto, toggleFavorite } = useAppStore();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="break-inside-avoid">
            <Skeleton className="w-full rounded-lg bg-white/5" style={{ height: `${150 + Math.random() * 200}px` }} />
          </div>
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/30">
        <Camera className="h-16 w-16 mb-4" />
        <p className="text-lg font-medium">{t("photoGrid.noPhotos")}</p>
        <p className="text-sm">{t("photoGrid.trySearching")}</p>
      </div>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 p-4">
      <AnimatePresence>
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            className="break-inside-avoid group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            onClick={() => selectPhoto(photo.id)}
          >
            <div className="relative overflow-hidden rounded-lg bg-white/5">
              <img
                src={photo.thumbnail || photo.filepath}
                alt={photo.title}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = photo.filepath; }}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-medium text-sm truncate">{photo.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-white/80 text-xs">
                      <Eye className="h-3 w-3" /> {photo.views}
                    </span>
                    <span className="flex items-center gap-1 text-xs cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.id); }}>
                      <Heart className={`h-3 w-3 ${photo.isFavorited ? "fill-[#ff0084] text-[#ff0084]" : "text-white/80"}`} />
                      <span className="text-white/80">{photo.favoriteCount}</span>
                    </span>
                    {photo.user && (
                      <span className="text-white/60 text-xs truncate">{photo.user.name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-1.5 px-0.5">
              <p className="text-sm font-medium truncate text-white/80">{photo.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <Eye className="h-3 w-3" /> {photo.views}
                </span>
                {photo.isFavorited && <Heart className="h-3 w-3 fill-[#ff0084] text-[#ff0084]" />}
                {photo.album && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-0.5 bg-white/5 text-white/50 border-0">
                    <Folder className="h-2.5 w-2.5" />{photo.album.name}
                  </Badge>
                )}
                {photo.user && <span className="text-xs text-white/30 truncate">{t("common.by")} {photo.user.name}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
