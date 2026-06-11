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
      // If showRestrictedContent and not minor, don't blur
      if (showRestrictedContent && !viewerIsMinor) return false;
      return true;
    }
    if (photo.isMature || photo.safetyLevel === "moderate") {
      // If showMatureContent and not minor, don't blur
      if (showMatureContent && !viewerIsMinor) return false;
      return true;
    }
  }

  // safeSearch off: don't blur anything
  if (userSafeSearch === "off") return false;

  return false;
}

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
        birthDate: true,
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

    // Check follow status and allowed viewer status for the current viewer
    let viewerFollowStatus: string | null = null;
    let isAllowedViewer = false;
    let viewerBirthDate: Date | null = null;
    let userSafeSearch = "moderate";
    let showMatureContent = false;
    let showRestrictedContent = false;
    const session = await getServerSession(authOptions);
    const viewerId = (session?.user as any)?.id;

    if (viewerId && viewerId !== user.id) {
      // Check follow status
      const follow = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
        select: { status: true },
      });
      viewerFollowStatus = follow?.status || null;

      // Check if viewer is in the allowlist
      const viewerEntry = await db.profileViewer.findUnique({
        where: {
          userId_viewerId: {
            userId: user.id,
            viewerId: viewerId,
          },
        },
      });
      isAllowedViewer = !!viewerEntry;
    }

    // Get viewer settings for shouldBlur computation
    if (viewerId) {
      const viewerSettings = await db.userSettings.findUnique({
        where: { userId: viewerId },
      });
      if (viewerSettings) {
        userSafeSearch = viewerSettings.safeSearch;
        showMatureContent = viewerSettings.showMatureContent;
        showRestrictedContent = viewerSettings.showRestrictedContent;
      }

      // Get viewer birth date for minor check (only for own data)
      if (viewerId === user.id) {
        viewerBirthDate = user.birthDate;
      } else {
        const viewerUser = await db.user.findUnique({
          where: { id: viewerId },
          select: { birthDate: true },
        });
        viewerBirthDate = viewerUser?.birthDate || null;
      }
    }

    const viewerIsMinor = isMinor(viewerBirthDate);

    const userWithCounts = {
      ...user,
      // Never expose birthDate to other users
      birthDate: viewerId === user.id ? user.birthDate : undefined,
      photos: user.photos.map((p) => ({
        ...p,
        favoriteCount: p._count.favorites,
        commentCount: p._count.comments,
        _count: undefined,
        shouldBlur: computeShouldBlur(
          { isMature: p.isMature, safetyLevel: p.safetyLevel, userId: p.userId },
          viewerId,
          userSafeSearch,
          showMatureContent,
          showRestrictedContent,
          viewerIsMinor
        ),
      })),
      viewerFollowStatus,
      isAllowedViewer,
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
    const updateData: Record<string, string | null | Date> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle birthDate separately
    if (body.birthDate !== undefined) {
      updateData.birthDate = body.birthDate ? new Date(body.birthDate) : null;
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
        birthDate: true,
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
