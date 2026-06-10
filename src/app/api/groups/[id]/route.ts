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
    const group = await db.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatar: true },
            },
          },
        },
        photos: {
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
          take: 20,
        },
        discussions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { members: true, photos: true, discussions: true } },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Gruppo non trovato" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...group,
      memberCount: group._count.members,
      photoCount: group._count.photos,
      discussionCount: group._count.discussions,
      _count: undefined,
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento del gruppo" },
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

    const userId = (session.user as any).id;

    // Check if user is admin/moderator
    const membership = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });
    if (!membership || (membership.role !== "admin" && membership.role !== "moderator")) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await request.json();
    const updated = await db.group.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.cover !== undefined && { cover: body.cover }),
        ...(body.rules !== undefined && { rules: body.rules }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
      include: { members: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento del gruppo" },
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

    const group = await db.group.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json(
        { error: "Gruppo non trovato" },
        { status: 404 }
      );
    }
    if (group.createdBy !== (session.user as any).id) {
      return NextResponse.json({ error: "Solo l'amministratore può eliminare il gruppo" }, { status: 403 });
    }

    await db.group.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione del gruppo" },
      { status: 500 }
    );
  }
}
