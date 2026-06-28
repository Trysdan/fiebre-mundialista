import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    isPreview: process.env.VERCEL_ENV === "preview",
    env: process.env.VERCEL_ENV || "development",
  });
}
