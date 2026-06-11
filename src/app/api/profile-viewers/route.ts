import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET - List allowed viewers for the current user's private profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check that the profile is private
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isPublic: true },
    });

    if (!user || user.isPublic !== false) {
      // Public profiles don't need viewers, but we still return empty
      return NextResponse.json({ viewers: [] });
    }

    const viewers = await db.profileViewer.findMany({
      where: { userId },
      include: {
        viewer: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      viewers: viewers.map((v) => ({
        id: v.id,
        viewerId: v.viewerId,
        createdAt: v.createdAt,
        user: v.viewer,
      })),
    });
  } catch (error) {
    console.error("Error fetching profile viewers:", error);
    return NextResponse.json(
      { error: "Error fetching profile viewers" },
      { status: 500 }
    );
  }
}

// POST - Add a user to the allowlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { viewerUsername, viewerId: bodyViewerId } = body;

    // Check that the profile is actually private
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { isPublic: true },
    });

    if (!user || user.isPublic !== false) {
      return NextResponse.json(
        { error: "Profile is not private" },
        { status: 400 }
      );
    }

    // Resolve viewer ID from username if provided
    let resolvedViewerId = bodyViewerId;
    if (viewerUsername && !resolvedViewerId) {
      const viewer = await db.user.findUnique({
        where: { username: viewerUsername },
        select: { id: true },
      });
      if (!viewer) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
      resolvedViewerId = viewer.id;
    }

    if (!resolvedViewerId) {
      return NextResponse.json(
        { error: "viewerUsername or viewerId required" },
        { status: 400 }
      );
    }

    // Can't add yourself
    if (resolvedViewerId === userId) {
      return NextResponse.json(
        { error: "Cannot add yourself" },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await db.profileViewer.findUnique({
      where: {
        userId_viewerId: {
          userId,
          viewerId: resolvedViewerId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User already in allowlist" },
        { status: 409 }
      );
    }

    const profileViewer = await db.profileViewer.create({
      data: {
        userId,
        viewerId: resolvedViewerId,
      },
      include: {
        viewer: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: profileViewer.id,
      viewerId: profileViewer.viewerId,
      createdAt: profileViewer.createdAt,
      user: profileViewer.viewer,
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding profile viewer:", error);
    return NextResponse.json(
      { error: "Error adding profile viewer" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a user from the allowlist
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { viewerId } = body;

    if (!viewerId) {
      return NextResponse.json(
        { error: "viewerId required" },
        { status: 400 }
      );
    }

    const deleted = await db.profileViewer.deleteMany({
      where: {
        userId,
        viewerId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Viewer not found in allowlist" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing profile viewer:", error);
    return NextResponse.json(
      { error: "Error removing profile viewer" },
      { status: 500 }
    );
  }
}
