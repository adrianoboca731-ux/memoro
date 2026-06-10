import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "";

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;

    const albums = await db.album.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const albumsWithCount = albums.map((album) => ({
      ...album,
      photoCount: album._count.photos,
      _count: undefined,
    }));

    return NextResponse.json(albumsWithCount);
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento degli album" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Il nome dell'album è obbligatorio" },
        { status: 400 }
      );
    }

    const album = await db.album.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        cover: body.cover || null,
        userId: (session.user as any).id,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        _count: { select: { photos: true } },
      },
    });

    return NextResponse.json(
      { ...album, photoCount: 0, _count: undefined },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating album:", error);
    return NextResponse.json(
      { error: "Errore nella creazione dell'album" },
      { status: 500 }
    );
  }
}
