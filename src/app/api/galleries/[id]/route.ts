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
    const gallery = await db.gallery.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        items: {
          include: {
            photo: {
              include: {
                user: {
                  select: { id: true, name: true, username: true, avatar: true },
                },
              },
            },
          },
          orderBy: { addedAt: "desc" },
        },
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: "Galleria non trovata" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ...gallery, itemCount: gallery.items.length });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento della galleria" },
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

    const gallery = await db.gallery.findUnique({ where: { id } });
    if (!gallery) {
      return NextResponse.json(
        { error: "Galleria non trovata" },
        { status: 404 }
      );
    }
    if (gallery.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await request.json();
    const updated = await db.gallery.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.cover !== undefined && { cover: body.cover }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating gallery:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento della galleria" },
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

    const gallery = await db.gallery.findUnique({ where: { id } });
    if (!gallery) {
      return NextResponse.json(
        { error: "Galleria non trovata" },
        { status: 404 }
      );
    }
    if (gallery.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    await db.gallery.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting gallery:", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione della galleria" },
      { status: 500 }
    );
  }
}
