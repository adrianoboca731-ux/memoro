import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: List group photos (approved only by default, pending for admins)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // "pending", "approved", "all"

    // Check if user is admin/moderator for this group
    let isAdmin = false;
    if (session?.user) {
      const userId = (session.user as any).id;
      const membership = await db.groupMember.findUnique({
        where: { groupId_userId: { groupId: id, userId } },
      });
      isAdmin = membership?.role === 'admin' || membership?.role === 'moderator';
    }

    // Regular users can only see approved photos
    const filterStatus = status === 'pending' && isAdmin ? 'pending' : 
                         status === 'all' && isAdmin ? undefined : 'approved';

    const photos = await db.groupPhoto.findMany({
      where: {
        groupId: id,
        ...(filterStatus ? { status: filterStatus } : {}),
      },
      include: {
        photo: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    return NextResponse.json(photos);
  } catch (error) {
    console.error('Error fetching group photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

// POST: Submit photo to group (pending approval by default)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    if (!body.photoId) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
    }

    // Check if user is a member
    const membership = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });
    if (!membership) {
      return NextResponse.json({ error: 'Non sei membro di questo gruppo' }, { status: 403 });
    }

    // Check if photo belongs to user
    const photo = await db.photo.findUnique({ where: { id: body.photoId } });
    if (!photo) {
      return NextResponse.json({ error: 'Foto non trovata' }, { status: 404 });
    }

    // Check if already in group
    const existing = await db.groupPhoto.findUnique({
      where: { groupId_photoId: { groupId: id, photoId: body.photoId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Foto già nel gruppo' }, { status: 400 });
    }

    // Determine status: admin/moderator adds are auto-approved, members need approval
    const isAdminOrMod = membership.role === 'admin' || membership.role === 'moderator';
    const status = isAdminOrMod ? 'approved' : 'pending';

    const groupPhoto = await db.groupPhoto.create({
      data: {
        groupId: id,
        photoId: body.photoId,
        addedBy: userId,
        status,
      },
      include: { photo: true },
    });

    // Only increment photo count for approved photos
    if (status === 'approved') {
      await db.group.update({
        where: { id },
        data: { photoCount: { increment: 1 } },
      });
    }

    // Notify group admin if photo is pending
    if (status === 'pending') {
      const group = await db.group.findUnique({ where: { id } });
      if (group) {
        const admin = await db.groupMember.findFirst({
          where: { groupId: id, role: 'admin' },
        });
        if (admin && admin.userId !== userId) {
          await db.notification.create({
            data: {
              userId: admin.userId,
              type: 'group_photo_pending',
              title: 'Nuova foto in attesa',
              message: `${session.user.name} ha proposto una foto nel gruppo "${group.name}"`,
              fromUserId: userId,
              link: `/gruppi/${id}`,
            },
          });
        }
      }
    }

    return NextResponse.json(groupPhoto, { status: 201 });
  } catch (error) {
    console.error('Error adding photo to group:', error);
    return NextResponse.json({ error: 'Failed to add photo' }, { status: 500 });
  }
}

// DELETE: Remove photo from group
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    if (!body.photoId) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
    }

    const groupPhoto = await db.groupPhoto.findUnique({
      where: { groupId_photoId: { groupId: id, photoId: body.photoId } },
    });

    if (!groupPhoto) {
      return NextResponse.json({ error: 'Foto non trovata nel gruppo' }, { status: 404 });
    }

    // Check permission: admin/moderator or the person who added it
    const membership = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId } },
    });
    const isAdminOrMod = membership?.role === 'admin' || membership?.role === 'moderator';
    const isAdder = groupPhoto.addedBy === userId;

    if (!isAdminOrMod && !isAdder) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    // Decrement count only if photo was approved
    if (groupPhoto.status === 'approved') {
      await db.group.update({
        where: { id },
        data: { photoCount: { decrement: 1 } },
      });
    }

    await db.groupPhoto.delete({
      where: { groupId_photoId: { groupId: id, photoId: body.photoId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing photo from group:', error);
    return NextResponse.json({ error: 'Failed to remove photo' }, { status: 500 });
  }
}
