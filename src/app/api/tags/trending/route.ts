import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get all photos with tags
    const photos = await db.photo.findMany({
      select: { tags: true },
      where: { tags: { not: null } },
    });

    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    for (const photo of photos) {
      if (!photo.tags) continue;
      const tags = photo.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
      for (const tag of tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    // Sort by count, take top 20
    const trending = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json(trending);
  } catch (error) {
    console.error("Error fetching trending tags:", error);
    return NextResponse.json([]);
  }
}
