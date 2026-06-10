import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const photoId = id;

    const photo = await db.photo.findUnique({ where: { id: photoId } });
    if (!photo) {
      return NextResponse.json(
        { error: "Foto non trovata" },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existing = await db.favorite.findUnique({
      where: { userId_photoId: { userId, photoId } },
    });

    if (existing) {
      // Unfavorite
      await db.favorite.delete({
        where: { userId_photoId: { userId, photoId } },
      });
      await db.photo.update({
        where: { id: photoId },
        data: { favoriteCount: { decrement: 1 } },
      });
      return NextResponse.json({ favorited: false });
    } else {
      // Favorite
      await db.favorite.create({
        data: { userId, photoId },
      });
      await db.photo.update({
        where: { id: photoId },
        data: { favoriteCount: { increment: 1 } },
      });

      // Create notification
      if (photo.userId !== userId) {
        const userSettings = await db.userSettings.findUnique({
          where: { userId: photo.userId },
        });
        if (userSettings?.notifyFavorites) {
          await db.notification.create({
            data: {
              userId: photo.userId,
              type: "favorite",
              title: "Nuovo preferito",
              message: `${session.user.name} ha aggiunto la tua foto ai preferiti`,
              fromUserId: userId,
            },
          });
        }
      }

      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento dei preferiti" },
      { status: 500 }
    );
  }
}
