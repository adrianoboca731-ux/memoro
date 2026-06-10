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
    const album = await db.album.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        photos: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true },
            },
            _count: { select: { favorites: true, comments: true } },
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json(
        { error: "Album non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...album,
      photoCount: album.photos.length,
    });
  } catch (error) {
    console.error("Error fetching album:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento dell'album" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const album = await db.album.findUnique({ where: { id } });
    if (!album) {
      return NextResponse.json(
        { error: "Album non trovato" },
        { status: 404 }
      );
    }
    if (album.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await request.json();
    const updated = await db.album.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.cover !== undefined && { cover: body.cover }),
      },
      include: {
        photos: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json({ ...updated, photoCount: updated.photos.length });
  } catch (error) {
    console.error("Error updating album:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento dell'album" },
      { status: 500 }
    );
  }
}

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

    const album = await db.album.findUnique({ where: { id } });
    if (!album) {
      return NextResponse.json(
        { error: "Album non trovato" },
        { status: 404 }
      );
    }
    if (album.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    await db.album.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting album:", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione dell'album" },
      { status: 500 }
    );
  }
}
