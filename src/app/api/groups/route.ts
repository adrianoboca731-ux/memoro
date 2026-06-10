import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const groups = await db.group.findMany({
      where,
      include: {
        _count: { select: { members: true, photos: true, discussions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const groupsWithCounts = groups.map((g) => ({
      ...g,
      memberCount: g._count.members,
      photoCount: g._count.photos,
      discussionCount: g._count.discussions,
      _count: undefined,
    }));

    return NextResponse.json(groupsWithCounts);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento dei gruppi" },
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
        { error: "Il nome del gruppo è obbligatorio" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    const group = await db.group.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        cover: body.cover || null,
        rules: body.rules?.trim() || null,
        isPublic: body.isPublic !== false,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: "admin",
          },
        },
      },
      include: {
        members: true,
        _count: { select: { photos: true, discussions: true } },
      },
    });

    return NextResponse.json(
      {
        ...group,
        memberCount: group.members.length,
        photoCount: group._count.photos,
        discussionCount: group._count.discussions,
        _count: undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Errore nella creazione del gruppo" },
      { status: 500 }
    );
  }
}
