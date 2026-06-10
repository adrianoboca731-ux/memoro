import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const groupPhoto = await db.groupPhoto.create({
      data: { groupId: id, photoId: body.photoId, addedBy: body.addedBy || 'Admin' },
      include: { photo: true },
    });
    await db.group.update({ where: { id }, data: { photoCount: { increment: 1 } } });
    return NextResponse.json(groupPhoto, { status: 201 });
  } catch (error) {
    console.error('Error adding photo to group:', error);
    return NextResponse.json({ error: 'Failed to add photo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    await db.groupPhoto.deleteMany({ where: { groupId: id, photoId: body.photoId } });
    await db.group.update({ where: { id }, data: { photoCount: { decrement: 1 } } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing photo from group:', error);
    return NextResponse.json({ error: 'Failed to remove photo' }, { status: 500 });
  }
}
