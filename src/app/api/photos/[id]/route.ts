import { NextRequest, NextResponse } from "next/server";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const photo = await db.photo.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        exif: true,
        comments: {
          orderBy: { createdAt: "desc" },
          include: {
            photo: { select: { id: true } },
          },
        },
        favorites: {
          select: { userId: true },
        },
        _count: { select: { favorites: true, comments: true } },
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Foto non trovata" },
        { status: 404 }
      );
    }

    // Compute shouldBlur based on user settings instead of blocking
    const session = await getServerSession(authOptions);
    let userSafeSearch = "moderate";
    let showMatureContent = false;
    const viewerId = (session?.user as any)?.id;
    if (viewerId) {
      const settings = await db.userSettings.findUnique({
        where: { userId: viewerId },
      });
      if (settings) {
        userSafeSearch = settings.safeSearch;
        showMatureContent = settings.showMatureContent;
      }
    }

    // Compute shouldBlur: photo owner always sees unblurred, showMatureContent bypasses blur
    let shouldBlur = false;
    if (viewerId && photo.userId === viewerId) {
      shouldBlur = false;
    } else if (showMatureContent) {
      shouldBlur = false;
    } else if ((photo.isMature || photo.safetyLevel === "restricted") && userSafeSearch !== "off") {
      shouldBlur = true;
    } else if (photo.safetyLevel === "moderate" && userSafeSearch === "strict") {
      shouldBlur = true;
    }

    // Increment view count
    await db.photo.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Check if current user has favorited
    let isFavorited = false;
    if (session?.user?.id) {
      isFavorited = photo.favorites.some(
        (f) => f.userId === (session.user as any).id
      );
    }

    return NextResponse.json({
      ...photo,
      views: photo.views + 1,
      favoriteCount: photo._count.favorites,
      commentCount: photo._count.comments,
      isFavorited,
      shouldBlur,
      favorites: undefined,
      _count: undefined,
    });
  } catch (error) {
    console.error("Error fetching photo:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento della foto" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const photo = await db.photo.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json(
        { error: "Foto non trovata" },
        { status: 404 }
      );
    }
    if (photo.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = [
      "title",
      "description",
      "tags",
      "safetyLevel",
      "isMature",
      "contentRating",
      "albumId",
    ];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await db.photo.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        exif: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating photo:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento della foto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const photo = await db.photo.findUnique({ where: { id } });
    if (!photo) {
      return NextResponse.json(
        { error: "Foto non trovata" },
        { status: 404 }
      );
    }
    if (photo.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    // Delete Cloudinary files
    if (photo.filepath && photo.filepath.includes("cloudinary.com")) {
      try {
        await deleteFromCloudinary(photo.filepath);
      } catch {}
    }
    if (photo.thumbnail && photo.thumbnail.includes("cloudinary.com")) {
      try {
        await deleteFromCloudinary(photo.thumbnail);
      } catch {}
    }

    await db.photo.delete({ where: { id } });

    // Update user photo count
    await db.user.update({
      where: { id: (session.user as any).id },
      data: { photoCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione della foto" },
      { status: 500 }
    );
  }
}
