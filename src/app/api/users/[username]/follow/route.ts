import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    // Check if already following
    const existing = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUser.id,
        },
      },
    });

    if (existing) {
      // Unfollow
      await db.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUser.id,
          },
        },
      });
      await db.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      });
      await db.user.update({
        where: { id: targetUser.id },
        data: { followerCount: { decrement: 1 } },
      });
      return NextResponse.json({ following: false });
    } else {
      // Follow
      await db.follow.create({
        data: {
          followerId,
          followingId: targetUser.id,
        },
      });
      await db.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      });
      await db.user.update({
        where: { id: targetUser.id },
        data: { followerCount: { increment: 1 } },
      });

      // Create notification
      const targetSettings = await db.userSettings.findUnique({
        where: { userId: targetUser.id },
      });
      if (targetSettings?.notifyFollows) {
        await db.notification.create({
          data: {
            userId: targetUser.id,
            type: "follow",
            title: "Nuovo follower",
            message: `${session.user.name} ha iniziato a seguirti`,
            fromUserId: followerId,
          },
        });
      }

      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento del follow" },
      { status: 500 }
    );
  }
}
