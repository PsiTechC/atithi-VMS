// // app/api/visitor-pass/check-in/whatsapp/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import VisitorPass from "@/models/VisitorPass";

// export async function POST(req: NextRequest) {
//   try {
//     await dbConnect();

//     // scope to logged-in client (same as your other endpoints)
//     const clientSession = req.cookies.get("client-session");
//     if (!clientSession) {
//       return NextResponse.json({ error: "Authentication required" }, { status: 401 });
//     }
//     const clientId = clientSession.value;

//     const { passId, accessPointId, accessPointName } = await req.json();

//     if (!passId) {
//       return NextResponse.json({ error: "passId is required" }, { status: 400 });
//     }

//     const pass = await VisitorPass.findOne({ passId, clientId });
//     if (!pass) {
//       return NextResponse.json({ error: "Visitor pass not found" }, { status: 404 });
//     }

//     // Only auto check-in if approved and not already checked-in
//     if (pass.approvalRequired && pass.approvalStatus !== "approved") {
//       return NextResponse.json({ error: "Pass not approved yet" }, { status: 409 });
//     }

//     const now = new Date();
//     if (!pass.checkInDate) pass.checkInDate = now;
//     pass.status = "checked-in";

//     // movement audit
//     if (Array.isArray(pass.movementHistory)) {
//       pass.movementHistory.push({
//         type: "check-in",
//         at: now,
//         method: "whatsapp-approval",
//         accessPointId: accessPointId || null,
//         accessPointName: accessPointName || "Auto (WhatsApp Approval)",
//       });
//     }

//     await pass.save();

//     return NextResponse.json({
//       ok: true,
//       passId: pass.passId,
//       status: pass.status,
//       checkInDate: pass.checkInDate,
//     });
//   } catch (err: any) {
//     console.error("[WhatsApp Check-in] error:", err?.message || err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }


// // app/api/visitor-pass/check-in/whatsapp/route.ts
// import { NextRequest, NextResponse } from "next/server";

// export const runtime = "nodejs";

// export async function POST(req: NextRequest) {
//   try {
//     const { passId, accessPointId = null, accessPointName = "Auto (WhatsApp Approval)" } = await req.json();

//     if (!passId) {
//       return NextResponse.json({ error: "passId is required" }, { status: 400 });
//     }

//     // Reuse the existing check-in path so schema enums stay consistent.
//     // NOTE: We call the same route your UI uses for check-ins.
//     const res = await fetch(`${process.env.APP_BASE_URL ?? ""}/api/client/visitors/check-pass`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       // Use a distinct method tag if you like; your server already validates/enforces enums.
//       body: JSON.stringify({
//         passId,
//         accessPointId,
//         accessPointName,
//         method: "whatsapp", // let the existing handler map this correctly
//       }),
//       // If you're on the same Next.js server, omit credentials; session is cookie-based
//     });

//     const data = await res.json();
//     if (!res.ok) {
//       return NextResponse.json(data, { status: res.status });
//     }

//     // Bubble back minimal fields the table can use
//     return NextResponse.json({
//       ok: true,
//       passId,
//       checkInDate: data?.checkInDate || data?.visitor?.checkInDate || new Date().toISOString(),
//       // any other fields you want to surface
//     });
//   } catch (e: any) {
//     console.error("[WhatsApp Check-in] error:", e?.message || e);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }




// app/api/visitor-pass/check-in/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const {
      passId,
      accessPointId = null,
      accessPointName = "Auto (WhatsApp Approval)",
    } = await req.json();

    if (!passId) {
      return NextResponse.json({ error: "passId is required" }, { status: 400 });
    }

    // Use current request origin if APP_BASE_URL is not set
    const base = process.env.APP_BASE_URL || req.nextUrl.origin;

    // 🔑 forward the incoming cookies so /check-pass sees client-session
    const cookie = req.headers.get("cookie") || "";

    const res = await fetch(new URL("/api/client/visitors/check-pass", base).toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie, // <-- important
      },
      cache: "no-store",
      body: JSON.stringify({
        passId,
        accessPointId,
        accessPointName,
        //method: "whatsapp", // gets recorded in movementHistory
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // Normalize a minimal response the UI can consume
    return NextResponse.json({
      ok: true,
      passId,
      status: data?.pass?.status ?? "checked_in",
      checkInDate:
        data?.visitor?.checkInDate ??
        data?.checkInDate ??
        new Date().toISOString(),
      pass: data?.pass,
      visitor: data?.visitor,
    });
  } catch (e: any) {
    console.error("[WhatsApp Check-in] error:", e?.message || e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
