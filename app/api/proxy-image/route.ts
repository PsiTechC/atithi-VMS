// app/api/proxy-image/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const res = await fetch(url);
  const blob = await res.arrayBuffer();

  return new NextResponse(blob, {
    headers: {
      "Content-Type": res.headers.get("content-type") || "image/png",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
