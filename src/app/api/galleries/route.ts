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

    const galleries = await db.gallery.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      galleries.map((g) => ({ ...g, itemCount: g._count.items, _count: undefined }))
    );
  } catch (error) {
    console.error("Error fetching galleries:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento delle gallerie" },
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
        { error: "Il nome della galleria è obbligatorio" },
        { status: 400 }
      );
    }

    const gallery = await db.gallery.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        cover: body.cover || null,
        isPublic: body.isPublic !== false,
        userId: (session.user as any).id,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ ...gallery, itemCount: 0 }, { status: 201 });
  } catch (error) {
    console.error("Error creating gallery:", error);
    return NextResponse.json(
      { error: "Errore nella creazione della galleria" },
      { status: 500 }
    );
  }
}
