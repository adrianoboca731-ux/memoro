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
    const discussions = await db.groupDiscussion.findMany({
      where: { groupId: id },
      include: {
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const discussionsWithCount = discussions.map((d) => ({
      ...d,
      replyCount: d._count.replies,
      _count: undefined,
    }));

    return NextResponse.json(discussionsWithCount);
  } catch (error) {
    console.error("Error fetching discussions:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento delle discussioni" },
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

    const userId = (session.user as any).id;

    // Must be a member
    const membership = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "Devi essere un membro del gruppo" },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!body.title?.trim() || !body.body?.trim()) {
      return NextResponse.json(
        { error: "Titolo e contenuto sono obbligatori" },
        { status: 400 }
      );
    }

    const discussion = await db.groupDiscussion.create({
      data: {
        groupId: id,
        title: body.title.trim(),
        body: body.body.trim(),
        authorId: userId,
      },
    });

    // Update group discussion count
    await db.group.update({
      where: { id },
      data: { discussionCount: { increment: 1 } },
    });

    return NextResponse.json(discussion, { status: 201 });
  } catch (error) {
    console.error("Error creating discussion:", error);
    return NextResponse.json(
      { error: "Errore nella creazione della discussione" },
      { status: 500 }
    );
  }
}
