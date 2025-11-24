
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import VisitorPass from "@/models/VisitorPass";
import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || "visitormanagement";
const MAP_COLLECTION = "ws_outbound_map";

function pick<T = any>(obj: any, path: string): T | undefined {
  return path.split(".").reduce((o, k) => (o && k in o ? o[k] : undefined), obj);
}

function extractDecision(body: any): "approved" | "rejected" | null {
  const nfm =
    pick(body, "messages.0.interactive.nfm_reply.response_json") ??
    pick(body, "entry.0.changes.0.value.messages.0.interactive.nfm_reply.response_json") ??
    pick(body, "message.interactive.nfm_reply.response_json");
  const blob = typeof nfm === "string" ? nfm : nfm ? JSON.stringify(nfm) : "";

  if (/approve/i.test(blob)) return "approved";
  if (/reject/i.test(blob)) return "rejected";

  const btn =
    pick<string>(body, "messages.0.interactive.button_reply.title") ??
    pick<string>(body, "entry.0.changes.0.value.messages.0.interactive.button_reply.title") ??
    pick<string>(body, "message.button.text") ??
    pick<string>(body, "messages.0.interactive.list_reply.title");
  if (btn) {
    if (/approve/i.test(btn)) return "approved";
    if (/reject/i.test(btn)) return "rejected";
  }

  const txt =
    pick<string>(body, "messages.0.text.body") ??
    pick<string>(body, "entry.0.changes.0.value.messages.0.text.body");
  if (txt) {
    if (/^\s*approve(d)?\s*$/i.test(txt)) return "approved";
    if (/^\s*reject(ed)?\s*$/i.test(txt)) return "rejected";
  }
  return null;
}

function extractReferenceId(body: any): string | undefined {
  return (
    pick<string>(body, "messages.0.context.id") ||
    pick<string>(body, "entry.0.changes.0.value.messages.0.context.id") ||
    pick<string>(body, "message.context.id") ||
    pick<string>(body, "messages.0.id") ||
    pick<string>(body, "entry.0.changes.0.value.messages.0.id") ||
    pick<string>(body, "message.id") ||
    pick<string>(body, "statuses.0.id")
  );
}

function extractMeta(body: any): { passId?: string; approvalToken?: string } {
  const meta =
    body?.meta ??
    body?.context?.meta ??
    body?.messages?.[0]?.meta ??
    body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.meta;
  return { passId: meta?.passId, approvalToken: meta?.approvalToken };
}

export async function POST(req: NextRequest) {
    console.log("[WEBHOOK][POST] hit");
  await dbConnect();

  let body: any;
  try {
    body = await req.json();
  } catch {
    console.error("[WEBHOOK] invalid json"); // TEMP LOG
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  // TEMP LOG: show a truncated payload so we can verify structure
  try {
    const preview = JSON.stringify(body).slice(0, 1500);
    console.log("[WEBHOOK] payload (trunc):", preview);
  } catch {}

  const decision = extractDecision(body);
  console.log("[WEBHOOK] decision:", decision); // TEMP LOG
  if (!decision) return NextResponse.json({ ok: true, ignored: true });

  // 1) Try META first
  let { passId, approvalToken } = extractMeta(body);
  console.log("[WEBHOOK] meta:", { passId, approvalToken }); // TEMP LOG

  // 2) Else resolve via context.id → ws_outbound_map.messageId
  let refId: string | undefined;
  if (!passId) {
    refId = extractReferenceId(body);
    console.log("[WEBHOOK] refId (context/original msg id):", refId); // TEMP LOG

    if (!refId || !mongoUri) {
      console.error("[WEBHOOK] missing reference id or mongo uri"); // TEMP LOG
      return NextResponse.json({ ok: false, error: "missing reference id" }, { status: 400 });
    }

    const client = new MongoClient(mongoUri);
    try {
      await client.connect();
      const mapRow = await client.db(dbName).collection(MAP_COLLECTION).findOne({ messageId: refId });
      console.log("[WEBHOOK] mapRow:", mapRow ? { passId: mapRow.passId, hasToken: !!mapRow.approvalToken } : null); // TEMP LOG

      if (!mapRow?.passId) {
        console.error("[WEBHOOK] mapping not found for", refId); // TEMP LOG
        return NextResponse.json({ ok: false, error: "mapping not found" }, { status: 404 });
      }

      passId = String(mapRow.passId);
      approvalToken = mapRow.approvalToken ? String(mapRow.approvalToken) : undefined;
    } finally {
      await client.close();
    }
  }

  // 3) Update pass (token-first; fallback to passId-only)
  const query: any = { passId };
  if (approvalToken) query.approvalToken = approvalToken;
  console.log("[WEBHOOK] query for VisitorPass:", query); // TEMP LOG

  let pass = await VisitorPass.findOne(query);
  if (!pass) {
    console.warn("[WEBHOOK] token match miss, trying passId-only"); // TEMP LOG
    pass = await VisitorPass.findOne({ passId });
  }

  if (!pass) {
    console.error("[WEBHOOK] pass not found for passId:", passId); // TEMP LOG
    return NextResponse.json({ ok: false, error: "pass not found" }, { status: 404 });
  }

  pass.approvalStatus = decision;
  pass.approvalRespondedAt = new Date();
  pass.approvalToken = null;

  await pass.save();
  console.log(`[WEBHOOK] ✅ updated pass ${pass.passId} -> ${decision}`); // TEMP LOG

  return NextResponse.json({ ok: true, passId: pass.passId, approvalStatus: decision });
}

// app/api/ws/webhook/route.ts (add this at the bottom)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("[WEBHOOK][GET] ping", { mode, tokenSet: !!token, challengeSet: !!challenge });

  // If your provider gave you a verify token, set it in env as WS_VERIFY_TOKEN
  const expected = process.env.WS_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === "subscribe" && token && expected && token === expected) {
    return new Response(challenge ?? "ok", { status: 200 });
  }
  return new Response("ok", { status: 200 });
}


