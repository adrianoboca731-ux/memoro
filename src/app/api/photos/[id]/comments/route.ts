import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await db.comment.findMany({
      where: { photoId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento dei commenti" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.text?.trim()) {
      return NextResponse.json(
        { error: "Il commento non può essere vuoto" },
        { status: 400 }
      );
    }

    const comment = await db.comment.create({
      data: {
        text: body.text.trim(),
        authorId: (session.user as any).id,
        photoId: id,
      },
    });

    // Update photo comment count
    await db.photo.update({
      where: { id },
      data: { commentCount: { increment: 1 } },
    });

    // Create notification for photo owner
    const photo = await db.photo.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (photo && photo.userId !== (session.user as any).id) {
      const userSettings = await db.userSettings.findUnique({
        where: { userId: photo.userId },
      });
      if (userSettings?.notifyComments) {
        await db.notification.create({
          data: {
            userId: photo.userId,
            type: "comment",
            title: "Nuovo commento",
            message: `${session.user.name} ha commentato la tua foto`,
            fromUserId: (session.user as any).id,
          },
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Errore nella creazione del commento" },
      { status: 500 }
    );
  }
}
