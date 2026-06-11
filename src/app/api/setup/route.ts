import { NextResponse } from "next/server";
import { execSync } from "child_process";

export async function GET() {
  try {
    console.log("Running prisma db push...");
    execSync("npx prisma db push --accept-data-loss", {
      stdio: "inherit",
      timeout: 60000,
    });
    return NextResponse.json({ success: true, message: "Database schema pushed successfully" });
  } catch (error: any) {
    console.error("DB push error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
