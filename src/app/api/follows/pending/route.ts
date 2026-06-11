import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: List pending follow requests for the logged-in user (for private profile owners)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const pendingFollows = await db.follow.findMany({
      where: {
        followingId: userId,
        status: "pending",
      },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            photoCount: true,
            followerCount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = pendingFollows.map((f) => ({
      id: f.id,
      createdAt: f.createdAt,
      follower: f.follower,
    }));

    return NextResponse.json({ requests: result });
  } catch (error) {
    console.error("Error fetching pending follows:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento delle richieste" },
      { status: 500 }
    );
  }
}
