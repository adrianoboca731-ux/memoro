import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
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
    const folder = `memoro/photos/${userId}`;
    const filename = `${timestamp}-${sanitizedFilename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToCloudinary(buffer, folder, filename, file.type);

    // Try to get image dimensions
    let width: number | undefined;
    let height: number | undefined;
    try {
      const dims = getImageDimensions(buffer, file.type);
      if (dims) {
        width = dims.width;
        height = dims.height;
      }
    } catch {
      // Ignore dimension extraction errors
    }

    return NextResponse.json(
      {
        filename: file.name,
        filepath: result.url,
        thumbnail: result.url,
        mimetype: file.type,
        size: file.size,
        width,
        height,
      },
      { status: 201 }
    );
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
      if (buffer.length >= 24) {
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }
    } else if (mimetype === "image/jpeg") {
      let offset = 2;
      while (offset < buffer.length - 1) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          const height = buffer.readUInt16BE(offset + 5);
          const width = buffer.readUInt16BE(offset + 7);
          return { width, height };
        }
        const segLength = buffer.readUInt16BE(offset + 2);
        offset += 2 + segLength;
      }
    } else if (mimetype === "image/gif") {
      if (buffer.length >= 10) {
        const width = buffer.readUInt16LE(6);
        const height = buffer.readUInt16LE(8);
        return { width, height };
      }
    } else if (mimetype === "image/webp") {
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
