"use client";

import { useAppStore, Album } from "@/lib/store";
import { useState, useCallback } from "react";
import {
  FolderOpen,
  Plus,
  Trash2,
  Image as ImageIcon,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoGrid } from "./photo-grid";
import { useI18n } from "@/lib/i18n";

export function AlbumsView() {
  const {
    albums,
    selectedAlbumId,
    selectAlbum,
    photos,
    addAlbum,
    deleteAlbum,
  } = useAppStore();
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useI18n();

  const handleCreateAlbum = useCallback(async () => {
    if (!newAlbumName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAlbumName,
          description: newAlbumDesc,
        }),
      });
      if (res.ok) {
        const album = await res.json();
        addAlbum(album);
        setNewAlbumName("");
        setNewAlbumDesc("");
        setCreateOpen(false);
      }
    } catch (err) {
      console.error("Failed to create album:", err);
    } finally {
      setIsCreating(false);
    }
  }, [newAlbumName, newAlbumDesc, addAlbum]);

  const handleDeleteAlbum = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/albums/${id}`, { method: "DELETE" });
        if (res.ok) {
          deleteAlbum(id);
        }
      } catch (err) {
        console.error("Failed to delete album:", err);
      }
    },
    [deleteAlbum]
  );

  // If an album is selected, show its photos
  if (selectedAlbumId) {
    const album = albums.find((a) => a.id === selectedAlbumId);
    const albumPhotos = photos.filter((p) => p.albumId === selectedAlbumId);

    return (
      <div>
        <div className="flex items-center justify-between p-4 pb-0">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectAlbum(null)}
              className="text-muted-foreground mb-1 -ml-2"
            >
              ← {t("albums.allAlbums")}
            </Button>
            <h2 className="text-xl font-bold">{album?.name || t("nav.album")}</h2>
            {album?.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {album.description}
              </p>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {albumPhotos.length} {t("common.photos")}
          </span>
        </div>
        <PhotoGrid photos={albumPhotos} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t("nav.album")}</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#0063dc] hover:bg-[#0052b5] gap-1.5">
              <Plus className="h-4 w-4" />
              {t("albums.newAlbum")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("albums.createTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder={t("albums.albumName")}
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
              />
              <Textarea
                placeholder={t("albums.albumDesc")}
                value={newAlbumDesc}
                onChange={(e) => setNewAlbumDesc(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleCreateAlbum}
                disabled={!newAlbumName.trim() || isCreating}
                className="w-full bg-[#0063dc] hover:bg-[#0052b5]"
              >
                {isCreating ? t("common.creating") : t("albums.createButton")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FolderOpen className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">{t("albums.noAlbums")}</p>
          <p className="text-sm">{t("albums.noAlbumsDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {albums.map((album, index) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
                  onClick={() => selectAlbum(album.id)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square relative bg-muted overflow-hidden">
                      {album.cover ? (
                        <img
                          src={album.cover}
                          alt={album.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAlbum(album.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{album.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {album.photoCount ?? album.photos?.length ?? 0} {t("common.photos")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
