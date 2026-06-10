"use client";

import { useAppStore, Gallery } from "@/lib/store";
import { useState, useCallback } from "react";
import {
  LayoutGrid,
  Plus,
  Trash2,
  Image as ImageIcon,
  Eye,
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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { PhotoGrid } from "./photo-grid";

export function GalleriesView() {
  const {
    galleries,
    selectedGalleryId,
    selectGallery,
    photos,
    addGallery,
    deleteGallery,
  } = useAppStore();

  const [newGalleryName, setNewGalleryName] = useState("");
  const [newGalleryDesc, setNewGalleryDesc] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGallery = useCallback(async () => {
    if (!newGalleryName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGalleryName,
          description: newGalleryDesc,
        }),
      });
      if (res.ok) {
        const gallery = await res.json();
        addGallery(gallery);
        setNewGalleryName("");
        setNewGalleryDesc("");
        setCreateOpen(false);
      }
    } catch (err) {
      console.error("Failed to create gallery:", err);
    } finally {
      setIsCreating(false);
    }
  }, [newGalleryName, newGalleryDesc, addGallery]);

  const handleDeleteGallery = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/galleries/${id}`, { method: "DELETE" });
        if (res.ok) deleteGallery(id);
      } catch (err) {
        console.error("Failed to delete gallery:", err);
      }
    },
    [deleteGallery]
  );

  // If a gallery is selected, show its items
  if (selectedGalleryId) {
    const gallery = galleries.find((g) => g.id === selectedGalleryId);
    const galleryPhotos = gallery?.items?.map((item) => item.photo) || photos.slice(0, 6);

    return (
      <div>
        <div className="flex items-center justify-between p-4 pb-0">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectGallery(null)}
              className="text-muted-foreground mb-1 -ml-2"
            >
              ← Tutte le Gallerie
            </Button>
            <h2 className="text-xl font-bold">{gallery?.name || "Galleria"}</h2>
            {gallery?.description && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {gallery.description}
              </p>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {gallery?.itemCount || galleryPhotos.length} foto
          </span>
        </div>
        <PhotoGrid photos={galleryPhotos} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-[#ff0084]" />
          Gallerie
        </h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <Button size="sm" className="bg-[#ff0084] hover:bg-[#d6006f] gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuova Galleria
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuova Galleria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nome della galleria"
                value={newGalleryName}
                onChange={(e) => setNewGalleryName(e.target.value)}
              />
              <Textarea
                placeholder="Descrizione (opzionale)"
                value={newGalleryDesc}
                onChange={(e) => setNewGalleryDesc(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleCreateGallery}
                disabled={!newGalleryName.trim() || isCreating}
                className="w-full bg-[#ff0084] hover:bg-[#d6006f]"
              >
                {isCreating ? "Creazione..." : "Crea Galleria"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        Le gallerie sono collezioni curate delle tue foto preferite. A differenza degli album, puoi organizzare le foto per tema o mood.
      </p>

      {galleries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <LayoutGrid className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Nessuna galleria ancora</p>
          <p className="text-sm">Crea una galleria per curare le tue foto preferite</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {galleries.map((gallery, index) => (
              <motion.div
                key={gallery.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
                  onClick={() => selectGallery(gallery.id)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square relative bg-muted overflow-hidden">
                      {gallery.cover ? (
                        <img
                          src={gallery.cover}
                          alt={gallery.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff0084]/20 to-[#0063dc]/20">
                          <LayoutGrid className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGallery(gallery.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{gallery.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {gallery.itemCount ?? 0} foto
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
