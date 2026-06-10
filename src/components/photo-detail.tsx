"use client";

import { useAppStore, Photo } from "@/lib/store";
import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentIndex = photos.findIndex((p) => p.id === selectedPhotoId);
  const prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null;

  useEffect(() => {
    if (selectedPhotoId) {
      const found = photos.find((p) => p.id === selectedPhotoId);
      if (found) {
        setPhoto(found);
        setEditTitle(found.title);
        setEditDescription(found.description || "");
        setEditTags(found.tags || "");
      }
    } else {
      setPhoto(null);
    }
  }, [selectedPhotoId, photos]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhotoId) return;
      if (e.key === "Escape") selectPhoto(null);
      if (e.key === "ArrowLeft" && prevPhoto) selectPhoto(prevPhoto.id);
      if (e.key === "ArrowRight" && nextPhoto) selectPhoto(nextPhoto.id);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoId, prevPhoto, nextPhoto, selectPhoto]);

  const handleSave = useCallback(async () => {
    if (!photo) return;
    try {
      const res = await fetch(`/api/photos/${photo.id}`, {
        method: "PATCH",
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
      console.error("Failed to save:", err);
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
      await fetch(`/api/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !photo.favorite }),
      });
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  }, [photo, toggleFavorite]);

  const handleAddComment = useCallback(async () => {
    if (!photo || !commentText.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/photos/${photo.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText, author: commentAuthor || "Anonimo" }),
      });
      if (res.ok) {
        const comment = await res.json();
        addComment(photo.id, comment);
        setCommentText("");
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [photo, commentText, commentAuthor, addComment]);

  if (!photo) return null;

  return (
    <AnimatePresence>
      {selectedPhotoId && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => selectPhoto(null)}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={() => selectPhoto(null)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation arrows */}
          {prevPhoto && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                selectPhoto(prevPhoto.id);
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}
          {nextPhoto && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
              onClick={(e) => {
                e.stopPropagation();
                selectPhoto(nextPhoto.id);
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Main content */}
          <div
            className="flex flex-col lg:flex-row w-full h-full max-w-[95vw] max-h-[95vh] pt-12 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
              <img
                src={photo.filepath}
                alt={photo.title}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>

            {/* Info panel */}
            <div className="w-full lg:w-80 xl:w-96 bg-background rounded-t-lg lg:rounded-l-none lg:rounded-r-lg overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Title & actions */}
                  <div className="flex items-start justify-between gap-2">
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="font-semibold"
                      />
                    ) : (
                      <h2 className="font-semibold text-lg">{photo.title}</h2>
                    )}
                    <div className="flex gap-1 shrink-0">
                      {isEditing ? (
                        <Button size="sm" onClick={handleSave} className="bg-[#0063dc] hover:bg-[#0052b5]">
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleToggleFavorite}
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            photo.favorite ? "fill-[#ff0084] text-[#ff0084]" : ""
                          }`}
                        />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {isEditing ? (
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Aggiungi una descrizione..."
                      rows={3}
                    />
                  ) : (
                    photo.description && (
                      <p className="text-sm text-muted-foreground">{photo.description}</p>
                    )
                  )}

                  {/* Tags */}
                  {isEditing ? (
                    <Input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="Tag separati da virgola..."
                    />
                  ) : (
                    photo.tags && (
                      <div className="flex flex-wrap gap-1.5">
                        {photo.tags.split(",").map((tag) => (
                          <Badge key={tag.trim()} variant="secondary" className="text-xs">
                            <Tag className="h-2.5 w-2.5 mr-1" />
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )
                  )}

                  <Separator />

                  {/* Meta info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>{photo.views} visualizzazioni</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(photo.createdAt), "d MMMM yyyy", { locale: it })}
                      </span>
                    </div>
                    {photo.album && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Folder className="h-4 w-4" />
                        <span>{photo.album.name}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Comments */}
                  <div>
                    <h3 className="font-medium text-sm mb-3 flex items-center gap-1.5">
                      <MessageCircle className="h-4 w-4" />
                      Commenti ({photo.comments?.length || 0})
                    </h3>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {photo.comments?.map((comment) => (
                        <div key={comment.id} className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-xs font-medium">{comment.author}</p>
                          <p className="text-sm mt-0.5">{comment.text}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(comment.createdAt), "d MMM yyyy", { locale: it })}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Add comment */}
                    <div className="mt-3 space-y-2">
                      <Input
                        placeholder="Il tuo nome"
                        value={commentAuthor}
                        onChange={(e) => setCommentAuthor(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Aggiungi un commento..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment();
                            }
                          }}
                          className="h-8 text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={handleAddComment}
                          disabled={!commentText.trim() || isSubmitting}
                          className="h-8 bg-[#0063dc] hover:bg-[#0052b5] shrink-0"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
