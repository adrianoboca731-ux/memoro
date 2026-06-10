import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const group = await db.group.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json(
        { error: "Gruppo non trovato" },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });
    if (existingMember) {
      return NextResponse.json(
        { error: "Sei già un membro di questo gruppo" },
        { status: 400 }
      );
    }

    if (group.isPublic) {
      // Auto-accept for public groups
      await db.groupMember.create({
        data: { groupId: id, userId, role: "member" },
      });
      await db.group.update({
        where: { id },
        data: { memberCount: { increment: 1 } },
      });
      return NextResponse.json({ joined: true, role: "member" }, { status: 201 });
    } else {
      // Private group - create pending invite
      const existingInvite = await db.groupInvite.findUnique({
        where: { groupId_inviteeId: { groupId: id, inviteeId: userId } },
      });
      if (existingInvite) {
        return NextResponse.json(
          { error: "Richiesta già inviata" },
          { status: 400 }
        );
      }

      await db.groupInvite.create({
        data: {
          groupId: id,
          inviterId: userId,
          inviteeId: userId,
          status: "pending",
        },
      });

      return NextResponse.json(
        { joined: false, message: "Richiesta inviata. In attesa di approvazione." },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error joining group:", error);
    return NextResponse.json(
      { error: "Errore nell'iscrizione al gruppo" },
      { status: 500 }
    );
  }
}
