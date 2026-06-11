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
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." }, { status: 400 });
    }

    // Validate file size (max 5MB for logo)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Get current user to check for existing logo
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { logoImage: true },
    });

    // Upload new logo to Cloudinary
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const folder = `memoro/logos/${userId}`;
    const filename = `${timestamp}-${sanitizedFilename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToCloudinary(buffer, folder, filename, file.type, { isLogo: true });

    // Update user logo in database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { logoImage: result.url },
      select: { id: true, logoImage: true, name: true, username: true },
    });

    // Delete old logo from Cloudinary (if it was a Cloudinary URL)
    if (currentUser?.logoImage && currentUser.logoImage.includes("cloudinary.com")) {
      try {
        await deleteFromCloudinary(currentUser.logoImage);
      } catch {
        // Ignore deletion errors for old logo
      }
    }

    return NextResponse.json({
      logoImage: updatedUser.logoImage,
      user: updatedUser,
    }, { status: 200 });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: "Logo upload failed" },
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

    // Get current user logo
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { logoImage: true },
    });

    // Remove logo from database
    await db.user.update({
      where: { id: userId },
      data: { logoImage: null },
    });

    // Delete from Cloudinary
    if (currentUser?.logoImage && currentUser.logoImage.includes("cloudinary.com")) {
      try {
        await deleteFromCloudinary(currentUser.logoImage);
      } catch {
        // Ignore deletion errors
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Logo delete error:", error);
    return NextResponse.json(
      { error: "Logo removal failed" },
      { status: 500 }
    );
  }
}
