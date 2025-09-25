import { NextRequest, NextResponse } from "next/server";
import { sendingWhatsapp } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {

    const { name, number, pdfUrl, mediaName } = await req.json();
    if (!name || !number || !pdfUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const result = await sendingWhatsapp(name, number, pdfUrl, mediaName || "VisitorPass.pdf");
    if (result.status === "error") {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ result: result.result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send WhatsApp message" }, { status: 500 });
  }
}
