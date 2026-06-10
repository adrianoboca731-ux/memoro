import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [totalPhotos, totalAlbums, viewResult, totalUsers, totalGroups] =
      await Promise.all([
        db.photo.count(),
        db.album.count(),
        db.photo.aggregate({ _sum: { views: true } }),
        db.user.count(),
        db.group.count(),
      ]);

    return NextResponse.json({
      totalPhotos,
      totalAlbums,
      totalViews: viewResult._sum.views || 0,
      totalUsers,
      totalGroups,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Errore nel caricamento delle statistiche" },
      { status: 500 }
    );
  }
}
