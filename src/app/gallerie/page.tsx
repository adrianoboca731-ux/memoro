"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { EmptyState } from "@/components/empty-state";
import {
  LayoutGrid,
  Plus,
  Trash2,
  Image as ImageIcon,
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
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function GalleriePage() {
  const { t } = useI18n();
  const [galleries, setGalleries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchGalleries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/galleries");
      if (res.ok) {
        const data = await res.json();
        setGalleries(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Errore nel caricamento:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGalleries();
  }, [fetchGalleries]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (res.ok) {
        const gallery = await res.json();
        setGalleries((prev) => [gallery, ...prev]);
        setNewName("");
        setNewDesc("");
        setCreateOpen(false);
      }
    } catch (err) {
      console.error("Errore nella creazione:", err);
    } finally {
      setIsCreating(false);
    }
  }, [newName, newDesc]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("t("galleries.deleteConfirm")")) return;
    try {
      const res = await fetch(`/api/galleries/${id}`, { method: "DELETE" });
      if (res.ok) setGalleries((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error("Errore:", err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <LayoutGrid className="h-8 w-8 text-[#ff0084]" />
                  {t("galleries.yourGalleries")}
                </h1>
                <p className="text-white/40 mt-1">{t("galleries.subtitle")}</p>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#ff0084] to-[#0063dc] hover:opacity-90 text-white gap-1.5"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {t("galleries.createNew")}
              </Button>
            </div>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg bg-white/5" />
              ))}
            </div>
          ) : galleries.length === 0 ? (
            <EmptyState
              icon={LayoutGrid}
              title={t("galleries.noGalleries")}
              description={t("galleries.noGalleriesDesc")}
              actionLabel={t("galleries.createNew")}
              onAction={() => setCreateOpen(true)}
            />
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
                    <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow bg-white/5 border-white/10">
                      <Link href={`/gallerie/${gallery.id}`}>
                        <CardContent className="p-0">
                          <div className="aspect-square relative bg-white/5 overflow-hidden">
                            {gallery.cover ? (
                              <img
                                src={gallery.cover}
                                alt={gallery.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff0084]/20 to-[#0063dc]/20">
                                <LayoutGrid className="h-12 w-12 text-white/10" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDelete(gallery.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-3">
                            <h3 className="font-medium text-sm truncate text-white/80">{gallery.name}</h3>
                            <p className="text-xs text-white/40 mt-0.5">
                              {gallery.itemCount ?? gallery.items?.length ?? 0} {t("common.photos")}
                            </p>
                            {gallery.description && (
                              <p className="text-xs text-white/25 mt-1 line-clamp-2">{gallery.description}</p>
                            )}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#2a2a2d] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{t("galleries.createTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("galleries.galleryName")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
            <Textarea
              placeholder={t("galleries.galleryDesc")}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            />
            <Button
              onClick={handleCreate}
              disabled={!newName.trim() || isCreating}
              className="w-full bg-gradient-to-r from-[#ff0084] to-[#0063dc] hover:opacity-90 text-white"
            >
              {isCreating ? t("common.creating") : t("galleries.createButton")}
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
