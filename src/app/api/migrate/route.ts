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
