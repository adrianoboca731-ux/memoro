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
    const settings = await db.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings
      const newSettings = await db.userSettings.create({
        data: { userId },
      });
      return NextResponse.json(newSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento delle impostazioni" },
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

    const allowedFields = [
      "safeSearch",
      "showMatureContent",
      "showRestrictedContent",
      "allowMatureUploads",
      "profileVisibility",
      "allowMessages",
      "showEXIF",
      "allowDownloads",
      "allowComments",
      "showCameraRoll",
      "emailNotifications",
      "notifyFavorites",
      "notifyComments",
      "notifyFollows",
      "notifyGroupInvites",
      "notifyMessages",
      "defaultView",
      "darkMode",
      "language",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const settings = await db.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: { userId, ...updateData },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento delle impostazioni" },
      { status: 500 }
    );
  }
}
