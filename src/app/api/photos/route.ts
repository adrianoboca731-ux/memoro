import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function isMinor(birthDate: Date | null): boolean {
  if (!birthDate) return false;
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 < 18;
  }
  return age < 18;
}

function computeShouldBlur(
  photo: { isMature: boolean; safetyLevel: string; userId: string },
  viewerId: string | null | undefined,
  userSafeSearch: string,
  showMatureContent: boolean,
  showRestrictedContent: boolean,
  viewerIsMinor: boolean
): boolean {
  // Photo owner ALWAYS sees their own photos unblurred
  if (viewerId && photo.userId === viewerId) return false;

  // Minors ALWAYS see moderate and restricted blurred
  if (viewerIsMinor) {
    if (photo.safetyLevel === "moderate" || photo.safetyLevel === "restricted" || photo.isMature) {
      return true;
    }
  }

  // safeSearch strict: blur moderate and restricted
  if (userSafeSearch === "strict") {
    if (photo.safetyLevel === "moderate" || photo.safetyLevel === "restricted" || photo.isMature) {
      return true;
    }
  }

  // safeSearch moderate: blur restricted (default Flickr behavior)
  if (userSafeSearch === "moderate") {
    if (photo.safetyLevel === "restricted") {
      if (showRestrictedContent && !viewerIsMinor) return false;
      return true;
    }
    if (photo.isMature || photo.safetyLevel === "moderate") {
      if (showMatureContent && !viewerIsMinor) return false;
      return true;
    }
  }

  // safeSearch off: don't blur anything
  if (userSafeSearch === "off") return false;

  return false;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "24", 10);
    const userId = searchParams.get("userId") || "";
    const albumId = searchParams.get("albumId") || "";
    const safetyLevel = searchParams.get("safetyLevel") || "";
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const favoritesUserId = searchParams.get("favorites") || "";

    const session = await getServerSession(authOptions);
    let userSafeSearch = "moderate";
    let showMatureContent = false;
    let showRestrictedContent = false;
    let viewerIsMinor = false;
    const viewerId = (session?.user as any)?.id;
    if (viewerId) {
      const settings = await db.userSettings.findUnique({
        where: { userId: viewerId },
      });
      if (settings) {
        userSafeSearch = settings.safeSearch;
        showMatureContent = settings.showMatureContent;
        showRestrictedContent = settings.showRestrictedContent;
      }
      // Check if viewer is a minor
      const viewerUser = await db.user.findUnique({
        where: { id: viewerId },
        select: { birthDate: true },
      });
      viewerIsMinor = isMinor(viewerUser?.birthDate || null);
    }

    // If favorites=true, use the logged-in user's ID
    const effectiveFavoritesUserId = favoritesUserId === "true" && viewerId ? viewerId : favoritesUserId;

    const where: Record<string, unknown> = {};

    if (safetyLevel) {
      where.safetyLevel = safetyLevel;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

    if (userId) {
      where.userId = userId;
    }

    if (albumId) {
      where.albumId = albumId;
    }

    if (tag) {
      where.tags = { contains: tag, mode: "insensitive" };
    }

    // Favorites filter: find photos favorited by a specific user
    if (effectiveFavoritesUserId) {
      where.favorites = {
        some: { userId: effectiveFavoritesUserId },
      };
    }

    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      db.photo.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          exif: true,
          favorites: {
            select: { userId: true },
          },
          _count: { select: { favorites: true, comments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.photo.count({ where }),
    ]);

    const photosWithCounts = photos.map((photo) => ({
      ...photo,
      favoriteCount: photo._count.favorites,
      commentCount: photo._count.comments,
      isFavorited: viewerId ? photo.favorites.some((f: any) => f.userId === viewerId) : false,
      _count: undefined,
      favorites: undefined,
      shouldBlur: computeShouldBlur(
        { isMature: photo.isMature, safetyLevel: photo.safetyLevel, userId: photo.userId },
        viewerId,
        userSafeSearch,
        showMatureContent,
        showRestrictedContent,
        viewerIsMinor
      ),
    }));

    return NextResponse.json({
      photos: photosWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento delle foto" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const filename = formData.get("filename") as string;
    const filepath = formData.get("filepath") as string;
    const thumbnail = (formData.get("thumbnail") as string) || null;
    const mimetype = formData.get("mimetype") as string;
    const size = parseInt(formData.get("size") as string, 10);
    const width = formData.get("width")
      ? parseInt(formData.get("width") as string, 10)
      : null;
    const height = formData.get("height")
      ? parseInt(formData.get("height") as string, 10)
      : null;
    const tags = (formData.get("tags") as string) || null;
    const albumId = (formData.get("albumId") as string) || null;
    const safetyLevel = (formData.get("safetyLevel") as string) || "safe";
    const isMature = formData.get("isMature") === "true";
    const contentRating = (formData.get("contentRating") as string) || null;

    const photo = await db.photo.create({
      data: {
        title,
        description,
        filename,
        filepath,
        thumbnail,
        mimetype,
        size,
        width,
        height,
        tags,
        albumId,
        userId: (session.user as any).id,
        safetyLevel,
        isMature,
        contentRating,
      },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        exif: true,
      },
    });

    // Update user photo count
    await db.user.update({
      where: { id: (session.user as any).id },
      data: { photoCount: { increment: 1 } },
    });

    // Update album cover if needed
    if (albumId) {
      const album = await db.album.findUnique({ where: { id: albumId } });
      if (album && !album.cover && thumbnail) {
        await db.album.update({
          where: { id: albumId },
          data: { cover: thumbnail || filepath },
        });
      }
    }

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error("Error creating photo:", error);
    return NextResponse.json(
      { error: "Errore nella creazione della foto" },
      { status: 500 }
    );
  }
}
