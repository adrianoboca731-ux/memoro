import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PATCH: Approve or reject a pending group photo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: groupId, photoId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { status } = body; // "approved" or "rejected"

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Stato non valido' }, { status: 400 });
    }

    // Check if user is admin or moderator
    const membership = await db.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
      return NextResponse.json({ error: 'Non autorizzato - solo admin o moderatore' }, { status: 403 });
    }

    // Find the group photo
    const groupPhoto = await db.groupPhoto.findFirst({
      where: { groupId, photoId },
    });
    if (!groupPhoto) {
      return NextResponse.json({ error: 'Foto non trovata nel gruppo' }, { status: 404 });
    }

    if (groupPhoto.status !== 'pending') {
      return NextResponse.json({ error: 'La foto è già stata processata' }, { status: 400 });
    }

    // Update status
    const updated = await db.groupPhoto.update({
      where: { id: groupPhoto.id },
      data: { status },
      include: { photo: true },
    });

    // If approved, increment photo count
    if (status === 'approved') {
      await db.group.update({
        where: { id: groupId },
        data: { photoCount: { increment: 1 } },
      });
    }

    // Notify the user who submitted the photo
    await db.notification.create({
      data: {
        userId: groupPhoto.addedBy,
        type: status === 'approved' ? 'group_photo_approved' : 'group_photo_rejected',
        title: status === 'approved' ? 'Foto approvata' : 'Foto rifiutata',
        message: status === 'approved'
          ? `La tua foto è stata approvata nel gruppo`
          : `La tua foto è stata rifiutata nel gruppo`,
        fromUserId: userId,
        link: `/gruppi/${groupId}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating group photo status:', error);
    return NextResponse.json({ error: 'Errore aggiornamento stato foto' }, { status: 500 });
  }
}
