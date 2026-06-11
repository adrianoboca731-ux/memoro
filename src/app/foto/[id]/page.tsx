"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { CommentSection } from "@/components/comment-section";
import { SafetyBadge } from "@/components/safety-badge";
import { FollowButton } from "@/components/follow-button";
import {
  Heart,
  Eye,
  MessageCircle,
  Calendar,
  Tag,
  Folder,
  Camera,
  Download,
  Share2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  User,
  Aperture,
  Gauge,
  CircleDot,
  Image as ImageIcon,
  X,
  Edit3,
  Save,
  Trash2,
  BookmarkPlus,
  Users,
  ExternalLink,
  AlertTriangle,
  ShieldAlert,
  Maximize2,
  Search,
  Plus,
  Check,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it, enUS, fr, de as deLocale, es as esLocale, ptBR, ja, ko, zhTW, zhCN } from "date-fns/locale";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const dateLocales: Record<string, any> = { it, en: enUS, fr, de: deLocale, es: esLocale, "pt-BR": ptBR, ja, ko, "zh-TW": zhTW, "zh-CN": zhCN };

export default function FotoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const photoId = params.id as string;
  const { t, locale } = useI18n();

  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [showExif, setShowExif] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [addToGalleryOpen, setAddToGalleryOpen] = useState(false);
  const [addToGroupOpen, setAddToGroupOpen] = useState(false);
  const [galleries, setGalleries] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

  // Add-to modal state (Flickr-style)
  const [addToOpen, setAddToOpen] = useState(false);
  const [addToTab, setAddToTab] = useState<"albums" | "groups">("albums");
  const [albums, setAlbums] = useState<any[]>([]);
  const [selectedAlbums, setSelectedAlbums] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [addToSearch, setAddToSearch] = useState("");
  const [newAlbumName, setNewAlbumName] = useState("");
  const [showNewAlbumInput, setShowNewAlbumInput] = useState(false);

  // Navigation state
  const [navData, setNavData] = useState<{ prev: { id: string; title: string; thumbnail: string } | null; next: { id: string; title: string; thumbnail: string } | null; thumbnails: { id: string; title: string; thumbnail: string; isCurrent: boolean }[] } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbnailStripRef = useRef<HTMLDivElement | null>(null);

  const dateLocale = dateLocales[locale] || it;

  const fetchPhoto = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${photoId}`);
      if (res.ok) {
        const data = await res.json();
        setPhoto(data);
        setIsFavorited(data.isFavorited || false);
        setFavoriteCount(data.favoriteCount || 0);
        setEditTitle(data.title);
        setEditDescription(data.description || "");
        setEditTags(data.tags || "");
      } else {
        const data = await res.json();
        setError(data.error || t("photo.notFound"));
      }
    } catch (err) {
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [photoId]);

  useEffect(() => {
    fetchPhoto();
  }, [fetchPhoto]);

  // Fetch navigation data
  useEffect(() => {
    if (!photoId) return;
    const fetchNav = async () => {
      try {
        const res = await fetch(`/api/photos/${photoId}/navigate`);
        if (res.ok) {
          const data = await res.json();
          setNavData(data);
        }
      } catch (err) {
        console.error("Error fetching navigation:", err);
      }
    };
    fetchNav();
  }, [photoId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && navData?.prev) {
        e.preventDefault();
        router.push(`/foto/${navData.prev.id}`);
      } else if (e.key === "ArrowRight" && navData?.next) {
        e.preventDefault();
        router.push(`/foto/${navData.next.id}`);
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === "f" || e.key === "F") {
        if (e.target instanceof HTMLElement && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
          setIsFullscreen((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navData, router, isFullscreen]);

  // Scroll thumbnail strip to current photo
  useEffect(() => {
    if (thumbnailStripRef.current) {
      const currentThumb = thumbnailStripRef.current.querySelector("[data-current=\"true\"]");
      if (currentThumb) {
        currentThumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [navData]);

  // Fetch albums and groups when "Add to" modal opens
  useEffect(() => {
    if (!addToOpen || !session?.user?.id) return;
    const fetchData = async () => {
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
    };
    fetchData();
    // Reset state when modal opens
    setSelectedAlbums(new Set());
    setSelectedGroups(new Set());
    setAddToSearch("");
    setNewAlbumName("");
    setShowNewAlbumInput(false);
  }, [addToOpen, session]);

  // Handle saving selections from Add-to modal
  const handleAddToSave = useCallback(async () => {
    try {
      // Add to selected albums
      for (const albumId of selectedAlbums) {
        await fetch(`/api/photos/${photoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId }),
        });
      }
      // Add to selected groups
      for (const groupId of selectedGroups) {
        await fetch(`/api/groups/${groupId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId }),
        });
      }
      setAddToOpen(false);
    } catch (err) {
      console.error("Error adding to albums/groups:", err);
    }
  }, [photoId, selectedAlbums, selectedGroups]);

  // Handle creating a new album and adding the photo to it
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
        // Add photo to the new album
        await fetch(`/api/photos/${photoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ albumId: album.id }),
        });
        setAlbums((prev) => [album, ...prev]);
        setSelectedAlbums((prev) => new Set(prev).add(album.id));
        setNewAlbumName("");
        setShowNewAlbumInput(false);
      }
    } catch (err) {
      console.error("Error creating album:", err);
    }
  }, [photoId, newAlbumName]);

  const handleToggleFavorite = useCallback(async () => {
    try {
      const res = await fetch(`/api/photos/${photoId}/favorite`, { method: "POST" });
      if (res.ok) {
        setIsFavorited((prev) => !prev);
        setFavoriteCount((prev) => isFavorited ? prev - 1 : prev + 1);
      }
    } catch (err) {
      console.error("Error with favorite:", err);
    }
  }, [photoId, isFavorited]);

  const handleSave = useCallback(async () => {
    if (!photo) return;
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, description: editDescription, tags: editTags }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPhoto(updated);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error saving:", err);
    }
  }, [photoId, photo, editTitle, editDescription, editTags]);

  const handleDelete = useCallback(async () => {
    if (!confirm(t("photo.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/esplora");
      }
    } catch (err) {
      console.error("Error deleting:", err);
    }
  }, [photoId, router]);

  const isOwner = session?.user && photo && (session.user as any).id === photo.userId;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-56px)]">
          <div className="space-y-4">
            <Skeleton className="w-[600px] h-[400px] rounded-lg bg-white/5" />
            <Skeleton className="w-48 h-6 rounded bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !photo) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] text-white/50">
          <Camera className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">{error || t("photo.notFound")}</p>
          <Link href="/esplora">
            <Button variant="outline" className="mt-4 border-white/20 text-white hover:bg-white/5">
              {t("photo.backToExplore")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left side - Photo area (70%) */}
        <div className="flex-1 lg:w-[70%] bg-[#000] flex flex-col min-h-[50vh] lg:min-h-[calc(100vh-56px)] relative">
          {/* Photo title bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-black/60 text-white/70 text-sm absolute top-0 left-0 right-0 z-20">
            <span className="truncate max-w-[60%]">{photo.user?.username ? `${t("photo.photosOf")} ` : ""}{photo.user?.name || ""}</span>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title={isFullscreen ? t("photo.exitFullscreen") : t("photo.enterFullscreen")}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          {/* Main image container */}
          <div className="flex-1 flex items-center justify-center relative group">
            <motion.img
              key={photoId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              src={photo.filepath}
              alt={photo.title}
              className={`max-w-full max-h-[calc(100vh-56px-80px)] object-contain ${
                photo.shouldBlur && !revealed ? "blur-xl" : ""
              }`}
            />

            {/* Left navigation arrow */}
            {navData?.prev && (
              <Link
                href={`/foto/${navData.prev.id}`}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <div className="bg-black/60 hover:bg-black/80 rounded-full p-3 cursor-pointer transition-colors backdrop-blur-sm">
                  <ChevronLeft className="h-8 w-8 text-white/90" />
                </div>
              </Link>
            )}

            {/* Right navigation arrow */}
            {navData?.next && (
              <Link
                href={`/foto/${navData.next.id}`}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <div className="bg-black/60 hover:bg-black/80 rounded-full p-3 cursor-pointer transition-colors backdrop-blur-sm">
                  <ChevronRight className="h-8 w-8 text-white/90" />
                </div>
              </Link>
            )}

            {/* Mature/restricted content overlay */}
            {photo.shouldBlur && !revealed && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 z-10 p-6">
                {photo.safetyLevel === "restricted" ? (
                  <ShieldAlert className="h-12 w-12 text-red-400/80" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-amber-400/80" />
                )}
                <p className="text-white font-semibold text-lg text-center">
                  {photo.safetyLevel === "restricted" ? t("photo.restrictedContent") : t("photo.matureContent")}
                </p>
                <p className="text-white/50 text-sm text-center max-w-md">
                  {photo.safetyLevel === "restricted" ? t("photo.restrictedContentDesc") : t("photo.matureContentDesc")}
                </p>
                <Button
                  size="default"
                  variant="outline"
                  className="mt-2 border-white/20 text-white hover:bg-white/10 gap-2"
                  onClick={() => {
                    if (confirm(t("photo.confirmShowMature"))) {
                      setRevealed(true);
                    }
                  }}
                >
                  <Eye className="h-4 w-4" />
                  {t("photo.showContent")}
                </Button>
              </div>
            )}
          </div>

          {/* Thumbnail strip + Action bar at bottom */}
          <div className="shrink-0 bg-[#111] border-t border-white/10">
            {/* Action icons row - Flickr style */}
            <div className="flex items-center justify-center gap-1 px-4 py-2 border-b border-white/5">
              {/* Favorite / Star */}
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-full transition-colors ${
                  isFavorited
                    ? "text-[#ff0084] hover:bg-[#ff0084]/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
                title={t("photo.favorite")}
              >
                <Heart className={`h-5 w-5 ${isFavorited ? "fill-[#ff0084]" : ""}`} />
              </button>

              {/* Add to album / Plus */}
              <button
                onClick={() => { setAddToOpen(true); setAddToTab("albums"); }}
                className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                title={t("photo.addTo")}
              >
                <Plus className="h-5 w-5" />
              </button>

              {/* Share */}
              <button
                onClick={() => {
                  const shareUrl = `https://my-project-ten-psi-39.vercel.app/foto/${photoId}`;
                  if (navigator.share) {
                    navigator.share({ title: photo.title, url: shareUrl });
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                  }
                }}
                className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                title={t("photo.share")}
              >
                <Share2 className="h-5 w-5" />
              </button>

              {/* Download with size selection */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors" title={t("photo.download")}>
                    <Download className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#2a2a2d] border-white/10" align="end">
                  <DropdownMenuItem
                    className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                    onClick={() => { window.open(`/api/download?photoId=${photo.id}&size=thumbnail`, "_blank"); }}
                  >
                    <Download className="h-4 w-4 mr-2" /> {t("photo.downloadThumbnail")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                    onClick={() => { window.open(`/api/download?photoId=${photo.id}&size=medium`, "_blank"); }}
                  >
                    <Download className="h-4 w-4 mr-2" /> {t("photo.downloadMedium")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                    onClick={() => { window.open(`/api/download?photoId=${photo.id}&size=full`, "_blank"); }}
                  >
                    <Download className="h-4 w-4 mr-2" /> {t("photo.downloadFull")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More actions (owner) */}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors" title={t("photo.edit")}>
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#2a2a2d] border-white/10">
                    <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer" onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-4 w-4 mr-2" /> {t("photo.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer" onClick={() => { setAddToOpen(true); setAddToTab("groups"); }}>
                      <Users className="h-4 w-4 mr-2" /> {t("photo.addToGroups")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-white/5 cursor-pointer" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" /> {t("photo.deletePhoto")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Thumbnail strip */}
            {navData && navData.thumbnails.length > 1 && (
              <div className="flex items-center px-2 gap-1 overflow-x-auto py-1.5 scrollbar-thin">
                <div
                  ref={thumbnailStripRef}
                  className="flex items-center gap-1.5 mx-auto"
                >
                  {navData.thumbnails.map((thumb) => (
                    <Link
                      key={thumb.id}
                      href={`/foto/${thumb.id}`}
                      data-current={thumb.isCurrent}
                      className={`shrink-0 rounded overflow-hidden transition-all duration-200 ${
                        thumb.isCurrent
                          ? "ring-2 ring-[#0063dc] opacity-100 scale-105"
                          : "opacity-50 hover:opacity-80"
                      }`}
                    >
                      <img
                        src={thumb.thumbnail}
                        alt={thumb.title || ""}
                        className="h-[48px] w-[48px] object-cover"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar (30%) */}
        <div className="lg:w-[30%] bg-[#1c1c1c] border-l border-white/5 overflow-y-auto lg:max-h-[calc(100vh-56px)]">
          <div className="p-5 space-y-5 text-white">
            {/* Title & Description */}
            <div>
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-xl font-bold bg-white/10 border-white/20 text-white mb-2"
                />
              ) : (
                <h1 className="text-xl font-bold">{photo.title}</h1>
              )}
              {isEditing ? (
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder={t("photo.addDescription")}
                  rows={3}
                  className="bg-white/10 border-white/20 text-white text-sm resize-none"
                />
              ) : (
                photo.description && (
                  <p className="text-sm text-white/60 mt-2 leading-relaxed">{photo.description}</p>
                )
              )}
            </div>

            <Separator className="bg-white/10" />

            {/* User info */}
            {photo.user && (
              <div className="flex items-center gap-3">
                <Link href={`/persone/${photo.user.username}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={photo.user.avatar || undefined} />
                    <AvatarFallback className="bg-[#0063dc] text-white">
                      {photo.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/persone/${photo.user.username}`} className="font-medium text-sm hover:underline">
                    {photo.user.name}
                  </Link>
                  <p className="text-xs text-white/40">@{photo.user.username}</p>
                </div>
                <FollowButton userId={photo.user.id} username={photo.user.username} />
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Stats */}
            <div className="flex items-center gap-5 text-sm">
              <span className="flex items-center gap-1.5 text-white/60">
                <Eye className="h-4 w-4" /> {photo.views}
              </span>
              <span className="flex items-center gap-1.5 text-white/60">
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-[#ff0084] text-[#ff0084]" : ""}`} />
                {favoriteCount}
              </span>
              <span className="flex items-center gap-1.5 text-white/60">
                <MessageCircle className="h-4 w-4" /> {photo.commentCount || 0}
              </span>
            </div>

            {/* Action buttons in sidebar - compact icon+text style */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                className={`gap-1.5 ${
                  isFavorited
                    ? "text-[#ff0084] hover:bg-[#ff0084]/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-[#ff0084]" : ""}`} />
                {favoriteCount}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setAddToOpen(true); setAddToTab("albums"); }}
                className="gap-1.5 text-white/60 hover:text-white hover:bg-white/5"
              >
                <Plus className="h-4 w-4" />
                {t("photo.addToAlbum")}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-white/60 hover:text-white hover:bg-white/5">
                    <Download className="h-4 w-4" />
                    {t("photo.download")}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#2a2a2d] border-white/10" align="start">
                  <DropdownMenuItem
                    className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                    onClick={() => { window.open(`/api/download?photoId=${photo.id}&size=thumbnail`, "_blank"); }}
                  >
                    {t("photo.downloadThumbnail")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                    onClick={() => { window.open(`/api/download?photoId=${photo.id}&size=medium`, "_blank"); }}
                  >
                    {t("photo.downloadMedium")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer"
                    onClick={() => { window.open(`/api/download?photoId=${photo.id}&size=full`, "_blank"); }}
                  >
                    {t("photo.downloadFull")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-white/60 hover:text-white hover:bg-white/5"
                onClick={() => {
                  const shareUrl = `https://my-project-ten-psi-39.vercel.app/foto/${photoId}`;
                  if (navigator.share) {
                    navigator.share({ title: photo.title, url: shareUrl });
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
                {t("photo.share")}
              </Button>

              {/* Owner actions */}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#2a2a2d] border-white/10">
                    <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer" onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-4 w-4 mr-2" /> {t("photo.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer" onClick={() => { setAddToOpen(true); setAddToTab("groups"); }}>
                      <Users className="h-4 w-4 mr-2" /> {t("photo.addToGroups")}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-white/5 cursor-pointer" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" /> {t("photo.deletePhoto")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Editing save/cancel */}
            {isEditing && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} className="bg-[#0063dc] hover:bg-[#0052b5] text-white gap-1.5">
                  <Save className="h-4 w-4" /> {t("common.save")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="border-white/20 text-white/70">
                  {t("common.cancel")}
                </Button>
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* Tags */}
            {(photo.tags || isEditing) && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{t("photo.tag")}</p>
                {isEditing ? (
                  <Input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder={t("photo.tagPlaceholder")}
                    className="bg-white/5 border-white/10 text-white text-sm"
                  />
                ) : (
                  photo.tags && (
                    <div className="flex flex-wrap gap-1.5">
                      {photo.tags.split(",").map((tag: string) => (
                        <Link key={tag.trim()} href={`/cerca?q=${tag.trim()}`}>
                          <Badge variant="secondary" className="text-xs bg-white/10 text-white/60 hover:bg-white/15 border-0 cursor-pointer">
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {tag.trim()}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Safety level */}
            {photo.safetyLevel && photo.safetyLevel !== "safe" && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">{t("safety.level")}</span>
                <SafetyBadge level={photo.safetyLevel} />
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* EXIF data - collapsible */}
            {photo.exif && (
              <div>
                <button
                  className="flex items-center justify-between w-full text-left"
                  onClick={() => setShowExif(!showExif)}
                >
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" /> {t("photo.exifData")}
                  </p>
                  {showExif ? (
                    <ChevronUp className="h-4 w-4 text-white/30" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/30" />
                  )}
                </button>
                <AnimatePresence>
                  {showExif && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2.5 mt-3 text-sm">
                        {photo.exif.camera && (
                          <div className="flex justify-between">
                            <span className="text-white/40 flex items-center gap-1.5">
                              <Camera className="h-3 w-3" /> {t("photo.camera")}
                            </span>
                            <span className="text-white/70">{photo.exif.camera}</span>
                          </div>
                        )}
                        {photo.exif.lens && (
                          <div className="flex justify-between">
                            <span className="text-white/40 flex items-center gap-1.5">
                              <Aperture className="h-3 w-3" /> {t("photo.lens")}
                            </span>
                            <span className="text-white/70">{photo.exif.lens}</span>
                          </div>
                        )}
                        {photo.exif.focalLength && (
                          <div className="flex justify-between">
                            <span className="text-white/40">{t("photo.focalLength")}</span>
                            <span className="text-white/70">{photo.exif.focalLength}</span>
                          </div>
                        )}
                        {photo.exif.aperture && (
                          <div className="flex justify-between">
                            <span className="text-white/40 flex items-center gap-1.5">
                              <Gauge className="h-3 w-3" /> {t("photo.aperture")}
                            </span>
                            <span className="text-white/70">f/{photo.exif.aperture}</span>
                          </div>
                        )}
                        {photo.exif.shutterSpeed && (
                          <div className="flex justify-between">
                            <span className="text-white/40">{t("photo.shutterSpeed")}</span>
                            <span className="text-white/70">{photo.exif.shutterSpeed}</span>
                          </div>
                        )}
                        {photo.exif.iso && (
                          <div className="flex justify-between">
                            <span className="text-white/40 flex items-center gap-1.5">
                              <CircleDot className="h-3 w-3" /> ISO
                            </span>
                            <span className="text-white/70">{photo.exif.iso}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Photo details */}
            <div className="space-y-2.5 text-sm">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{t("photo.details")}</p>
              {photo.width && photo.height && (
                <div className="flex justify-between">
                  <span className="text-white/40">{t("photo.dimensions")}</span>
                  <span className="text-white/70">{photo.width} × {photo.height}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/40 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> {t("photo.uploadedOn")}
                </span>
                <span className="text-white/70">
                  {format(new Date(photo.createdAt), "d MMMM yyyy", { locale: dateLocale })}
                </span>
              </div>
              {photo.album && (
                <div className="flex justify-between items-center">
                  <span className="text-white/40 flex items-center gap-1.5">
                    <Folder className="h-3 w-3" /> {t("photo.album")}
                  </span>
                  <Link href={`/album/${photo.album.id}`}>
                    <Badge variant="secondary" className="text-xs bg-white/10 text-white/60 border-0 hover:bg-white/15 cursor-pointer">
                      {photo.album.name}
                    </Badge>
                  </Link>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/40">{t("photo.fileSize")}</span>
                <span className="text-white/70">
                  {photo.size > 1048576
                    ? `${(photo.size / 1048576).toFixed(1)} MB`
                    : `${(photo.size / 1024).toFixed(0)} KB`}
                </span>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Comments section */}
            <CommentSection
              photoId={photoId}
              comments={photo.comments || []}
            />
          </div>
        </div>
      </main>

      {/* Add To: Flickr-style modal with Album/Groups tabs */}
      <Dialog open={addToOpen} onOpenChange={setAddToOpen}>
        <DialogContent className="bg-[#212124] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">{t("photo.addTo")}</DialogTitle>
          </DialogHeader>

          {/* Tabs: Album / Gruppi */}
          <div className="flex border-b border-white/10">
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                addToTab === "albums"
                  ? "text-[#0063dc]"
                  : "text-white/50 hover:text-white/70"
              }`}
              onClick={() => setAddToTab("albums")}
            >
              {t("photo.albums")}
              {addToTab === "albums" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0063dc]" />
              )}
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
                addToTab === "groups"
                  ? "text-[#0063dc]"
                  : "text-white/50 hover:text-white/70"
              }`}
              onClick={() => setAddToTab("groups")}
            >
              {t("photo.groups")}
              {addToTab === "groups" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0063dc]" />
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              value={addToSearch}
              onChange={(e) => setAddToSearch(e.target.value)}
              placeholder={addToTab === "albums" ? t("photo.searchAlbums") : t("photo.searchGroups")}
              className="pl-9 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30"
            />
          </div>

          {/* Album list */}
          {addToTab === "albums" && (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {albums.length === 0 ? (
                <p className="text-sm text-white/40 text-center py-6">
                  {t("photo.noAlbums")}
                </p>
              ) : (
                albums
                  .filter((a: any) => !addToSearch || a.name.toLowerCase().includes(addToSearch.toLowerCase()))
                  .map((album: any) => {
                    const isSelected = selectedAlbums.has(album.id);
                    return (
                      <button
                        key={album.id}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                        onClick={() => {
                          setSelectedAlbums((prev) => {
                            const next = new Set(prev);
                            if (next.has(album.id)) next.delete(album.id);
                            else next.add(album.id);
                            return next;
                          });
                        }}
                      >
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-[#0063dc] border-[#0063dc]"
                            : "border-white/30 group-hover:border-white/50"
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        {/* Album thumbnail */}
                        <div className="h-10 w-10 rounded bg-white/5 overflow-hidden shrink-0">
                          {album.cover ? (
                            <img src={album.cover} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-white/20" />
                            </div>
                          )}
                        </div>
                        {/* Album info */}
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
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {groups.length === 0 ? (
                <p className="text-sm text-white/40 text-center py-6">
                  {t("photo.noGroups")}
                  <Link href="/gruppi" className="text-[#0063dc] hover:underline ml-1">{t("photo.exploreGroups")}</Link>
                </p>
              ) : (
                groups
                  .filter((g: any) => !addToSearch || g.name.toLowerCase().includes(addToSearch.toLowerCase()))
                  .map((group: any) => {
                    const isSelected = selectedGroups.has(group.id);
                    return (
                      <button
                        key={group.id}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group"
                        onClick={() => {
                          setSelectedGroups((prev) => {
                            const next = new Set(prev);
                            if (next.has(group.id)) next.delete(group.id);
                            else next.add(group.id);
                            return next;
                          });
                        }}
                      >
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-[#0063dc] border-[#0063dc]"
                            : "border-white/30 group-hover:border-white/50"
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>
                        {/* Group icon */}
                        <div className="h-10 w-10 rounded bg-white/5 flex items-center justify-center shrink-0">
                          <Users className="h-5 w-5 text-white/30" />
                        </div>
                        {/* Group info */}
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
            <button
              className="w-full flex items-center gap-2 py-2.5 text-[#0063dc] hover:text-[#0052b5] text-sm font-medium transition-colors"
              onClick={() => setShowNewAlbumInput(true)}
            >
              <Plus className="h-4 w-4" />
              {t("photo.createAlbum")}
            </button>
          )}

          {/* New album input */}
          {addToTab === "albums" && showNewAlbumInput && (
            <div className="flex gap-2">
              <Input
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder={t("photo.albumName")}
                className="flex-1 bg-white/5 border-white/10 text-white text-sm placeholder:text-white/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateAndAddAlbum();
                }}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleCreateAndAddAlbum}
                disabled={!newAlbumName.trim()}
                className="bg-[#0063dc] hover:bg-[#0052b5] text-white"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setShowNewAlbumInput(false); setNewAlbumName(""); }}
                className="border-white/20 text-white/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Save button */}
          {(selectedAlbums.size > 0 || selectedGroups.size > 0) && (
            <Button
              onClick={handleAddToSave}
              className="w-full bg-[#0063dc] hover:bg-[#0052b5] text-white"
            >
              {t("photo.save")}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
