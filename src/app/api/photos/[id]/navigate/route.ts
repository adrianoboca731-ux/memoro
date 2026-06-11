import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const viewerId = (session?.user as any)?.id;

    // Get the current photo to find its user and creation date
    const currentPhoto = await db.photo.findUnique({
      where: { id },
      select: { id: true, userId: true, createdAt: true },
    });

    if (!currentPhoto) {
      return NextResponse.json(
        { error: "Foto non trovata" },
        { status: 404 }
      );
    }

    // Get user settings for safe search
    let userSafeSearch = "moderate";
    let showMatureContent = false;
    let showRestrictedContent = false;
    let viewerIsMinor = false;

    if (viewerId) {
      const settings = await db.userSettings.findUnique({
        where: { userId: viewerId },
      });
      if (settings) {
        userSafeSearch = settings.safeSearch;
        showMatureContent = settings.showMatureContent;
        showRestrictedContent = settings.showRestrictedContent;
      }
      const viewerUser = await db.user.findUnique({
        where: { id: viewerId },
        select: { birthDate: true },
      });
      if (viewerUser?.birthDate) {
        const today = new Date();
        const age = today.getFullYear() - viewerUser.birthDate.getFullYear();
        const monthDiff = today.getMonth() - viewerUser.birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < viewerUser.birthDate.getDate())) {
          viewerIsMinor = age - 1 < 18;
        } else {
          viewerIsMinor = age < 18;
        }
      }
    }

    // Build safety filter based on viewer settings
    const safetyFilter: Record<string, unknown>[] = [];
    
    // Owner always sees all their photos
    if (currentPhoto.userId !== viewerId) {
      if (viewerIsMinor) {
        safetyFilter.push({ safetyLevel: "safe", isMature: false });
      } else if (userSafeSearch === "strict") {
        safetyFilter.push({ safetyLevel: "safe", isMature: false });
      } else if (userSafeSearch === "moderate") {
        if (!showMatureContent && !showRestrictedContent) {
          safetyFilter.push({ safetyLevel: "safe", isMature: false });
        } else if (showMatureContent && !showRestrictedContent) {
          safetyFilter.push({
            OR: [
              { safetyLevel: "safe", isMature: false },
              { safetyLevel: "moderate" },
            ],
          });
        }
        // If both mature and restricted are enabled, show everything
      }
      // userSafeSearch === "off" shows everything
    }

    const baseWhere: Record<string, unknown> = {
      userId: currentPhoto.userId,
    };

    if (safetyFilter.length > 0) {
      baseWhere.AND = safetyFilter;
    }

    // Get previous photo (older than current)
    const prevPhoto = await db.photo.findFirst({
      where: {
        ...baseWhere,
        createdAt: { lt: currentPhoto.createdAt },
        id: { not: id },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        filepath: true,
      },
    });

    // Get next photo (newer than current)
    const nextPhoto = await db.photo.findFirst({
      where: {
        ...baseWhere,
        createdAt: { gt: currentPhoto.createdAt },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        filepath: true,
      },
    });

    // Get nearby thumbnails (5 before + current + 5 after)
    const nearbyBefore = await db.photo.findMany({
      where: {
        ...baseWhere,
        createdAt: { lt: currentPhoto.createdAt },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        thumbnail: true,
        filepath: true,
      },
    });

    const nearbyAfter = await db.photo.findMany({
      where: {
        ...baseWhere,
        createdAt: { gt: currentPhoto.createdAt },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: {
        id: true,
        title: true,
        thumbnail: true,
        filepath: true,
      },
    });

    // Combine: before (reversed) + current + after
    const thumbnails = [
      ...nearbyBefore.reverse(),
      { id: currentPhoto.id, title: "", thumbnail: null, filepath: "" },
      ...nearbyAfter,
    ].map((p) => ({
      id: p.id,
      title: p.title,
      thumbnail: p.thumbnail || p.filepath,
      isCurrent: p.id === currentPhoto.id,
    }));

    return NextResponse.json({
      prev: prevPhoto
        ? {
            id: prevPhoto.id,
            title: prevPhoto.title,
            thumbnail: prevPhoto.thumbnail || prevPhoto.filepath,
          }
        : null,
      next: nextPhoto
        ? {
            id: nextPhoto.id,
            title: nextPhoto.title,
            thumbnail: nextPhoto.thumbnail || nextPhoto.filepath,
          }
        : null,
      thumbnails,
    });
  } catch (error) {
    console.error("Error fetching photo navigation:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento della navigazione" },
      { status: 500 }
    );
  }
}
