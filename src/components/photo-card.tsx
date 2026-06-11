"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Eye, Heart, MessageSquare, Star, AlertTriangle, ShieldAlert, Plus, Share2, Download, Check, Search, Users, X, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SafetyBadge } from "./safety-badge";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

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
  /** Callback when favorite status changes */
  onFavoriteChange?: (isFavorited: boolean) => void;
}

export function PhotoCard({ photo, showOverlay = true, showSafety = true, flickrStyle = true, onFavoriteChange }: PhotoCardProps) {
  const { t } = useI18n();
  const { data: session } = useSession();
  const [revealed, setRevealed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(photo.isFavorited || false);
  const [faveCount, setFaveCount] = useState(photo.favoriteCount || 0);
  const [faveLoading, setFaveLoading] = useState(false);

  // Add-to modal state
  const [addToOpen, setAddToOpen] = useState(false);
  const [addToTab, setAddToTab] = useState<"albums" | "groups">("albums");
  const [albums, setAlbums] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedAlbums, setSelectedAlbums] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [addToSearch, setAddToSearch] = useState("");
  const [newAlbumName, setNewAlbumName] = useState("");
  const [showNewAlbumInput, setShowNewAlbumInput] = useState(false);

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
        onFavoriteChange?.(data.favorited);
      }
    } catch {
      toast.error(t("photo.favoriteError"));
    } finally {
      setFaveLoading(false);
    }
  }, [session, photo.id, faveLoading, t, onFavoriteChange]);

  // Fetch albums/groups when modal opens
  const handleOpenAddTo = useCallback(async () => {
    setAddToOpen(true);
    setSelectedAlbums(new Set());
    setSelectedGroups(new Set());
    setAddToSearch("");
    setNewAlbumName("");
    setShowNewAlbumInput(false);
    if (!session?.user?.id) return;
    try {
      const [albumsRes, groupsRes] = await Promise.all([
        fetch(`/api/albums?userId=${(session.user as any).id}`),
        fetch(`/api/groups?userId=${(session.user as any).id}`),
      ]);
      if (albumsRes.ok) {
        const albumsData = await albumsRes.json();
        setAlbums(Array.isArray(albumsData) ? albumsData : []);
      }
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(Array.isArray(groupsData) ? groupsData : (groupsData.groups || []));
      }
    } catch (err) {
      console.error("Error fetching albums/groups:", err);
    }
  }, [session]);

  // Handle saving selections
  const handleAddToSave = useCallback(async () => {
    try {
      for (const albumId of selectedAlbums) {
        await fetch(`/api/photos/${photo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId }),
        });
      }
      for (const groupId of selectedGroups) {
        await fetch(`/api/groups/${groupId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId: photo.id }),
        });
      }
      setAddToOpen(false);
      toast.success(t("photo.saved"));
    } catch (err) {
      console.error("Error adding to albums/groups:", err);
    }
  }, [photo.id, selectedAlbums, selectedGroups, t]);

  // Handle creating a new album
  const handleCreateAndAddAlbum = useCallback(async () => {
    if (!newAlbumName.trim()) return;
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAlbumName.trim() }),
      });
      if (res.ok) {
        const album = await res.json();
        await fetch(`/api/photos/${photo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId: album.id }),
        });
        setAlbums((prev) => [album, ...prev]);
        setSelectedAlbums((prev) => new Set(prev).add(album.id));
        setNewAlbumName("");
        setShowNewAlbumInput(false);
        setAddToOpen(false);
        toast.success(t("photo.saved"));
      }
    } catch (err) {
      console.error("Error creating album:", err);
    }
  }, [photo.id, newAlbumName, t]);

  // Share handler
  const handleShare = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `https://my-project-ten-psi-39.vercel.app/foto/${photo.id}`;
    if (navigator.share) {
      navigator.share({ title: photo.title, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success(t("photo.linkCopied"));
    }
  }, [photo.id, photo.title, t]);

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
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {/* Favorite toggle */}
              <button
                onClick={handleToggleFavorite}
                disabled={faveLoading || !session?.user}
                className={`flex items-center gap-0.5 text-xs transition-colors ${
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
                className="flex items-center gap-0.5 text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="tabular-nums">{photo.commentCount || 0}</span>
              </Link>
              {/* Add to album / Plus */}
              {session?.user && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenAddTo(); }}
                  className="flex items-center gap-0.5 text-xs text-white/40 hover:text-[#0063dc] transition-colors"
                  title={t("photo.addTo")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
              {/* Share */}
              {session?.user && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-0.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                  title={t("photo.share")}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Add To: Flickr-style modal */}
        <Dialog open={addToOpen} onOpenChange={setAddToOpen}>
          <DialogContent className="bg-[#212124] border-white/10 max-w-md" onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle className="text-white text-lg">{t("photo.addTo")}</DialogTitle>
            </DialogHeader>
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${addToTab === "albums" ? "text-[#0063dc]" : "text-white/50 hover:text-white/70"}`}
                onClick={() => setAddToTab("albums")}
              >
                {t("photo.albums")}
                {addToTab === "albums" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0063dc]" />}
              </button>
              <button
                className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${addToTab === "groups" ? "text-[#0063dc]" : "text-white/50 hover:text-white/70"}`}
                onClick={() => setAddToTab("groups")}
              >
                {t("photo.groups")}
                {addToTab === "groups" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0063dc]" />}
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                value={addToSearch}
                onChange={(e) => setAddToSearch(e.target.value)}
                placeholder={addToTab === "albums" ? t("photo.searchAlbums") : t("photo.searchGroups")}
                className="pl-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30"
              />
            </div>
            {/* Albums list */}
            {addToTab === "albums" && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {albums.length === 0 ? (
                  <p className="text-sm text-white/40 text-center py-4">{t("photo.noAlbums")}</p>
                ) : (
                  albums.filter((a: any) => !addToSearch || a.name.toLowerCase().includes(addToSearch.toLowerCase())).map((album: any) => {
                    const isSelected = selectedAlbums.has(album.id);
                    return (
                      <button
                        key={album.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                        onClick={() => {
                          setSelectedAlbums((prev) => { const next = new Set(prev); if (next.has(album.id)) next.delete(album.id); else next.add(album.id); return next; });
                        }}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-[#0063dc] border-[#0063dc]" : "border-white/30 group-hover:border-white/50"}`}>
                          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <div className="h-8 w-8 rounded bg-white/5 overflow-hidden shrink-0">
                          {album.cover ? <img src={album.cover} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-4 w-4 text-white/20" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/90 truncate">{album.name}</p>
                          <p className="text-xs text-white/40">{album.photoCount || 0} {t("photo.items")}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
            {/* Groups list */}
            {addToTab === "groups" && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {groups.length === 0 ? (
                  <p className="text-sm text-white/40 text-center py-6">{t("photo.noGroups")} <Link href="/gruppi" className="text-[#0063dc] hover:underline ml-1">{t("photo.exploreGroups")}</Link></p>
                ) : (
                  groups.filter((g: any) => !addToSearch || g.name.toLowerCase().includes(addToSearch.toLowerCase())).map((group: any) => {
                    const isSelected = selectedGroups.has(group.id);
                    return (
                      <button
                        key={group.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                        onClick={() => {
                          setSelectedGroups((prev) => { const next = new Set(prev); if (next.has(group.id)) next.delete(group.id); else next.add(group.id); return next; });
                        }}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-[#0063dc] border-[#0063dc]" : "border-white/30 group-hover:border-white/50"}`}>
                          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <div className="h-8 w-8 rounded bg-white/5 flex items-center justify-center shrink-0"><Users className="h-4 w-4 text-white/30" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/90 truncate">{group.name}</p>
                          <p className="text-xs text-white/40">{group.memberCount || 0} {t("common.members")}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
            {/* Create new album */}
            {addToTab === "albums" && !showNewAlbumInput && (
              <button className="w-full flex items-center gap-2 py-2 text-[#0063dc] hover:text-[#0052b5] text-sm font-medium transition-colors" onClick={() => setShowNewAlbumInput(true)}>
                <Plus className="h-4 w-4" /> {t("photo.createAlbum")}
              </button>
            )}
            {addToTab === "albums" && showNewAlbumInput && (
              <div className="flex gap-2">
                <Input value={newAlbumName} onChange={(e) => setNewAlbumName(e.target.value)} placeholder={t("photo.albumName")} className="flex-1 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30" onKeyDown={(e) => { if (e.key === "Enter") handleCreateAndAddAlbum(); }} autoFocus />
                <Button size="sm" onClick={handleCreateAndAddAlbum} disabled={!newAlbumName.trim()} className="bg-[#0063dc] hover:bg-[#0052b5] text-white"><Check className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => { setShowNewAlbumInput(false); setNewAlbumName(""); }} className="border-white/20 text-white/50"><X className="h-4 w-4" /></Button>
              </div>
            )}
            {/* Save button */}
            {(selectedAlbums.size > 0 || selectedGroups.size > 0) && (
              <Button onClick={handleAddToSave} className="w-full bg-[#0063dc] hover:bg-[#0052b5] text-white">{t("photo.save")}</Button>
            )}
          </DialogContent>
        </Dialog>
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
