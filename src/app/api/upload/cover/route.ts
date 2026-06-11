import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("cover") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." }, { status: 400 });
    }

    // Validate file size (max 10MB for cover images)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Get current user to check for existing cover
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { coverImage: true },
    });

    // Upload new cover to Cloudinary
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const folder = `memoro/covers/${userId}`;
    const filename = `${timestamp}-${sanitizedFilename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToCloudinary(buffer, folder, filename, file.type, { isCover: true });

    // Update user cover in database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { coverImage: result.url },
      select: { id: true, coverImage: true, name: true, username: true },
    });

    // Delete old cover from Cloudinary (if it was a Cloudinary URL)
    if (currentUser?.coverImage && currentUser.coverImage.includes("cloudinary.com")) {
      try {
        await deleteFromCloudinary(currentUser.coverImage);
      } catch {
        // Ignore deletion errors for old cover
      }
    }

    return NextResponse.json({
      coverImage: updatedUser.coverImage,
      user: updatedUser,
    }, { status: 200 });
  } catch (error) {
    console.error("Cover upload error:", error);
    return NextResponse.json(
      { error: "Cover upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get current user cover
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { coverImage: true },
    });

    // Remove cover from database
    await db.user.update({
      where: { id: userId },
      data: { coverImage: null },
    });

    // Delete from Cloudinary
    if (currentUser?.coverImage && currentUser.coverImage.includes("cloudinary.com")) {
      try {
        await deleteFromCloudinary(currentUser.coverImage);
      } catch {
        // Ignore deletion errors
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Cover delete error:", error);
    return NextResponse.json(
      { error: "Cover removal failed" },
      { status: 500 }
    );
  }
}
