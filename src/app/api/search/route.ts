import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function computeShouldBlur(
  photo: { isMature: boolean; safetyLevel: string; userId: string },
  viewerId: string | null | undefined,
  userSafeSearch: string,
  showMatureContent: boolean
): boolean {
  if (viewerId && photo.userId === viewerId) return false;
  if (showMatureContent) return false;
  if ((photo.isMature || photo.safetyLevel === "restricted") && userSafeSearch !== "off") return true;
  if (photo.safetyLevel === "moderate" && userSafeSearch === "strict") return true;
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "photos";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "24", 10);

    if (!q.trim()) {
      return NextResponse.json({ results: [], total: 0, page, limit });
    }

    // Get user safety settings
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

    const skip = (page - 1) * limit;

    if (type === "photos") {
      const where: Record<string, unknown> = {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { contains: q, mode: "insensitive" } },
        ],
      };

      // No longer filter by safety level in the where clause
      // Instead, add shouldBlur flag to each photo

      const [photos, total] = await Promise.all([
        db.photo.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true },
            },
            _count: { select: { favorites: true, comments: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        db.photo.count({ where }),
      ]);

      return NextResponse.json({
        type: "photos",
        results: photos.map((p) => ({
          ...p,
          favoriteCount: p._count.favorites,
          commentCount: p._count.comments,
          _count: undefined,
          shouldBlur: computeShouldBlur(
            { isMature: p.isMature, safetyLevel: p.safetyLevel, userId: p.userId },
            viewerId,
            userSafeSearch,
            showMatureContent
          ),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    if (type === "users") {
      const [users, total] = await Promise.all([
        db.user.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            bio: true,
            location: true,
            photoCount: true,
            followerCount: true,
            followingCount: true,
          },
          skip,
          take: limit,
        }),
        db.user.count({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
            ],
          },
        }),
      ]);

      return NextResponse.json({
        type: "users",
        results: users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    if (type === "groups") {
      const [groups, total] = await Promise.all([
        db.group.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          include: {
            _count: { select: { members: true, photos: true } },
          },
          skip,
          take: limit,
        }),
        db.group.count({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
        }),
      ]);

      return NextResponse.json({
        type: "groups",
        results: groups.map((g) => ({
          ...g,
          memberCount: g._count.members,
          photoCount: g._count.photos,
          _count: undefined,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    return NextResponse.json(
      { error: "Tipo di ricerca non valido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Errore nella ricerca" },
      { status: 500 }
    );
  }
}