// import { NextRequest, NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import VisitorPass from "@/models/VisitorPass";
// import { MongoClient } from "mongodb";

// const mongoUri = process.env.MONGODB_URI!;
// const dbName = process.env.MONGODB_DB || "visitormanagement";
// const MAP_COLLECTION = "ws_outbound_map";

// function pick<T = any>(obj: any, path: string): T | undefined {
//   return path.split(".").reduce((o, k) => (o && k in o ? o[k] : undefined), obj);
// }

// function extractDecision(body: any): "approved" | "rejected" | null {
//   const nfm =
//     pick(body, "messages.0.interactive.nfm_reply.response_json") ??
//     pick(body, "entry.0.changes.0.value.messages.0.interactive.nfm_reply.response_json") ??
//     pick(body, "message.interactive.nfm_reply.response_json");
//   const blob = typeof nfm === "string" ? nfm : nfm ? JSON.stringify(nfm) : "";

//   if (/approve/i.test(blob)) return "approved";
//   if (/reject/i.test(blob)) return "rejected";

//   const btn =
//     pick<string>(body, "messages.0.interactive.button_reply.title") ??
//     pick<string>(body, "entry.0.changes.0.value.messages.0.interactive.button_reply.title") ??
//     pick<string>(body, "message.button.text") ??
//     pick<string>(body, "messages.0.interactive.list_reply.title");
//   if (btn) {
//     if (/approve/i.test(btn)) return "approved";
//     if (/reject/i.test(btn)) return "rejected";
//   }

//   const txt =
//     pick<string>(body, "messages.0.text.body") ??
//     pick<string>(body, "entry.0.changes.0.value.messages.0.text.body");
//   if (txt) {
//     if (/^\s*approve(d)?\s*$/i.test(txt)) return "approved";
//     if (/^\s*reject(ed)?\s*$/i.test(txt)) return "rejected";
//   }
//   return null;
// }

// function extractReferenceId(body: any): string | undefined {
//   return (
//     pick<string>(body, "messages.0.context.id") ||
//     pick<string>(body, "entry.0.changes.0.value.messages.0.context.id") ||
//     pick<string>(body, "message.context.id") ||
//     pick<string>(body, "messages.0.id") ||
//     pick<string>(body, "entry.0.changes.0.value.messages.0.id") ||
//     pick<string>(body, "message.id") ||
//     pick<string>(body, "statuses.0.id")
//   );
// }

