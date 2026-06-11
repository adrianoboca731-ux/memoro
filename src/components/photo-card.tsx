"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Eye, Heart, MessageSquare, Star, AlertTriangle, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SafetyBadge } from "./safety-badge";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface PhotoCardProps {
  photo: {
    id: string;
    title: string;
    thumbnail: string | null;
    filepath: string;
    views: number;
    favoriteCount: number;
    commentCount?: number;
    safetyLevel?: string;
    isMature?: boolean;
    isFavorited?: boolean;
    shouldBlur?: boolean;
    user?: {
      id: string;
      name: string;
      username: string;
      avatar: string | null;
    } | null;
  };
  showOverlay?: boolean;
  showSafety?: boolean;
  /** Flickr-style card: shows title, author, fave/comment stats always visible below image */
  flickrStyle?: boolean;
}

export function PhotoCard({ photo, showOverlay = true, showSafety = true, flickrStyle = true }: PhotoCardProps) {
  const { t } = useI18n();
  const { data: session } = useSession();
  const [revealed, setRevealed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(photo.isFavorited || false);
  const [faveCount, setFaveCount] = useState(photo.favoriteCount || 0);
  const [faveLoading, setFaveLoading] = useState(false);

  const isRestricted = photo.safetyLevel === "restricted";
  const blurLabel = isRestricted
    ? t("photo.restrictedContent")
    : t("photo.matureContent");
  const blurDesc = isRestricted
    ? t("photo.restrictedContentDesc")
    : t("photo.matureContentDesc");

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(t("photo.confirmShowMature"))) {
      setRevealed(true);
    }
  };

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user || faveLoading) return;
    setFaveLoading(true);
    try {
      const res = await fetch(`/api/photos/${photo.id}/favorite`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIsFavorited(data.favorited);
        setFaveCount((prev) => data.favorited ? prev + 1 : Math.max(0, prev - 1));
      }
    } catch {
      toast.error(t("photo.favoriteError"));
    } finally {
      setFaveLoading(false);
    }
  }, [session, photo.id, faveLoading, t]);

  // ===== Flickr-style card =====
  if (flickrStyle) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="group"
      >
        {/* Photo image */}
        <Link href={`/foto/${photo.id}`} className="block">
          <div className="relative overflow-hidden rounded-lg bg-white/5">
            <img
              src={photo.thumbnail || photo.filepath}
              alt={photo.title}
              className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                photo.shouldBlur && !revealed ? "blur-xl" : ""
              }`}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = photo.filepath;
              }}
            />
            {/* Mature/restricted content overlay */}
            {photo.shouldBlur && !revealed && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 z-10 p-3">
                {isRestricted ? (
                  <ShieldAlert className="h-8 w-8 text-red-400/80" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-400/80" />
                )}
                <p className="text-white font-semibold text-sm text-center">
                  {blurLabel}
                </p>
                <p className="text-white/50 text-xs text-center max-w-[200px]">
                  {blurDesc}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1 border-white/20 text-white hover:bg-white/10 text-xs h-7"
                  onClick={handleReveal}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {t("photo.showContent")}
                </Button>
              </div>
            )}
            {/* Hover overlay with views */}
            {showOverlay && !(photo.shouldBlur && !revealed) && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-white/70 text-xs">
                    <Eye className="h-3 w-3" /> {photo.views}
                  </span>
                </div>
              </div>
            )}
            {/* Safety badge */}
            {showSafety && photo.safetyLevel && photo.safetyLevel !== "safe" && (
              <div className="absolute top-2 left-2 z-20">
                <SafetyBadge level={photo.safetyLevel} />
              </div>
            )}
          </div>
        </Link>

        {/* Flickr-style info bar below image */}
        <div className="mt-1.5 px-0.5">
          {/* Row 1: Title left, actions right */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link href={`/foto/${photo.id}`} className="hover:underline">
                <p className="text-sm font-semibold truncate text-white/90 group-hover:text-white transition-colors">
                  {photo.title}
                </p>
              </Link>
              {photo.user && (
                <Link
                  href={`/persone/${photo.user.username}`}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors truncate block mt-0.5"
                >
                  {t("common.by")} {photo.user.name}
                </Link>
              )}
            </div>
            {/* Engagement stats - always visible */}
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              {/* Favorite count + toggle */}
              <button
                onClick={handleToggleFavorite}
                disabled={faveLoading || !session?.user}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  isFavorited
                    ? "text-[#ff0084]"
                    : "text-white/40 hover:text-[#ff0084]/70"
                }`}
                title={isFavorited ? t("photo.removeFavorite") : t("photo.addFavorite")}
              >
                <Star className={`h-3.5 w-3.5 ${isFavorited ? "fill-[#ff0084]" : ""}`} />
                <span className="tabular-nums">{faveCount}</span>
              </button>
              {/* Comment count */}
              <Link
                href={`/foto/${photo.id}#comments`}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="tabular-nums">{photo.commentCount || 0}</span>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ===== Legacy card (for contexts that don't want Flickr style) =====
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group relative"
    >
      <Link href={`/foto/${photo.id}`} className="block">
        <div className="relative overflow-hidden rounded-lg bg-white/5">
          <img
            src={photo.thumbnail || photo.filepath}
            alt={photo.title}
            className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              photo.shouldBlur && !revealed ? "blur-xl" : ""
            }`}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = photo.filepath;
            }}
          />
          {photo.shouldBlur && !revealed && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 z-10 p-3">
              {isRestricted ? (
                <ShieldAlert className="h-8 w-8 text-red-400/80" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-amber-400/80" />
              )}
              <p className="text-white font-semibold text-sm text-center">{blurLabel}</p>
              <p className="text-white/50 text-xs text-center max-w-[200px]">{blurDesc}</p>
              <Button size="sm" variant="outline" className="mt-1 border-white/20 text-white hover:bg-white/10 text-xs h-7" onClick={handleReveal}>
                <Eye className="h-3 w-3 mr-1" /> {t("photo.showContent")}
              </Button>
            </div>
          )}
          {showOverlay && !(photo.shouldBlur && !revealed) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white font-medium text-sm truncate">{photo.title}</p>
                {photo.user && (
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={photo.user.avatar || undefined} />
                      <AvatarFallback className="text-[8px] bg-[#0063dc] text-white">
                        {photo.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-white/70 text-xs truncate">{photo.user.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-white/70 text-xs">
                    <Eye className="h-3 w-3" /> {photo.views}
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <Heart className={`h-3 w-3 ${isFavorited ? "fill-[#ff0084] text-[#ff0084]" : "text-white/70"}`} />
                    <span className="text-white/70">{faveCount}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
          {showSafety && photo.safetyLevel && photo.safetyLevel !== "safe" && (
            <div className="absolute top-2 left-2 z-20">
              <SafetyBadge level={photo.safetyLevel} />
            </div>
          )}
        </div>
      </Link>
      <div className="mt-1.5 px-0.5">
        <p className="text-sm font-medium truncate text-foreground/80">{photo.title}</p>
        {photo.user && (
          <Link href={`/persone/${photo.user.username}`} className="text-xs text-muted-foreground hover:text-foreground/60 truncate block">
            {t("common.by")} {photo.user.name}
          </Link>
        )}
      </div>
    </motion.div>
  );
}
