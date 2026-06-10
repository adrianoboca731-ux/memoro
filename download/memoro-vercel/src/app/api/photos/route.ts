import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const albumId = searchParams.get('albumId') || '';
  const tag = searchParams.get('tag') || '';

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  if (albumId) {
    where.albumId = albumId;
  }

  if (tag) {
    where.tags = { contains: tag };
  }

  const photos = await db.photo.findMany({
    where,
    include: { album: true, comments: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(photos);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = (formData.get('description') as string) || '';
    const filename = formData.get('filename') as string;
    const filepath = formData.get('filepath') as string;
    const thumbnail = (formData.get('thumbnail') as string) || null;
    const mimetype = formData.get('mimetype') as string;
    const size = parseInt(formData.get('size') as string, 10);
    const width = formData.get('width') ? parseInt(formData.get('width') as string, 10) : null;
    const height = formData.get('height') ? parseInt(formData.get('height') as string, 10) : null;
    const tags = (formData.get('tags') as string) || '';
    const albumId = (formData.get('albumId') as string) || null;

    const photo = await db.photo.create({
      data: {
        title,
        description,
        filename,
        filepath,
        thumbnail,
        mimetype,
        size,
        width,
        height,
        tags,
        albumId,
      },
      include: { album: true, comments: true },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    console.error('Error creating photo:', error);
    return NextResponse.json({ error: 'Failed to create photo' }, { status: 500 });
  }
}
