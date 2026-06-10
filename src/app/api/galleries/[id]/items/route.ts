import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const item = await db.galleryItem.create({
      data: { galleryId: id, photoId: body.photoId, note: body.note || null, addedBy: body.addedBy || 'Admin' },
      include: { photo: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error adding to gallery:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    await db.galleryItem.deleteMany({ where: { galleryId: id, photoId: body.photoId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from gallery:', error);
    return NextResponse.json({ error: 'Failed to remove item' }, { status: 500 });
  }
}
