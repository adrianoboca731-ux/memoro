"use client";

import { useState, useCallback, useRef } from "react";
import { Header } from "@/components/header";
import {
  Upload,
  CloudUpload,
  X,
  ImagePlus,
  Loader2,
  Check,
  Camera,
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

  // Load albums for selection
  useState(() => {
    fetch("/api/albums")
      .then((res) => res.ok ? res.json() : [])
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

        // Step 1: Upload file to blob storage
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

        // Step 2: Create photo record
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
          <p className="text-xs text-white/20 mt-3">
            {t("upload.fileTypes")}
          </p>
        </motion.div>

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
                    {/* Preview */}
                    <div className="relative shrink-0">
                      <img
                        src={uploadFile.preview}
                        alt={uploadFile.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      {/* Status overlay */}
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

                    {/* Fields */}
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
                        <Select
                          value={uploadFile.contentType}
                          onValueChange={(v) => updateFile(index, { contentType: v })}
                          disabled={uploadFile.status !== "pending"}
                        >
                          <SelectTrigger className="h-7 text-xs w-28 bg-white/5 border-white/10 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2d] border-white/10">
                            <SelectItem value="photo">{t("upload.contentPhoto")}</SelectItem>
                            <SelectItem value="art">{t("upload.contentArt")}</SelectItem>
                            <SelectItem value="screenshot">{t("upload.contentScreenshot")}</SelectItem>
                            <SelectItem value="illustration">{t("upload.contentIllustration")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
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
              {pendingCount > 0 && ` &bull; ${pendingCount} {t("upload.pending")}`}
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
        <span className="bg-gradient-to-r from-[#0063dc] to-[#ff0084] bg-clip-text text-transparent font-bold">Memoro</span>
        <span className="ml-1">&mdash; {t("home.footerTagline")}</span>
      </footer>
    </div>
  );
}
