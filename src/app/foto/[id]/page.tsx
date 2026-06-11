"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [addToGalleryOpen, setAddToGalleryOpen] = useState(false);
  const [addToGroupOpen, setAddToGroupOpen] = useState(false);
  const [galleries, setGalleries] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);

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
        <div className="flex-1 lg:w-[70%] bg-[#000] flex items-center justify-center min-h-[50vh] lg:min-h-[calc(100vh-56px)] relative">
          <motion.img
            key={photoId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            src={photo.filepath}
            alt={photo.title}
            className="max-w-full max-h-[calc(100vh-56px)] object-contain"
          />
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

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFavorite}
                className={`gap-1.5 border-white/10 ${
                  isFavorited
                    ? "bg-[#ff0084]/10 border-[#ff0084]/30 text-[#ff0084]"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-[#ff0084]" : ""}`} />
                {t("photo.favorite")}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddToGalleryOpen(true)}
                className="gap-1.5 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
              >
                <BookmarkPlus className="h-4 w-4" />
                {t("photo.gallery")}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
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

              {/* Share on Flickr */}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-white/10 text-[#ff0084]/70 hover:text-[#ff0084] hover:bg-[#ff0084]/5"
                onClick={() => {
                  const url = encodeURIComponent(`https://my-project-ten-psi-39.vercel.app/foto/${photoId}`);
                  const title = encodeURIComponent(photo.title || 'Check out this photo on Memoro!');
                  window.open(`https://www.flickr.com/share?url=${url}&title=${title}`, '_blank', 'width=600,height=400');
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Flickr
              </Button>

              <Button
                variant="outline"
                size="sm"
                asChild
                className="gap-1.5 border-white/10 text-white/70 hover:text-white hover:bg-white/5"
              >
                <a href={photo.filepath} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  {t("photo.download")}
                </a>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="border-white/10 text-white/70 hover:text-white hover:bg-white/5">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#2a2a2d] border-white/10">
                  {isOwner && (
                    <>
                      <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer" onClick={() => setIsEditing(true)}>
                        <Edit3 className="h-4 w-4 mr-2" /> {t("photo.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer" onClick={() => setAddToGroupOpen(true)}>
                        <Users className="h-4 w-4 mr-2" /> {t("photo.addToGroups")}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 focus:text-red-300 focus:bg-white/5 cursor-pointer" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-2" /> {t("photo.deletePhoto")}
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isOwner && (
                    <DropdownMenuItem className="text-white/70 focus:text-white focus:bg-white/5 cursor-pointer">
                      {t("photo.report")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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

      {/* Add to Gallery Dialog */}
      <Dialog open={addToGalleryOpen} onOpenChange={setAddToGalleryOpen}>
        <DialogContent className="bg-[#2a2a2d] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{t("photo.addToGallery")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {galleries.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-4">
                {t("photo.noGalleries")}
                <Link href="/gallerie" className="text-[#0063dc] hover:underline ml-1">{t("photo.createGallery")}</Link>
              </p>
            ) : (
              galleries.map((g) => (
                <button
                  key={g.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                  onClick={async () => {
                    try {
                      await fetch(`/api/galleries/${g.id}/items`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ photoId }),
                      });
                      setAddToGalleryOpen(false);
                    } catch {}
                  }}
                >
                  <ImageIcon className="h-8 w-8 text-white/20" />
                  <span className="text-sm text-white/80">{g.name}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Group Dialog */}
      <Dialog open={addToGroupOpen} onOpenChange={setAddToGroupOpen}>
        <DialogContent className="bg-[#2a2a2d] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{t("photo.addToGroup")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {groups.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-4">
                {t("photo.noGroups")}
                <Link href="/gruppi" className="text-[#0063dc] hover:underline ml-1">{t("photo.exploreGroups")}</Link>
              </p>
            ) : (
              groups.map((g) => (
                <button
                  key={g.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                  onClick={async () => {
                    try {
                      await fetch(`/api/groups/${g.id}/photos`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ photoId }),
                      });
                      setAddToGroupOpen(false);
                    } catch {}
                  }}
                >
                  <Users className="h-8 w-8 text-white/20" />
                  <div>
                    <span className="text-sm text-white/80 block">{g.name}</span>
                    <span className="text-xs text-white/30">{g.memberCount} {t("common.members")}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
