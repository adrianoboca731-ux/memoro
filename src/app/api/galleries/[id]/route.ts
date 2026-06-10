import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gallery = await db.gallery.findUnique({
    where: { id },
    include: { items: { include: { photo: true }, orderBy: { addedAt: 'desc' } } },
  });
  if (!gallery) return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  return NextResponse.json(gallery);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const gallery = await db.gallery.update({ where: { id }, data: body });
    return NextResponse.json(gallery);
  } catch (error) {
    console.error('Error updating gallery:', error);
    return NextResponse.json({ error: 'Failed to update gallery' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.gallery.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gallery:', error);
    return NextResponse.json({ error: 'Failed to delete gallery' }, { status: 500 });
  }
}
