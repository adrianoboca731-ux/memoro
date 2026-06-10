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

    const userId = (session.user as any).id;

    // Must be admin or moderator
    const membership = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });
    if (!membership || (membership.role !== "admin" && membership.role !== "moderator")) {
      return NextResponse.json({ error: "Non autorizzato a invitare" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.inviteeId) {
      return NextResponse.json(
        { error: "Specificare l'utente da invitare" },
        { status: 400 }
      );
    }

    // Check if already invited
    const existingInvite = await db.groupInvite.findUnique({
      where: { groupId_inviteeId: { groupId: id, inviteeId: body.inviteeId } },
    });
    if (existingInvite) {
      return NextResponse.json(
        { error: "Invito già inviato" },
        { status: 400 }
      );
    }

    // Check if already a member
    const existingMember = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: body.inviteeId } },
    });
    if (existingMember) {
      return NextResponse.json(
        { error: "L'utente è già un membro" },
        { status: 400 }
      );
    }

    const invite = await db.groupInvite.create({
      data: {
        groupId: id,
        inviterId: userId,
        inviteeId: body.inviteeId,
        status: "pending",
      },
    });

    // Create notification
    await db.notification.create({
      data: {
        userId: body.inviteeId,
        type: "group_invite",
        title: "Invito al gruppo",
        message: `Sei stato invitato a unirti a un gruppo`,
        fromUserId: userId,
      },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Errore nell'invio dell'invito" },
      { status: 500 }
    );
  }
}
