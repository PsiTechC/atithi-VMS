import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import VisitorPass from "@/models/VisitorPass";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const action = (url.searchParams.get("action") || "").toLowerCase();
    if (!token || !action) {
      return NextResponse.json({ error: "Missing token or action" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const pass = await VisitorPass.findOne({ approvalToken: token });
    if (!pass) {
      // render a small HTML page for hosts clicking links
      return new NextResponse(`<html><body><h2>Invalid or expired approval link</h2></body></html>`, { status: 404, headers: { "content-type": "text/html" } });
    }

    pass.approvalStatus = action === "approve" ? "approved" : "rejected";
    pass.approvalRespondedAt = new Date();
    // optionally clear token so link can't be reused
    pass.approvalToken = null;
    await pass.save();

    // Return a small confirmation page so hosts see feedback when they tap the WhatsApp link
    const title = pass.approvalStatus === "approved" ? "Visitor Approved" : "Visitor Rejected";
    const msg = pass.approvalStatus === "approved" ? `You approved access for ${pass.name}.` : `You rejected access for ${pass.name}.`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:Arial,Helvetica,sans-serif;padding:24px;"><h2>${title}</h2><p>${msg}</p><p>You can now close this page.</p></body></html>`;
    return new NextResponse(html, { status: 200, headers: { "content-type": "text/html" } });
  } catch (err: any) {
    console.error("Approval handler error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
