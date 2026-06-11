import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST: Approve a pending follow request
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const follow = await db.follow.findUnique({
      where: { id },
    });

    if (!follow) {
      return NextResponse.json(
        { error: "Richiesta non trovata" },
        { status: 404 }
      );
    }

    // Only the profile owner can approve
    if (follow.followingId !== userId) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 403 }
      );
    }

    if (follow.status !== "pending") {
      return NextResponse.json(
        { error: "La richiesta non è in attesa" },
        { status: 400 }
      );
    }

    // Update status to approved
    await db.follow.update({
      where: { id },
      data: { status: "approved" },
    });

    // Increment follower/following counts
    await db.user.update({
      where: { id: follow.followerId },
      data: { followingCount: { increment: 1 } },
    });
    await db.user.update({
      where: { id: follow.followingId },
      data: { followerCount: { increment: 1 } },
    });

    // Notify the follower that they were approved
    const followerSettings = await db.userSettings.findUnique({
      where: { userId: follow.followerId },
    });
    if (followerSettings?.notifyFollows) {
      const profileOwner = await db.user.findUnique({
        where: { id: follow.followingId },
        select: { name: true },
      });
      await db.notification.create({
        data: {
          userId: follow.followerId,
          type: "follow_approved",
          title: "Richiesta approvata",
          message: `${profileOwner?.name || "L'utente"} ha approvato la tua richiesta di follow`,
          fromUserId: follow.followingId,
        },
      });
    }

    return NextResponse.json({ success: true, status: "approved" });
  } catch (error) {
    console.error("Error approving follow:", error);
    return NextResponse.json(
      { error: "Errore nell'approvazione della richiesta" },
      { status: 500 }
    );
  }
}

// DELETE: Reject a pending follow request
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

    const userId = (session.user as any).id;

    const follow = await db.follow.findUnique({
      where: { id },
    });

    if (!follow) {
      return NextResponse.json(
        { error: "Richiesta non trovata" },
        { status: 404 }
      );
    }

    // Only the profile owner can reject
    if (follow.followingId !== userId) {
      return NextResponse.json(
        { error: "Non autorizzato" },
        { status: 403 }
      );
    }

    // Delete the follow entry
    await db.follow.delete({
      where: { id },
    });

    // No count changes needed since pending follows don't increment counts

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rejecting follow:", error);
    return NextResponse.json(
      { error: "Errore nel rifiuto della richiesta" },
      { status: 500 }
    );
  }
}
