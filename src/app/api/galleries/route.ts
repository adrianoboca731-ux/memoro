import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const galleries = await db.gallery.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(galleries.map(g => ({ ...g, itemCount: g._count.items })));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const gallery = await db.gallery.create({
      data: {
        name: body.name,
        description: body.description || '',
        cover: body.cover || null,
        isPublic: body.isPublic !== false,
        createdBy: body.createdBy || 'Admin',
      },
    });
    return NextResponse.json(gallery, { status: 201 });
  } catch (error) {
    console.error('Error creating gallery:', error);
    return NextResponse.json({ error: 'Failed to create gallery' }, { status: 500 });
  }
}
