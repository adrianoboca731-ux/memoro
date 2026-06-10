import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, username } = await request.json();
    if (!name || !email || !password || !username) {
      return NextResponse.json(
        { error: "Tutti i campi sono obbligatori" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La password deve avere almeno 6 caratteri" },
        { status: 400 }
      );
    }

    const existing = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email o nome utente già in uso" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username,
        settings: {
          create: {
            safeSearch: "moderate",
            showMatureContent: false,
            showRestrictedContent: false,
            allowMatureUploads: false,
            profileVisibility: "public",
            allowMessages: "everyone",
            showEXIF: true,
            allowDownloads: true,
            allowComments: true,
            showCameraRoll: false,
            emailNotifications: true,
            notifyFavorites: true,
            notifyComments: true,
            notifyFollows: true,
            notifyGroupInvites: true,
            notifyMessages: true,
            defaultView: "grid",
            darkMode: true,
            language: "it",
          },
        },
      },
      include: { settings: true },
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Errore di registrazione" },
      { status: 500 }
    );
  }
}
