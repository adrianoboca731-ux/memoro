import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const groups = await db.group.findMany({
    include: { members: true, _count: { select: { photos: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(groups.map(g => ({
    ...g,
    photoCount: g._count.photos,
  })));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const group = await db.group.create({
      data: {
        name: body.name,
        description: body.description || '',
        cover: body.cover || null,
        rules: body.rules || '',
        isPublic: body.isPublic !== false,
        createdBy: body.createdBy || 'Admin',
      },
      include: { members: true },
    });
    // Add creator as admin member
    await db.groupMember.create({
      data: { groupId: group.id, username: group.createdBy, role: 'admin' },
    });
    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
