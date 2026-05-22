import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor 
    ? forwardedFor.split(",")[0].trim() 
    : (request.headers.get("x-real-ip") || "127.0.0.1");
  return NextResponse.json({ ip });
}
