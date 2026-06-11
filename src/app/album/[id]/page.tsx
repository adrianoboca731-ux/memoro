"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/header";
import { PhotoCard } from "@/components/photo-card";
import { EmptyState } from "@/components/empty-state";
import {
  ArrowLeft,
  FolderOpen,
  Edit3,
  Trash2,
  Save,
  Image as ImageIcon,
  Plus,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { it, enUS, fr, de as deLocale, es as esLocale, ptBR, ja, ko, zhTW, zhCN } from "date-fns/locale";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const dateLocales: Record<string, any> = { it, en: enUS, fr, de: deLocale, es: esLocale, "pt-BR": ptBR, ja, ko, "zh-TW": zhTW, "zh-CN": zhCN };

export default function AlbumDetailPage() {
  const { t, locale } = useI18n();
  const dateLocale = dateLocales[locale] || it;
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const albumId = params.id as string;

  const [album, setAlbum] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchAlbum = useCallback(async () => {
    setLoading(true);
    try {
      const [albumRes, photosRes] = await Promise.all([
        fetch(`/api/albums/${albumId}`),
        fetch(`/api/photos?albumId=${albumId}&limit=100`),
      ]);
      if (albumRes.ok) {
        const albumData = await albumRes.json();
        setAlbum(albumData);
        setEditName(albumData.name);
        setEditDescription(albumData.description || "");
      }
      if (photosRes.ok) {
        const photosData = await photosRes.json();
        setPhotos(photosData.photos || photosData);
      }
    } catch (err) {
      console.error("Error loading:", err);
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    fetchAlbum();
  }, [fetchAlbum]);

  const isOwner = session?.user && album && (session.user as any).id === album.userId;

  const handleSave = useCallback(async () => {
    if (!album) return;
    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDescription }),
      });
      if (res.ok) {
        setAlbum((prev: any) => ({ ...prev, name: editName, description: editDescription }));
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error saving:", err);
    }
  }, [albumId, album, editName, editDescription]);

  const handleDeleteAlbum = useCallback(async () => {
    if (!confirm(t("albums.deleteAlbumAndPhotos"))) return;
    try {
      const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" });
      if (res.ok) router.push("/album");
    } catch (err) {
      console.error("Error deleting:", err);
    }
  }, [albumId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-8 w-48 bg-white/5" />
          <Skeleton className="h-4 w-32 bg-white/5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-[#0d0d0d]">
        <Header />
        <EmptyState icon={FolderOpen} title={t("albums.albumNotFound")} description={t("albums.albumNotFoundDesc")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/album")}
            className="text-white/50 hover:text-white hover:bg-white/5 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> {t("albums.allAlbums")}
          </Button>

          {/* Album header with cover */}
          <div className="relative rounded-xl overflow-hidden">
            {album.cover ? (
              <div className="h-48 md:h-64 relative">
                <img
                  src={album.cover}
                  alt={album.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-2xl font-bold bg-white/10 border-white/20 text-white mb-2"
                    />
                  ) : (
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{album.name}</h1>
                  )}
                  {isEditing ? (
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder={t("albums.descriptionPlaceholder")}
                      rows={2}
                      className="bg-white/10 border-white/20 text-white text-sm resize-none mt-2"
                    />
                  ) : (
                    album.description && (
                      <p className="text-white/60 mt-1 text-sm">{album.description}</p>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="h-32 md:h-48 bg-gradient-to-br from-[#0063dc]/20 to-[#ff0084]/20 flex items-end p-6">
                <div>
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-2xl font-bold bg-white/10 border-white/20 text-white"
                    />
                  ) : (
                    <h1 className="text-2xl md:text-3xl font-bold text-white">{album.name}</h1>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-white/40">
              <span className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" /> {photos.length} {t("common.photos")}
              </span>
              <span>&bull;</span>
              <span>{t("common.createdAt")} {format(new Date(album.createdAt), "d MMMM yyyy", { locale: dateLocale })}</span>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSave} className="bg-[#0063dc] hover:bg-[#0052b5] text-white gap-1">
                      <Save className="h-4 w-4" /> {t("common.save")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="border-white/20 text-white/70">
                      {t("common.cancel")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="border-white/10 text-white/70 hover:bg-white/5 gap-1"
                    >
                      <Edit3 className="h-4 w-4" /> {t("albums.editAlbum")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeleteAlbum}
                      className="border-red-500/20 text-red-400 hover:bg-red-500/10 gap-1"
                    >
                      <Trash2 className="h-4 w-4" /> {t("common.delete")}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          <Separator className="bg-white/5" />

          {/* Photo grid */}
          {photos.length === 0 ? (
            <EmptyState
              icon={Camera}
              title={t("albums.noPhotosInAlbum")}
              description={t("albums.addPhotosDesc")}
              actionLabel={t("albums.uploadPhotos")}
              onAction={() => router.push("/carica")}
            />
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
              {photos.map((photo: any, index: number) => (
                <motion.div
                  key={photo.id}
                  className="break-inside-avoid"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.5) }}
                >
                  <PhotoCard photo={photo} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; {t("home.footerShort")}</span>
      </footer>
    </div>
  );
}
