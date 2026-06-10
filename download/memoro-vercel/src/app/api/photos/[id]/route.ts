import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photo = await db.photo.findUnique({
    where: { id },
    include: { album: true, comments: { orderBy: { createdAt: 'desc' } } },
  });

  if (!photo) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  // Increment view count
  await db.photo.update({
    where: { id },
    data: { views: { increment: 1 } },
  });

  return NextResponse.json({ ...photo, views: photo.views + 1 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const photo = await db.photo.update({
      where: { id },
      data: body,
      include: { album: true, comments: true },
    });
    return NextResponse.json(photo);
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Get photo to find blob URLs
    const photo = await db.photo.findUnique({ where: { id } });

    if (photo) {
      // Delete blob files
      if (photo.filepath && photo.filepath.includes('blob.vercel-storage.com')) {
        try { await del(photo.filepath); } catch {}
      }
      if (photo.thumbnail && photo.thumbnail.includes('blob.vercel-storage.com')) {
        try { await del(photo.thumbnail); } catch {}
      }
    }

    await db.photo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}
