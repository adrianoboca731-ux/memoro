import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `photos/${userId}/${timestamp}-${sanitizedFilename}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type,
    });

    // Extract dimensions if possible (return basic info)
    const result: Record<string, unknown> = {
      filename: file.name,
      filepath: blob.url,
      thumbnail: blob.url,
      mimetype: file.type,
      size: file.size,
    };

    // Try to get image dimensions
    try {
      if (typeof globalThis !== "undefined") {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // Basic dimension extraction from JPEG/PNG headers
        const dims = getImageDimensions(buffer, file.type);
        if (dims) {
          result.width = dims.width;
          result.height = dims.height;
        }
      }
    } catch {
      // Ignore dimension extraction errors
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

function getImageDimensions(buffer: Buffer, mimetype: string): { width: number; height: number } | null {
  try {
    if (mimetype === "image/png") {
      // PNG: width and height are at bytes 16-23
      if (buffer.length >= 24) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }
    } else if (mimetype === "image/jpeg") {
      // JPEG: need to find SOF marker
      let offset = 2; // Skip SOI marker
      while (offset < buffer.length - 1) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          // SOF0, SOF1, SOF2
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        // Skip to next marker
        const segLength = buffer.readUInt16BE(offset + 2);
        offset += 2 + segLength;
      }
    } else if (mimetype === "image/gif") {
      // GIF: width and height are at bytes 6-9
      if (buffer.length >= 10) {
        const width = buffer.readUInt16LE(6);
        const height = buffer.readUInt16LE(8);
        return { width, height };
      }
    } else if (mimetype === "image/webp") {
      // WebP: more complex, try RIFF/VP8 parsing
      if (buffer.length >= 30 && buffer.toString("ascii", 0, 4) === "RIFF") {
        const chunkType = buffer.toString("ascii", 12, 16);
        if (chunkType === "VP8 ") {
          const width = buffer.readUInt16LE(26) & 0x3fff;
          const height = buffer.readUInt16LE(28) & 0x3fff;
          return { width, height };
        } else if (chunkType === "VP8L") {
          const bits = buffer.readUInt32LE(21);
          const width = (bits & 0x3fff) + 1;
          const height = ((bits >> 14) & 0x3fff) + 1;
          return { width, height };
        }
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}
