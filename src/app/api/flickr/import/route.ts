import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dmp9v6pfo";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { photos } = body; // Array of { imageUrl, title, description, tags }

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ error: "No photos to import" }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const photo of photos) {
      try {
        // Download image from Flickr
        const imageRes = await fetch(photo.imageUrl);
        if (!imageRes.ok) throw new Error(`Failed to download: ${photo.imageUrl}`);

        const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
        const base64Image = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

        // Upload to Cloudinary
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signatureStr = `folder=memoro/uploads&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
        const crypto = await import("crypto");
        const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append("file", base64Image);
        cloudinaryFormData.append("folder", "memoro/uploads");
        cloudinaryFormData.append("timestamp", timestamp);
        cloudinaryFormData.append("api_key", CLOUDINARY_API_KEY);
        cloudinaryFormData.append("signature", signature);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: "POST", body: cloudinaryFormData }
        );

        if (!uploadRes.ok) {
          const errData = await uploadRes.text();
          throw new Error(`Cloudinary upload failed: ${errData}`);
        }

        const cloudData = await uploadRes.json();

        // Create thumbnail
        const thumbnail = cloudData.public_id
          ? `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_300,c_fill/${cloudData.public_id}.jpg`
          : cloudData.secure_url;

        // Create photo record in database
        const dbPhoto = await prisma.photo.create({
          data: {
            title: photo.title || "Untitled",
            description: photo.description || "",
            filename: cloudData.public_id || `flickr-import-${Date.now()}`,
            filepath: cloudData.secure_url,
            thumbnail,
            mimetype: "image/jpeg",
            size: cloudData.bytes || 0,
            width: cloudData.width || 0,
            height: cloudData.height || 0,
            tags: photo.tags || "",
            safetyLevel: "safe",
            contentRating: "photo",
            userId: user.id,
          },
        });

        results.push(dbPhoto);
      } catch (err: any) {
        console.error(`Error importing photo ${photo.title}:`, err);
        errors.push({ title: photo.title, error: err.message });
      }
    }

    return NextResponse.json({
      imported: results.length,
      errors: errors.length,
      errorDetails: errors,
      photos: results,
    });
  } catch (error: any) {
    console.error("Flickr import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
