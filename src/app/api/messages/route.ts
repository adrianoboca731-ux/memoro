import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const messages = await db.message.findMany({
      where: {
        OR: [{ fromId: userId }, { toId: userId }],
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        recipient: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento dei messaggi" },
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

    const fromId = (session.user as any).id;
    const body = await request.json();

    if (!body.toId || !body.subject?.trim() || !body.body?.trim()) {
      return NextResponse.json(
        { error: "Destinatario, oggetto e messaggio sono obbligatori" },
        { status: 400 }
      );
    }

    // Check recipient's message settings
    const recipientSettings = await db.userSettings.findUnique({
      where: { userId: body.toId },
    });
    if (recipientSettings?.allowMessages === "nobody") {
      return NextResponse.json(
        { error: "Questo utente non accetta messaggi" },
        { status: 403 }
      );
    }

    const message = await db.message.create({
      data: {
        fromId,
        toId: body.toId,
        subject: body.subject.trim(),
        body: body.body.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        recipient: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });

    // Create notification for recipient
    const recipientSettings2 = await db.userSettings.findUnique({
      where: { userId: body.toId },
    });
    if (recipientSettings2?.notifyMessages) {
      await db.notification.create({
        data: {
          userId: body.toId,
          type: "message",
          title: "Nuovo messaggio",
          message: `${session.user.name} ti ha inviato un messaggio`,
          fromUserId: fromId,
        },
      });
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Errore nell'invio del messaggio" },
      { status: 500 }
    );
  }
}
