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

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      db.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento delle notifiche" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    if (body.markAllRead) {
      await db.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (body.id) {
      const notification = await db.notification.update({
        where: { id: body.id },
        data: { isRead: true },
      });
      return NextResponse.json(notification);
    }

    return NextResponse.json(
      { error: "Specificare l'ID o markAllRead" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento della notifica" },
      { status: 500 }
    );
  }
}
