"use client";

import { useAppStore } from "@/lib/store";
import { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  ImagePlus,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

interface UploadFile {
  file: File;
  preview: string;
  title: string;
  description: string;
  tags: string;
  albumId: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
}

export function UploadModal() {
  const { isUploadOpen, toggleUpload, albums, addPhoto } = useAppStore();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const updateFile = useCallback(
    (index: number, updates: Partial<UploadFile>) => {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
      );
    },
    []
  );

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

        // Step 1: Upload the file
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

        updateFile(index, { progress: 80 });
        const photoRes = await fetch("/api/photos", {
          method: "POST",
          body: photoFormData,
        });

        if (!photoRes.ok) throw new Error("Photo creation failed");
        const photo = await photoRes.json();

        updateFile(index, { progress: 100, status: "done" });
        addPhoto(photo);
      } catch (error) {
        console.error("Upload error:", error);
        updateFile(index, { status: "error" });
      }
    },
    [updateFile, addPhoto]
  );

  const uploadAll = useCallback(async () => {
    const pending = files.filter((f) => f.status === "pending");
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === "pending") {
        await uploadSingleFile(files[i], i);
      }
    }
  }, [files, uploadSingleFile]);

  const handleClose = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    toggleUpload();
  }, [files, toggleUpload]);

  return (
    <Dialog open={isUploadOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#0063dc]" />
            Carica Foto
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-[#0063dc] bg-[#0063dc]/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Trascina le foto qui</p>
            <p className="text-sm text-muted-foreground mt-1">
              oppure clicca per selezionare file
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => fileInputRef.current?.click()}
            >
              Scegli File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          <AnimatePresence>
            {files.map((uploadFile, index) => (
              <motion.div
                key={uploadFile.preview}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={uploadFile.preview}
                    alt={uploadFile.title}
                    className="w-16 h-16 object-cover rounded-md shrink-0"
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Input
                        value={uploadFile.title}
                        onChange={(e) =>
                          updateFile(index, { title: e.target.value })
                        }
                        className="h-7 text-sm font-medium"
                        placeholder="Titolo"
                        disabled={uploadFile.status !== "pending"}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 ml-2"
                        onClick={() => removeFile(index)}
                        disabled={uploadFile.status === "uploading"}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={uploadFile.albumId}
                        onValueChange={(value) =>
                          updateFile(index, { albumId: value === "none" ? "" : value })
                        }
                        disabled={uploadFile.status !== "pending"}
                      >
                        <SelectTrigger className="h-7 text-xs w-32">
                          <SelectValue placeholder="Album" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nessun album</SelectItem>
                          {albums.map((album) => (
                            <SelectItem key={album.id} value={album.id}>
                              {album.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={uploadFile.tags}
                        onChange={(e) =>
                          updateFile(index, { tags: e.target.value })
                        }
                        placeholder="Tag (virgola)"
                        className="h-7 text-xs flex-1"
                        disabled={uploadFile.status !== "pending"}
                      />
                    </div>
                    <Textarea
                      value={uploadFile.description}
                      onChange={(e) =>
                        updateFile(index, { description: e.target.value })
                      }
                      placeholder="Descrizione..."
                      className="h-16 text-xs resize-none"
                      disabled={uploadFile.status !== "pending"}
                    />
                  </div>
                  {/* Status indicator */}
                  <div className="shrink-0">
                    {uploadFile.status === "done" && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                    {uploadFile.status === "uploading" && (
                      <Loader2 className="h-5 w-5 text-[#0063dc] animate-spin" />
                    )}
                    {uploadFile.status === "error" && (
                      <span className="text-xs text-destructive">Errore</span>
                    )}
                  </div>
                </div>
                {uploadFile.status === "uploading" && (
                  <Progress value={uploadFile.progress} className="h-1.5" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Upload button */}
        {files.length > 0 && (
          <div className="pt-4 border-t">
            <Button
              onClick={uploadAll}
              disabled={
                files.length === 0 ||
                files.every((f) => f.status !== "pending")
              }
              className="w-full bg-[#0063dc] hover:bg-[#0052b5]"
            >
              {files.some((f) => f.status === "uploading") ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Caricamento...
                </>
              ) : files.every((f) => f.status === "done") ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Completato!
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Carica {files.filter((f) => f.status === "pending").length}{" "}
                  foto
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
