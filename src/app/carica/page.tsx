"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import {
  Upload,
  CloudUpload,
  X,
  ImagePlus,
  Loader2,
  Check,
  Camera,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  CheckSquare,
  Square,
  Download,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

interface FlickrPhoto {
  id: string;
  title: string;
  description: string;
  tags: string;
  dateUpload: string;
  originalFormat: string;
  thumbnail: string;
  medium: string;
  large: string;
  original: string;
  selected?: boolean;
  importing?: boolean;
  imported?: boolean;
  error?: boolean;
}

interface UploadFile {
  file: File;
  preview: string;
  title: string;
  description: string;
  tags: string;
  albumId: string;
  safetyLevel: string;
  contentType: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
}

function FlickrImportPanel({ t }: { t: (key: string, params?: Record<string, string>) => string }) {
  const searchParams = useSearchParams();
  const flickrConnected = searchParams.get("flickr") === "connected";
  const [accessToken, setAccessToken] = useState(searchParams.get("flickr_token") || "");
  const [accessTokenSecret, setAccessTokenSecret] = useState(searchParams.get("flickr_token_secret") || "");
  const [userNsid, setUserNsid] = useState(searchParams.get("flickr_nsid") || "");
  const [flickrUsername, setFlickrUsername] = useState(searchParams.get("flickr_username") || "");
  const [flickrFullname, setFlickrFullname] = useState(searchParams.get("flickr_fullname") || "");

  const [photos, setPhotos] = useState<FlickrPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [isExpanded, setIsExpanded] = useState(flickrConnected);

  // Load photos from Flickr
  const loadPhotos = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        token: accessToken,
        token_secret: accessTokenSecret,
        nsid: userNsid,
        page: String(p),
        per_page: "50",
      });
      const res = await fetch(`/api/flickr/photos?${params}`);
      if (!res.ok) throw new Error("Failed to fetch photos");
      const data = await res.json();
      setPhotos(
        (data.photos || []).map((p: FlickrPhoto) => ({
          ...p,
          selected: false,
        }))
      );
      setTotalPages(data.pages || 1);
      setTotalPhotos(data.total || 0);
      setPage(p);
    } catch (err) {
      console.error("Error loading Flickr photos:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, accessTokenSecret, userNsid]);

  useEffect(() => {
    if (flickrConnected && accessToken) {
      loadPhotos(1);
    }
  }, [flickrConnected, accessToken, loadPhotos]);

  // Connect to Flickr
  const connectFlickr = async () => {
    try {
      const res = await fetch("/api/flickr/auth");
      const data = await res.json();
      if (data.authUrl) {
        // Store token secret temporarily in session storage
        if (data.oauthTokenSecret) {
          sessionStorage.setItem("flickr_ts", data.oauthTokenSecret);
        }
        window.location.href = data.authUrl;
      }
    } catch (err) {
      console.error("Flickr auth error:", err);
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    const allSelected = photos.every((p) => p.selected);
    setPhotos(photos.map((p) => ({ ...p, selected: !allSelected })));
  };

  // Toggle select one
  const toggleSelect = (id: string) => {
    setPhotos(photos.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)));
  };

  // Import selected photos
  const importSelected = async () => {
    const selected = photos.filter((p) => p.selected && !p.imported);
    if (selected.length === 0) return;

    setImporting(true);
    setImportProgress(0);
    setImportedCount(0);
    setErrorCount(0);

    let imported = 0;
    let errors = 0;

    for (let i = 0; i < selected.length; i++) {
      const photo = selected[i];
      const imageUrl = photo.original || photo.large || photo.medium;

      if (!imageUrl) {
        errors++;
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, error: true, selected: false } : p))
        );
        continue;
      }

      try {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, importing: true } : p))
        );

        const res = await fetch("/api/flickr/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photos: [
              {
                imageUrl,
                title: photo.title,
                description: photo.description,
                tags: photo.tags,
              },
            ],
          }),
        });

        if (!res.ok) throw new Error("Import failed");

        imported++;
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, importing: false, imported: true, selected: false } : p
          )
        );
      } catch {
        errors++;
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, importing: false, error: true, selected: false } : p
          )
        );
      }

      setImportProgress(Math.round(((i + 1) / selected.length) * 100));
      setImportedCount(imported);
      setErrorCount(errors);
    }

    setImporting(false);
  };

  const selectedCount = photos.filter((p) => p.selected).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      {/* Flickr Import Header */}
      <div
        className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0063dc]/10 to-[#ff0084]/10 p-5 cursor-pointer hover:border-white/20 transition-all"
        onClick={() => !flickrConnected && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0063dc] to-[#ff0084] flex items-center justify-center">
              <ExternalLink className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">{t("flickr.importTitle")}</h2>
              <p className="text-white/40 text-sm">{t("flickr.importSubtitle")}</p>
            </div>
          </div>
          {!flickrConnected ? (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                connectFlickr();
              }}
              className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] text-white hover:opacity-90 gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {t("flickr.connect")}
            </Button>
          ) : (
            <Badge className="bg-green-500/20 text-green-400 border-0">
              <Check className="h-3 w-3 mr-1" />
              {t("flickr.connected")}
            </Badge>
          )}
        </div>
      </div>

      {/* Flickr Connected - Show Photos */}
      {flickrConnected && isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4"
        >
          {/* User info */}
          <div className="flex items-center gap-3 mb-4 bg-white/5 rounded-lg p-3">
            <div className="w-8 h-8 rounded-full bg-[#0063dc] flex items-center justify-center text-white text-sm font-bold">
              {(flickrFullname || flickrUsername).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-sm font-medium">{flickrFullname || flickrUsername}</p>
              <p className="text-white/30 text-xs">
                {totalPhotos} {t("flickr.photosAvailable")}
              </p>
            </div>
          </div>

          {/* Select controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                className="text-white/60 hover:text-white hover:bg-white/5 gap-1.5"
              >
                {photos.every((p) => p.selected) ? (
                  <CheckSquare className="h-4 w-4 text-[#ff0084]" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {t("flickr.selectAll")}
              </Button>
              {selectedCount > 0 && (
                <Badge className="bg-[#ff0084]/20 text-[#ff0084] border-0">
                  {selectedCount} {t("flickr.selected")}
                </Badge>
              )}
            </div>
            {selectedCount > 0 && (
              <Button
                onClick={importSelected}
                disabled={importing}
                className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] text-white hover:opacity-90 gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("flickr.importing")}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {t("flickr.importCount", { count: String(selectedCount) })}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Import progress */}
          {importing && (
            <div className="mb-4">
              <Progress value={importProgress} className="h-2" />
              <p className="text-xs text-white/40 mt-1 text-center">
                {importProgress}% — {t("flickr.importedCount", { count: String(importedCount) })}
                {errorCount > 0 && ` / ${errorCount} ${t("flickr.errors")}`}
              </p>
            </div>
          )}

          {/* Photo grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 text-[#0063dc] animate-spin" />
              <span className="ml-3 text-white/50">{t("flickr.loadingPhotos")}</span>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Camera className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("flickr.noPhotos")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group transition-all ${
                    photo.imported
                      ? "opacity-50 ring-2 ring-green-500/50"
                      : photo.error
                      ? "opacity-50 ring-2 ring-red-500/50"
                      : photo.selected
                      ? "ring-2 ring-[#ff0084]"
                      : "hover:ring-1 hover:ring-white/30"
                  }`}
                  onClick={() => !photo.imported && !importing && toggleSelect(photo.id)}
                >
                  <img
                    src={photo.thumbnail || photo.medium}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Selection overlay */}
                  {photo.selected && !photo.imported && (
                    <div className="absolute inset-0 bg-[#ff0084]/30 flex items-center justify-center">
                      <CheckSquare className="h-6 w-6 text-white" />
                    </div>
                  )}

                  {/* Imported overlay */}
                  {photo.imported && (
                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-400" />
                    </div>
                  )}

                  {/* Error overlay */}
                  {photo.error && (
                    <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-400" />
                    </div>
                  )}

                  {/* Importing overlay */}
                  {photo.importing && (
                    <div className="absolute inset-0 bg-[#0063dc]/30 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}

                  {/* Title on hover */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] truncate">{photo.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => loadPhotos(page - 1)}
                className="text-white/50 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-white/40 text-sm">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => loadPhotos(page + 1)}
                className="text-white/50 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

interface UploadFile {
  file: File;
  preview: string;
  title: string;
  description: string;
  tags: string;
  albumId: string;
  safetyLevel: string;
  contentType: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
}

export default function CaricaPage() {
  const { t } = useI18n();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [albums, setAlbums] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useState(() => {
    fetch("/api/albums")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAlbums(Array.isArray(data) ? data : []))
      .catch(() => {});
  });

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles).filter((f) =>
      ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(f.type)
    );

    const uploadFiles: UploadFile[] = fileArray.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^/.]+$/, ""),
      description: "",
      tags: "",
      albumId: "",
      safetyLevel: "safe",
      contentType: "photo",
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const updateFile = useCallback((index: number, updates: Partial<UploadFile>) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  const uploadSingleFile = useCallback(
    async (uploadFile: UploadFile, index: number) => {
      try {
        updateFile(index, { status: "uploading", progress: 10 });

        const formData = new FormData();
        formData.append("file", uploadFile.file);
        updateFile(index, { progress: 30 });

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData = await uploadRes.json();

        updateFile(index, { progress: 60 });

        const photoFormData = new FormData();
        photoFormData.append("title", uploadFile.title);
        photoFormData.append("description", uploadFile.description);
        photoFormData.append("filename", uploadData.filename);
        photoFormData.append("filepath", uploadData.filepath);
        if (uploadData.thumbnail) photoFormData.append("thumbnail", uploadData.thumbnail);
        photoFormData.append("mimetype", uploadData.mimetype);
        photoFormData.append("size", String(uploadData.size));
        if (uploadData.width) photoFormData.append("width", String(uploadData.width));
        if (uploadData.height) photoFormData.append("height", String(uploadData.height));
        photoFormData.append("tags", uploadFile.tags);
        if (uploadFile.albumId) photoFormData.append("albumId", uploadFile.albumId);
        photoFormData.append("safetyLevel", uploadFile.safetyLevel);
        photoFormData.append("contentRating", uploadFile.contentType);

        updateFile(index, { progress: 80 });
        const photoRes = await fetch("/api/photos", {
          method: "POST",
          body: photoFormData,
        });

        if (!photoRes.ok) throw new Error("Photo creation failed");
        updateFile(index, { progress: 100, status: "done" });
      } catch (error) {
        console.error("Upload error:", error);
        updateFile(index, { status: "error" });
      }
    },
    [updateFile]
  );

  const uploadAll = useCallback(async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "pending") {
        await uploadSingleFile(files[i], i);
      }
    }
  }, [files, uploadSingleFile]);

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const totalCount = files.length;

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Upload className="h-8 w-8 text-[#0063dc]" />
            {t("upload.title")}
          </h1>
          <p className="text-white/40 mt-1">{t("upload.subtitle")}</p>
        </motion.div>

        {/* Drop zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mt-8 border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
            dragActive
              ? "border-[#0063dc] bg-[#0063dc]/10 scale-[1.01]"
              : "border-white/15 hover:border-white/30 bg-white/[0.02]"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <CloudUpload className="h-16 w-16 mx-auto text-white/20 mb-4" />
          <p className="text-xl font-medium text-white/70">{t("upload.dragHere")}</p>
          <p className="text-sm text-white/30 mt-2">{t("upload.orClick")}</p>
          <Button
            variant="outline"
            size="lg"
            className="mt-4 border-white/20 text-white/70 hover:bg-white/5 hover:text-white"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-5 w-5 mr-2" />
            {t("upload.chooseFiles")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <p className="text-xs text-white/20 mt-3">{t("upload.fileTypes")}</p>
        </motion.div>

        {/* Flickr Import Section */}
        <Suspense fallback={<div className="mt-8 h-40 bg-white/5 rounded-xl animate-pulse" />}>
          <FlickrImportPanel t={t} />
        </Suspense>

        {/* File list */}
        <AnimatePresence>
          {files.map((uploadFile, index) => (
            <motion.div
              key={uploadFile.preview}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <Card className="bg-white/5 border-white/10 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={uploadFile.preview}
                        alt={uploadFile.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      {uploadFile.status === "done" && (
                        <div className="absolute inset-0 bg-green-500/30 rounded-lg flex items-center justify-center">
                          <Check className="h-8 w-8 text-green-400" />
                        </div>
                      )}
                      {uploadFile.status === "uploading" && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-[#0063dc] animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-center justify-between">
                        <Input
                          value={uploadFile.title}
                          onChange={(e) => updateFile(index, { title: e.target.value })}
                          className="h-8 text-sm font-medium bg-white/5 border-white/10 text-white"
                          placeholder={t("upload.photoTitle")}
                          disabled={uploadFile.status !== "pending"}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white/40 hover:text-red-400 ml-2 shrink-0"
                          onClick={() => removeFile(index)}
                          disabled={uploadFile.status === "uploading"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={uploadFile.description}
                        onChange={(e) => updateFile(index, { description: e.target.value })}
                        placeholder={t("upload.description")}
                        className="h-16 text-xs bg-white/5 border-white/10 text-white resize-none"
                        disabled={uploadFile.status !== "pending"}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Input
                          value={uploadFile.tags}
                          onChange={(e) => updateFile(index, { tags: e.target.value })}
                          placeholder={t("upload.tags")}
                          className="h-7 text-xs bg-white/5 border-white/10 text-white flex-1 min-w-[150px]"
                          disabled={uploadFile.status !== "pending"}
                        />
                        <Select
                          value={uploadFile.albumId}
                          onValueChange={(v) => updateFile(index, { albumId: v === "none" ? "" : v })}
                          disabled={uploadFile.status !== "pending"}
                        >
                          <SelectTrigger className="h-7 text-xs w-36 bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder={t("upload.album")} />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2d] border-white/10">
                            <SelectItem value="none">{t("upload.noAlbum")}</SelectItem>
                            {albums.map((album) => (
                              <SelectItem key={album.id} value={album.id}>
                                {album.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={uploadFile.safetyLevel}
                          onValueChange={(v) => updateFile(index, { safetyLevel: v })}
                          disabled={uploadFile.status !== "pending"}
                        >
                          <SelectTrigger className="h-7 text-xs w-28 bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2d] border-white/10">
                            <SelectItem value="safe">
                              <span className="flex items-center gap-1.5">
                                <Badge className="bg-green-500/80 text-white text-[9px] h-3.5 px-1 border-0">S</Badge>
                                {t("safety.safe")}
                              </span>
                            </SelectItem>
                            <SelectItem value="moderate">
                              <span className="flex items-center gap-1.5">
                                <Badge className="bg-yellow-500/80 text-black text-[9px] h-3.5 px-1 border-0">M</Badge>
                                {t("safety.moderate")}
                              </span>
                            </SelectItem>
                            <SelectItem value="restricted">
                              <span className="flex items-center gap-1.5">
                                <Badge className="bg-red-500/80 text-white text-[9px] h-3.5 px-1 border-0">R</Badge>
                                {t("safety.restricted")}
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  {uploadFile.status === "uploading" && (
                    <Progress value={uploadFile.progress} className="h-1.5 mt-3" />
                  )}
                  {uploadFile.status === "error" && (
                    <p className="text-xs text-red-400 mt-2">{t("upload.uploadError")}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Upload all button */}
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-between"
          >
            <p className="text-sm text-white/40">
              {doneCount}/{totalCount} {t("upload.completed")}
              {pendingCount > 0 && ` \u2022 ${pendingCount} ${t("upload.pending")}`}
            </p>
            <Button
              size="lg"
              onClick={uploadAll}
              disabled={pendingCount === 0 || files.some((f) => f.status === "uploading")}
              className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] hover:opacity-90 text-white gap-2 px-8"
            >
              {files.some((f) => f.status === "uploading") ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("upload.uploading")}
                </>
              ) : doneCount === totalCount && totalCount > 0 ? (
                <>
                  <Check className="h-5 w-5" />
                  {t("common.completed")}
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  {t("upload.uploadCount", { count: String(pendingCount) })}
                </>
              )}
            </Button>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-white/5 py-4 px-4 text-center text-xs text-white/20 mt-8">
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">
          Memoro
        </span>
        <span className="ml-1">&mdash; {t("home.footerTagline")}</span>
      </footer>
    </div>
  );
}
