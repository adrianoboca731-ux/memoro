import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/download?photoId=xxx&size=thumbnail|medium|full
 * Proxies a Cloudinary image download with the original filename in Content-Disposition header.
 * This is necessary because <a download> doesn't work for cross-origin URLs (Cloudinary).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get("photoId");
    const size = searchParams.get("size") || "full"; // thumbnail | medium | full

    if (!photoId) {
      return NextResponse.json({ error: "photoId is required" }, { status: 400 });
    }

    // Fetch photo from database
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        user: {
          include: { settings: true },
        },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Check if downloads are allowed by the photo owner
    if (photo.user?.settings && !photo.user.settings.allowDownloads) {
      return NextResponse.json({ error: "Downloads are disabled for this photo" }, { status: 403 });
    }

    // Build the Cloudinary URL based on the requested size
    let downloadUrl = photo.filepath;

    if (size !== "full" && photo.filepath.includes("cloudinary.com")) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      if (cloudName) {
        // Extract public_id from the Cloudinary URL
        let publicId = photo.filepath;
        try {
          const url = new URL(photo.filepath);
          const pathParts = url.pathname.split("/");
          const uploadIndex = pathParts.findIndex((p) => p === "upload");
          if (uploadIndex >= 0) {
            const afterUpload = pathParts.slice(uploadIndex + 1);
            const firstNonVersion = afterUpload.findIndex((p) => !/^v\d+$/.test(p));
            if (firstNonVersion >= 0) {
              publicId = afterUpload.slice(firstNonVersion).join("/").replace(/\.[^.]+$/, "");
            }
          }
        } catch {
          // Keep original URL if parsing fails
        }

        switch (size) {
          case "thumbnail":
            downloadUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_400,c_fill,q_auto:good/${publicId}`;
            break;
          case "medium":
            downloadUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_800,c_limit,q_auto:good/${publicId}`;
            break;
          case "full":
          default:
            // Original compressed version
            downloadUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto:eco/${publicId}`;
            break;
        }
      }
    }

    // For non-Cloudinary URLs, just use the filepath directly
    if (!downloadUrl.startsWith("http")) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 500 });
    }

    // Fetch the image from Cloudinary
    const imageResponse = await fetch(downloadUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }

    // Determine the file extension based on size
    const originalFilename = photo.filename || "photo";
    const baseName = originalFilename.replace(/\.[^.]+$/, "");

    // For thumbnail/medium, use the original extension or jpg
    const originalExt = originalFilename.match(/\.[^.]+$/)?.[0] || ".jpg";
    let filename: string;

    switch (size) {
      case "thumbnail":
        filename = `${baseName}_400x400${originalExt}`;
        break;
      case "medium":
        filename = `${baseName}_800${originalExt}`;
        break;
      case "full":
      default:
        filename = originalFilename;
        break;
    }

    // Get the image buffer
    const imageBuffer = await imageResponse.arrayBuffer();

    // Determine content type from the response or the original mimetype
    const contentType = imageResponse.headers.get("content-type") || photo.mimetype || "image/jpeg";

    // Return the image with Content-Disposition header forcing download with original filename
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": imageBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
