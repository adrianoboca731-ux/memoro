import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const [totalPhotos, totalAlbums, viewResult, totalUsers] = await Promise.all([
    db.photo.count(),
    db.album.count(),
    db.photo.aggregate({ _sum: { views: true } }),
    db.user.count(),
  ]);

  return NextResponse.json({
    totalPhotos,
    totalAlbums,
    totalViews: viewResult._sum.views || 0,
    totalUsers,
  });
}