// function extractMeta(body: any): { passId?: string; approvalToken?: string } {
//   const meta =
//     body?.meta ??
//     body?.context?.meta ??
//     body?.messages?.[0]?.meta ??
//     body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.meta;
//   return { passId: meta?.passId, approvalToken: meta?.approvalToken };
// }

// export async function POST(req: NextRequest) {
//   console.log("[WEBHOOK][POST] hit");
//   await dbConnect();

//   let body: any;
//   try {
//     body = await req.json();
//   } catch {
//     console.error("[WEBHOOK] invalid json");
//     return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
//   }

//   try {
//     const preview = JSON.stringify(body).slice(0, 1500);
//     console.log("[WEBHOOK] payload (trunc):", preview);
//   } catch {}

//   const decision = extractDecision(body);
//   console.log("[WEBHOOK] decision:", decision);
//   if (!decision) return NextResponse.json({ ok: true, ignored: true });

//   // 1) Try META first
//   let { passId, approvalToken } = extractMeta(body);
//   console.log("[WEBHOOK] meta:", { passId, approvalToken });

//   // 2) Else resolve via context.id → ws_outbound_map.messageId
//   let refId: string | undefined;
//   if (!passId) {
//     refId = extractReferenceId(body);
//     console.log("[WEBHOOK] refId (context/original msg id):", refId);

//     if (!refId || !mongoUri) {
//       console.error("[WEBHOOK] missing reference id or mongo uri");
//       return NextResponse.json({ ok: false, error: "missing reference id" }, { status: 400 });
//     }

//     const client = new MongoClient(mongoUri);
//     try {
//       await client.connect();
//       const mapRow = await client.db(dbName).collection(MAP_COLLECTION).findOne({ messageId: refId });
//       console.log("[WEBHOOK] mapRow:", mapRow ? { passId: mapRow.passId, hasToken: !!mapRow.approvalToken } : null);

//       if (!mapRow?.passId) {
//         console.error("[WEBHOOK] mapping not found for", refId);
//         return NextResponse.json({ ok: false, error: "mapping not found" }, { status: 404 });
//       }

//       passId = String(mapRow.passId);
//       approvalToken = mapRow.approvalToken ? String(mapRow.approvalToken) : undefined;
//     } finally {
//       await client.close();
//     }
//   }

//   // 3) Update pass (token-first; fallback to passId-only)
//   const query: any = { passId };
//   if (approvalToken) query.approvalToken = approvalToken;
//   console.log("[WEBHOOK] query for VisitorPass:", query);

//   let pass = await VisitorPass.findOne(query);
//   if (!pass) {
//     console.warn("[WEBHOOK] token match miss, trying passId-only");
//     pass = await VisitorPass.findOne({ passId });
//   }

//   if (!pass) {
//     console.error("[WEBHOOK] pass not found for passId:", passId);
//     return NextResponse.json({ ok: false, error: "pass not found" }, { status: 404 });
//   }

//   // ---------- UPDATED BLOCK: auto check-in on approval ----------
//   pass.approvalStatus = decision;           // "approved" | "rejected"
//   pass.approvalRespondedAt = new Date();
//   pass.approvalToken = null;                // prevent re-use

//   if (decision === "approved") {
//     // set status and check-in date if not already set
//     pass.status = "active";
//     if (!pass.checkInDate) {
//       pass.checkInDate = new Date();
//     }
//   }
//   // (optional) leave status unchanged on rejection, the UI already shows "Rejected"
//   // ---------------------------------------------------------------

//   await pass.save();
//   console.log(`[WEBHOOK] ✅ updated pass ${pass.passId} -> ${decision}`);

//   return NextResponse.json({ ok: true, passId: pass.passId, approvalStatus: decision });
// }

// // app/api/ws/webhook/route.ts (add this at the bottom)
// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
//   const mode = searchParams.get("hub.mode");
//   const token = searchParams.get("hub.verify_token");
//   const challenge = searchParams.get("hub.challenge");

//   console.log("[WEBHOOK][GET] ping", { mode, tokenSet: !!token, challengeSet: !!challenge });

//   const expected = process.env.WS_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
//   if (mode === "subscribe" && token && expected && token === expected) {
//     return new Response(challenge ?? "ok", { status: 200 });
//   }
//   return new Response("ok", { status: 200 });
// }
