import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Use Prisma's raw query to check and create tables
    // First check if tables exist
    const tables = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as any[];
    
    const tableNames = tables.map((t: any) => t.table_name);
    console.log("Existing tables:", tableNames);
    
    if (tableNames.includes('users')) {
      return NextResponse.json({ 
        success: true, 
        message: "Tables already exist",
        tables: tableNames 
      });
    }

    // Create tables using raw SQL
    const sql = `
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "location" TEXT,
    "website" TEXT,
    "is_pro" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "following_count" INTEGER NOT NULL DEFAULT 0,
    "photo_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
`;
    await db.$executeRawUnsafe(sql);
    
    return NextResponse.json({ 
      success: true, 
      message: "Created users table",
      tables: ['users']
    });
  } catch (error: any) {
    console.error("DB setup error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const tables = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as any[];
    
    return NextResponse.json({ 
      success: true, 
      tables: tables.map((t: any) => t.table_name)
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
