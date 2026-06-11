import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
        coverImage: true,
        logoImage: true,
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

    // Check follow status for the current viewer
    let viewerFollowStatus: string | null = null;
    const session = await getServerSession(authOptions);
    if (session?.user?.id && (session.user as any).id !== user.id) {
      const follow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: (session.user as any).id,
            followingId: user.id,
          },
        },
        select: { status: true },
      });
      viewerFollowStatus = follow?.status || null;
    }

    const userWithCounts = {
      ...user,
      photos: user.photos.map((p) => ({
        ...p,
        favoriteCount: p._count.favorites,
        commentCount: p._count.comments,
        _count: undefined,
      })),
      viewerFollowStatus,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;
    const sessionUsername = (session.user as any).username;

    // Users can only update their own profile
    if (username !== sessionUsername) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = ["name", "bio", "location", "website", "coverImage", "logoImage"];
    const updateData: Record<string, string | null> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updatedUser = await db.user.update({
      where: { username },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        coverImage: true,
        logoImage: true,
        bio: true,
        location: true,
        website: true,
        isPro: true,
        isPublic: true,
        followerCount: true,
        followingCount: true,
        photoCount: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento del profilo" },
      { status: 500 }
    );
  }
}
