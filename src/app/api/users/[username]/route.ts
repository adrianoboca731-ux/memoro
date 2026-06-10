import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const user = await db.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        isPro: true,
        isPublic: true,
        followerCount: true,
        followingCount: true,
        photoCount: true,
        createdAt: true,
        photos: {
          orderBy: { createdAt: "desc" },
          take: 12,
          include: {
            _count: { select: { favorites: true, comments: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      );
    }

    const userWithCounts = {
      ...user,
      photos: user.photos.map((p) => ({
        ...p,
        favoriteCount: p._count.favorites,
        commentCount: p._count.comments,
        _count: undefined,
      })),
    };

    return NextResponse.json(userWithCounts);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento del profilo" },
      { status: 500 }
    );
  }
}
