import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nessun file fornito" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo di file non valido. Formati accettati: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File troppo grande (massimo 10MB)" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Upload original to Vercel Blob
    const originalBlob = await put(`photos/${uniqueName}`, file, {
      access: "public",
      contentType: file.type,
    });

    // Process with Sharp
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let width: number | null = null;
    let height: number | null = null;
    let thumbnailUrl = originalBlob.url;
    let exifData: Record<string, string | null> = {};

    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width || null;
      height = metadata.height || null;

      // Extract EXIF data
      if (metadata.exif) {
        try {
          const exifParsed = metadata;
          exifData = {
            camera: metadata.make && metadata.model
              ? `${metadata.make} ${metadata.model}`
              : null,
            lens: metadata.lens || null,
            focalLength: metadata.focalLength ? String(metadata.focalLength) : null,
            aperture: metadata.aperture ? `f/${metadata.aperture}` : null,
            shutterSpeed: metadata.exposureTime ? `${metadata.exposureTime}s` : null,
            iso: metadata.iso ? String(metadata.iso) : null,
            software: metadata.software || null,
            flash: metadata.flash !== undefined ? String(metadata.flash) : null,
          };
        } catch {}
      }

      // Create thumbnail buffer
      const thumbBuffer = await sharp(buffer)
        .resize(400, null, { withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbName = `thumb-${uniqueName}`;
      const thumbBlob = await put(`photos/${thumbName}`, thumbBuffer, {
        access: "public",
        contentType: "image/jpeg",
      });
      thumbnailUrl = thumbBlob.url;
    } catch (err) {
      console.error("Thumbnail/EXIF creation failed:", err);
    }

    return NextResponse.json(
      {
        filename: uniqueName,
        filepath: originalBlob.url,
        thumbnail: thumbnailUrl,
        mimetype: file.type,
        size: file.size,
        width,
        height,
        exif: exifData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento del file" },
      { status: 500 }
    );
  }
}
