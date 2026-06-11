import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Check follow status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const followerId = (session.user as any).id;

    const targetUser = await db.user.findUnique({ where: { username } });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      );
    }

    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
    });

    return NextResponse.json({
      following: !!existing,
      followStatus: existing?.status || null,
    });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Errore nel controllo dello stato" },
      { status: 500 }
    );
  }
}

// POST: Follow a user (instant for public, pending for private)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const followerId = (session.user as any).id;

    const targetUser = await db.user.findUnique({ where: { username } });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      );
    }

    if (targetUser.id === followerId) {
      return NextResponse.json(
        { error: "Non puoi seguire te stesso" },
        { status: 400 }
      );
    }

    // Check if already following or pending
    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
    });

    if (existing) {
      // If already following or pending, unfollow/cancel
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUser.id,
          },
        },
      });

      // Only decrement counts if the follow was approved
      if (existing.status === "approved") {
        await db.user.update({
          where: { id: followerId },
          data: { followingCount: { decrement: 1 } },
        });
        await db.user.update({
          where: { id: targetUser.id },
          data: { followerCount: { decrement: 1 } },
        });
      }

      return NextResponse.json({ following: false });
    }

    // For public profiles: instant follow (approved)
    // For private profiles: pending follow
    const isPrivate = targetUser.isPublic === false;
    const status = isPrivate ? "pending" : "approved";

    await db.follow.create({
      data: {
        followerId,
        followingId: targetUser.id,
        status,
      },
    });

    // Only increment counts for approved follows
    if (status === "approved") {
      await db.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      });
      await db.user.update({
        where: { id: targetUser.id },
        data: { followerCount: { increment: 1 } },
      });
    }

    // Create notification
    const targetSettings = await db.userSettings.findUnique({
      where: { userId: targetUser.id },
    });
    if (targetSettings?.notifyFollows) {
      await db.notification.create({
        data: {
          userId: targetUser.id,
          type: status === "pending" ? "follow_request" : "follow",
          title: status === "pending" ? "Richiesta di follow" : "Nuovo follower",
          message:
            status === "pending"
              ? `${session.user.name} ha richiesto di seguirti`
              : `${session.user.name} ha iniziato a seguirti`,
          fromUserId: followerId,
        },
      });
    }

    return NextResponse.json({ following: true, status });
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento del follow" },
      { status: 500 }
    );
  }
}

// DELETE: Unfollow (regardless of status)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const followerId = (session.user as any).id;

    const targetUser = await db.user.findUnique({ where: { username } });
    if (!targetUser) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      );
    }

    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ following: false });
    }

    await db.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
    });

    // Only decrement counts if the follow was approved
    if (existing.status === "approved") {
      await db.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      });
      await db.user.update({
        where: { id: targetUser.id },
        data: { followerCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({ following: false });
  } catch (error) {
    console.error("Error unfollowing:", error);
    return NextResponse.json(
      { error: "Errore nella rimozione del follow" },
      { status: 500 }
    );
  }
}
