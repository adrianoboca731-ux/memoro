"use client";

import { useAppStore, Photo } from "@/lib/store";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Eye,
  Calendar,
  Tag,
  Folder,
  Trash2,
  Edit3,
  Save,
  MessageCircle,
  Send,
  Download,
  Share2,
  Camera,
  Maximize2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it, enUS, fr, de as deLocale, es as esLocale, ptBR, ja, ko, zhTW, zhCN } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n";

const dateLocales: Record<string, any> = { it, en: enUS, fr, de: deLocale, es: esLocale, "pt-BR": ptBR, ja, ko, "zh-TW": zhTW, "zh-CN": zhCN };

export function PhotoDetail() {
  const {
    selectedPhotoId,
    photos,
    selectPhoto,
    toggleFavorite,
    deletePhoto,
    updatePhoto,
    addComment,
  } = useAppStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const { t, locale } = useI18n();
  const dateLocale = dateLocales[locale] || it;

  const currentIndex = photos.findIndex((p) => p.id === selectedPhotoId);
  const prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null;

  // Derive photo from store instead of syncing with effect
  const photo = useMemo(
    () => (selectedPhotoId ? photos.find((p) => p.id === selectedPhotoId) ?? null : null),
    [selectedPhotoId, photos]
  );

  // Initialize edit fields when photo changes
  const [lastEditPhotoId, setLastEditPhotoId] = useState<string | null>(null);
  if (photo && photo.id !== lastEditPhotoId) {
    setLastEditPhotoId(photo.id);
    setEditTitle(photo.title);
    setEditDescription(photo.description || "");
    setEditTags(photo.tags || "");
    setIsEditing(false);
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhotoId) return;
      if (e.key === "Escape") selectPhoto(null);
      if (e.key === "ArrowLeft" && prevPhoto) selectPhoto(prevPhoto.id);
      if (e.key === "ArrowRight" && nextPhoto) selectPhoto(nextPhoto.id);
      if (e.key === "i") setShowInfo((s) => !s);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoId, prevPhoto, nextPhoto, selectPhoto]);

  const handleSave = useCallback(async () => {
    if (!photo) return;
    try {
      const res = await fetch(`/api/photos/${photo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          tags: editTags,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        updatePhoto(photo.id, updated);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error saving:", err);
    }
  }, [photo, editTitle, editDescription, editTags, updatePhoto]);

  const handleDelete = useCallback(async () => {
    if (!photo) return;
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
      if (res.ok) {
        deletePhoto(photo.id);
        selectPhoto(null);
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }, [photo, deletePhoto, selectPhoto]);

  const handleToggleFavorite = useCallback(async () => {
    if (!photo) return;
    toggleFavorite(photo.id);
    try {
      await fetch(`/api/photos/${photo.id}/favorite`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Error with favorite:", err);
    }
  }, [photo, toggleFavorite]);

  const handleAddComment = useCallback(async () => {
    if (!photo || !commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/photos/${photo.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText }),
      });
      if (res.ok) {
        const comment = await res.json();
        addComment(photo.id, comment);
        setCommentText("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [photo, commentText, addComment]);

  if (!photo) return null;

  return (
    <AnimatePresence>
      {selectedPhotoId && (
        <motion.div
          className="fixed inset-0 z-50 bg-[#1a1a1a] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#212124] border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                onClick={() => selectPhoto(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#0063dc] flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-tight">
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-6 text-sm font-medium bg-white/10 border-white/20 text-white w-64"
                      />
                    ) : (
                      photo.title
                    )}
                  </p>
                  {photo.album && (
                    <p className="text-white/50 text-xs flex items-center gap-1">
                      <Folder className="h-3 w-3" /> {photo.album.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Action buttons - Flickr style */}
              <Button
                variant="ghost"
                size="sm"
                className={`text-white/70 hover:text-white hover:bg-white/10 gap-1.5 h-8 ${
                  photo.favorite ? "text-[#ff0084]" : ""
                }`}
                onClick={handleToggleFavorite}
              >
                <Heart className={`h-4 w-4 ${photo.favorite ? "fill-[#ff0084]" : ""}`} />
                <span className="hidden sm:inline text-xs">{t("photo.favorite")}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 h-8"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">{t("photo.share")}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 h-8"
                asChild
              >
                <a href={photo.filepath} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{t("photo.download")}</span>
                </a>
              </Button>
              <Separator orientation="vertical" className="h-5 mx-1 bg-white/10" />
              {isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#0063dc] hover:bg-white/10 gap-1.5 h-8"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4" />
                  <span className="text-xs">{t("common.save")}</span>
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 h-8"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4" />
                  <span className="text-xs">{t("common.edit")}</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-red-400 hover:bg-white/10 gap-1.5 h-8"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-xs">{t("common.delete")}</span>
              </Button>
              <Separator orientation="vertical" className="h-5 mx-1 bg-white/10" />
              <Button
                variant="ghost"
                size="sm"
                className={`hover:bg-white/10 h-8 gap-1.5 ${showInfo ? "text-white" : "text-white/50"}`}
                onClick={() => setShowInfo(!showInfo)}
              >
                <Maximize2 className="h-4 w-4" />
                <span className="text-xs">{t("photo.info")}</span>
              </Button>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Photo area */}
            <div className="flex-1 flex items-center justify-center relative bg-[#1a1a1a]">
              {/* Navigation arrows */}
              {prevPhoto && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 h-12 w-12 rounded-full"
                  onClick={() => selectPhoto(prevPhoto.id)}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}
              {nextPhoto && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 h-12 w-12 rounded-full"
                  onClick={() => selectPhoto(nextPhoto.id)}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Photo with white frame like Flickr */}
              <div className="max-w-[85%] max-h-[90%] p-3 bg-white shadow-2xl">
                <img
                  src={photo.filepath}
                  alt={photo.title}
                  className="max-w-full max-h-[calc(100vh-180px)] object-contain"
                />
              </div>
            </div>

            {/* Right sidebar - Flickr style info panel */}
            {showInfo && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 340, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-[#212124] border-l border-white/10 flex flex-col shrink-0 overflow-hidden"
              >
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-5 text-white">
                    {/* Stats row - Flickr style */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-white/70">
                        <Eye className="h-4 w-4" /> {photo.views}
                      </span>
                      <span className="flex items-center gap-1.5 text-white/70">
                        <Heart className={`h-4 w-4 ${photo.favorite ? "fill-[#ff0084] text-[#ff0084]" : ""}`} />
                        {photo.favorite ? 1 : 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-white/70">
                        <MessageCircle className="h-4 w-4" /> {photo.comments?.length || 0}
                      </span>
                    </div>

                    {/* Description */}
                    {isEditing ? (
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder={t("photo.addDescription")}
                        rows={3}
                        className="bg-white/5 border-white/10 text-white text-sm resize-none"
                      />
                    ) : (
                      photo.description && (
                        <p className="text-sm text-white/80 leading-relaxed">{photo.description}</p>
                      )
                    )}

                    {/* Tags */}
                    {isEditing ? (
                      <Input
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder={t("photo.tagPlaceholder")}
                        className="bg-white/5 border-white/10 text-white text-sm"
                      />
                    ) : (
                      photo.tags && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-white/50 uppercase tracking-wide">{t("photo.tag")}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {photo.tags.split(",").map((tag) => (
                              <Badge
                                key={tag.trim()}
                                variant="secondary"
                                className="text-xs bg-white/10 text-white/70 hover:bg-white/20 border-0 cursor-pointer"
                              >
                                <Tag className="h-2.5 w-2.5 mr-1" />
                                {tag.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    )}

                    <Separator className="bg-white/10" />

                    {/* Photo details - Flickr style */}
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-white/50 uppercase tracking-wide">{t("photo.photoDetails")}</p>

                      <div className="space-y-2.5 text-sm">
                        {photo.width && photo.height && (
                          <div className="flex justify-between">
                            <span className="text-white/50">{t("photo.dimensions")}</span>
                            <span className="text-white/80">{photo.width} × {photo.height}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-white/50">{t("photo.fileSize")}</span>
                          <span className="text-white/80">
                            {photo.size > 1048576
                              ? `${(photo.size / 1048576).toFixed(1)} MB`
                              : `${(photo.size / 1024).toFixed(0)} KB`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-white/50">{t("photo.type")}</span>
                          <span className="text-white/80">{photo.mimetype.split("/")[1]?.toUpperCase()}</span>
                        </div>
                        {photo.album && (
                          <div className="flex justify-between items-center">
                            <span className="text-white/50">{t("photo.album")}</span>
                            <Badge variant="secondary" className="text-xs bg-white/10 text-white/70 border-0">
                              <Folder className="h-2.5 w-2.5 mr-1" />
                              {photo.album.name}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Dates - Flickr style */}
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-white/50 uppercase tracking-wide">{t("photo.dates")}</p>
                      <div className="space-y-2.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/50 flex items-center gap-1.5">
                            <Camera className="h-3.5 w-3.5" /> {t("photo.taken")}
                          </span>
                          <span className="text-white/80">
                            {format(new Date(photo.createdAt), "d MMMM yyyy", { locale: dateLocale })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" /> {t("photo.uploadedOn")}
                          </span>
                          <span className="text-white/80">
                            {format(new Date(photo.createdAt), "d MMMM yyyy", { locale: dateLocale })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Comments section - Flickr style */}
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-white/50 uppercase tracking-wide flex items-center gap-1.5">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {t("comments.title")} ({photo.comments?.length || 0})
                      </p>

                      {photo.comments && photo.comments.length > 0 && (
                        <div className="space-y-3">
                          {photo.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#0063dc]/30 flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-[#0063dc]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-white/90">{comment.authorId.slice(0, 8)}...</p>
                                <p className="text-sm text-white/70 mt-0.5">{comment.text}</p>
                                <p className="text-[10px] text-white/40 mt-1">
                                  {format(new Date(comment.createdAt), "d MMM yyyy '" + t("comments.at") + "' HH:mm", { locale: dateLocale })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add comment */}
                      <div className="space-y-2 pt-1">
                        <div className="flex gap-2">
                          <Input
                            placeholder={t("comments.addComment")}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                              }
                            }}
                            className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30"
                          />
                          <Button
                            size="sm"
                            onClick={handleAddComment}
                            disabled={!commentText.trim() || isSubmitting}
                            className="h-8 bg-[#0063dc] hover:bg-[#0052b5] shrink-0 px-3"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </div>

          {/* Bottom thumbnail strip - Flickr style */}
          <div className="bg-[#212124] border-t border-white/10 px-4 py-2 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto">
              {photos.slice(Math.max(0, currentIndex - 5), currentIndex + 10).map((p) => (
                <button
                  key={p.id}
                  className={`shrink-0 rounded overflow-hidden border-2 transition-all ${
                    p.id === selectedPhotoId
                      ? "border-[#0063dc] opacity-100"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                  onClick={() => selectPhoto(p.id)}
                >
                  <img
                    src={p.thumbnail || p.filepath}
                    alt={p.title}
                    className="w-12 h-12 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
