import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    if (!body.photoId) {
      return NextResponse.json(
        { error: "Specificare la foto da aggiungere" },
        { status: 400 }
      );
    }

    const item = await db.galleryItem.create({
      data: {
        galleryId: id,
        photoId: body.photoId,
        note: body.note || null,
        addedBy: (session.user as any).id,
      },
      include: { photo: true },
    });

    // Update gallery cover if not set
    const gallery = await db.gallery.findUnique({ where: { id } });
    if (gallery && !gallery.cover) {
      const photo = await db.photo.findUnique({ where: { id: body.photoId } });
      if (photo?.thumbnail) {
        await db.gallery.update({
          where: { id },
          data: { cover: photo.thumbnail },
        });
      }
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Error adding to gallery:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiunta alla galleria" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    if (!body.photoId) {
      return NextResponse.json(
        { error: "Specificare la foto da rimuovere" },
        { status: 400 }
      );
    }

    await db.galleryItem.deleteMany({
      where: { galleryId: id, photoId: body.photoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from gallery:", error);
    return NextResponse.json(
      { error: "Errore nella rimozione dalla galleria" },
      { status: 500 }
    );
  }
}
