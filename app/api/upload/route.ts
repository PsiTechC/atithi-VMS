import { NextRequest, NextResponse } from "next/server";
import { saveFileToLocal } from "@/lib/localStorage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    // Save to 'VisitorPasses' subfolder for PDFs
    const url = await saveFileToLocal(file, "VisitorPasses");
    return NextResponse.json({ url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
