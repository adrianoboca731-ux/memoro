import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const migrations: string[] = [
      // Cover and logo for users
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cover_image" TEXT`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "logo_image" TEXT`,
      // Follow approval system: add status column to follows
      `ALTER TABLE "follows" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'approved'`,
      // Birth date for minor detection
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birth_date" TIMESTAMP`,
      // Profile viewers allowlist for private profiles
      `CREATE TABLE IF NOT EXISTS "profile_viewers" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "viewer_id" TEXT NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "profile_viewers_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "profile_viewers_userId_viewerId_key" ON "profile_viewers"("user_id", "viewer_id")`,
      `CREATE INDEX IF NOT EXISTS "profile_viewers_user_id_idx" ON "profile_viewers"("user_id")`,
      `CREATE INDEX IF NOT EXISTS "profile_viewers_viewer_id_idx" ON "profile_viewers"("viewer_id")`,
    ];

    const results: string[] = [];

    for (const sql of migrations) {
      try {
        await db.$executeRawUnsafe(sql);
        results.push(`Applied: ${sql.substring(0, 80)}...`);
      } catch (err: any) {
        if (err.message?.includes("already exists") || err.message?.includes("default value")) {
          results.push(`Already exists: ${sql.substring(0, 80)}...`);
        } else {
          results.push(`Error: ${err.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migrations applied",
      results,
    });
  } catch (error: any) {
    console.error("Migration error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
