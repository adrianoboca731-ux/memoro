import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const album = await db.album.findUnique({
    where: { id },
    include: { photos: { orderBy: { createdAt: 'desc' } } },
  });

  if (!album) {
    return NextResponse.json({ error: 'Album not found' }, { status: 404 });
  }

  return NextResponse.json({ ...album, photoCount: album.photos.length });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const album = await db.album.update({
      where: { id },
      data: body,
      include: { photos: true },
    });
    return NextResponse.json({ ...album, photoCount: album.photos.length });
  } catch (error) {
    console.error('Error updating album:', error);
    return NextResponse.json({ error: 'Failed to update album' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await db.album.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting album:', error);
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}
