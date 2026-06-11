import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Add cover_image and logo_image columns to users table
    const migrations: string[] = [
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cover_image" TEXT`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "logo_image" TEXT`,
    ];

    for (const sql of migrations) {
      try {
        await db.$executeRawUnsafe(sql);
        console.log("Migration applied:", sql);
      } catch (err: any) {
        // Column might already exist
        if (err.message?.includes("already exists")) {
          console.log("Already exists, skipping:", sql);
        } else {
          throw err;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migrations applied: cover_image, logo_image added to users",
    });
  } catch (error: any) {
    console.error("Migration error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
