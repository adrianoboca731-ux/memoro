"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import {
  FolderOpen,
  Plus,
  Trash2,
  Image as ImageIcon,
  Camera,
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
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function AlbumPage() {
  const { t } = useI18n();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [newAlbumDesc, setNewAlbumDesc] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Errore nel caricamento degli album:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleCreateAlbum = useCallback(async () => {
    if (!newAlbumName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAlbumName, description: newAlbumDesc }),
      });
      if (res.ok) {
        const album = await res.json();
        setAlbums((prev) => [album, ...prev]);
        setNewAlbumName("");
        setNewAlbumDesc("");
        setCreateOpen(false);
      }
    } catch (err) {
      console.error("Errore nella creazione:", err);
    } finally {
      setIsCreating(false);
    }
  }, [newAlbumName, newAlbumDesc]);

  const handleDeleteAlbum = useCallback(async (id: string) => {
    if (!confirm(t("albums.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/albums/${id}`, { method: "DELETE" });
      if (res.ok) setAlbums((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Errore nell'eliminazione:", err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <FolderOpen className="h-8 w-8 text-[#0063dc]" />
                  {t("albums.yourAlbums")}
                </h1>
                <p className="text-white/40 mt-1">{t("albums.subtitle")}</p>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white gap-1.5"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t("albums.createNew")}
              </Button>
            </div>
          </motion.div>

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="bg-white/5 border-white/10 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-white/5 animate-pulse" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-white/5 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && albums.length === 0 && (
            <EmptyState
              icon={FolderOpen}
              title={t("albums.noAlbums")}
              description={t("albums.noAlbumsDesc")}
              actionLabel={t("albums.createNew")}
              onAction={() => setCreateOpen(true)}
            />
          )}

          {/* Albums grid */}
          {!loading && albums.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* Create new album card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className="group cursor-pointer overflow-hidden border-dashed border-white/20 hover:border-[#0063dc]/50 transition-colors"
                  onClick={() => setCreateOpen(true)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-square flex items-center justify-center bg-white/[0.02]">
                      <Plus className="h-12 w-12 text-white/15 group-hover:text-[#0063dc]/50 transition-colors" />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm text-white/40">{t("albums.newAlbum")}</h3>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <AnimatePresence>
                {albums.map((album, index) => (
                  <motion.div
                    key={album.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow bg-white/5 border-white/10">
                      <Link href={`/album/${album.id}`}>
                        <CardContent className="p-0">
                          <div className="aspect-square relative bg-white/5 overflow-hidden">
                            {album.cover ? (
                              <img
                                src={album.cover}
                                alt={album.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0063dc]/10 to-[#ff0084]/10">
                                <ImageIcon className="h-12 w-12 text-white/10" />
                              </div>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteAlbum(album.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-sm truncate text-white/80">{album.name}</h3>
                            <p className="text-xs text-white/40 mt-0.5">
                              {album.photos?.length || album.photoCount || 0} {t("common.photos")}
                            </p>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* Create Album Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#2a2a2d] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{t("albums.createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("albums.albumName")}
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            <Textarea
              placeholder={t("albums.albumDesc")}
              value={newAlbumDesc}
              onChange={(e) => setNewAlbumDesc(e.target.value)}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            />
            <Button
              onClick={handleCreateAlbum}
              disabled={!newAlbumName.trim() || isCreating}
              className="w-full bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white"
            >
              {isCreating ? t("common.creating") : t("albums.createButton")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; {t("home.footerShort")}</span>
      </footer>
    </div>
  );
}
