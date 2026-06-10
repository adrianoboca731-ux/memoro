import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const albums = await db.album.findMany({
    include: { photos: true },
    orderBy: { createdAt: 'desc' },
  });

  // Add photo count to each album
  const albumsWithCount = albums.map((album) => ({
    ...album,
    photoCount: album.photos.length,
  }));

  return NextResponse.json(albumsWithCount);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const album = await db.album.create({
      data: {
        name: body.name,
        description: body.description || '',
        cover: body.cover || null,
      },
      include: { photos: true },
    });
    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}
