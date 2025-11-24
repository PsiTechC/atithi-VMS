// scripts/ws-watcher.ts
import "dotenv/config";
import { MongoClient } from "mongodb";
import mongoose from "mongoose";

const wsUri = process.env.MONGODB_URI_WS || process.env.MONGODB_URI_MQTT!;
const wsDbName = process.env.DB_NAME_WS || process.env.MONGODB_DB || "chatbot";
const WS_COLL = "whatsappresponses";

const appUriForMap = process.env.MONGODB_URI_MQTT!;
const appDbForMap = process.env.MONGODB_DB || "doorsense";
const MAP_COLL = "ws_outbound_map";

const appUriMain = process.env.MONGODB_URI as string; // your main app DB (VisitorPass)

const visitorPassSchema = new mongoose.Schema(
  {
    passId: String,
    approvalStatus: String,
    approvalToken: String,
    approvalRespondedAt: Date,
  },
  { collection: "visitorpasses" } // adjust if your collection name differs
);
const VisitorPass =
  (mongoose.models.VisitorPass as mongoose.Model<any>) ||
  mongoose.model("VisitorPass", visitorPassSchema);

function parseRaw(raw: any) {
  if (!raw) return null;
  try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
  catch { return raw; }
}
const isFlowUnused = (o: any) => o && o.flow_token === "unused";

function extractDecision(obj: any): "approved" | "rejected" | null {
  const o = parseRaw(obj) ?? {};
  const blob = typeof o === "string" ? o : JSON.stringify(o);

  if (/approve/i.test(blob)) return "approved";
  if (/reject/i.test(blob)) return "rejected";

  if (o?.button_reply?.title) {
    if (/approve/i.test(o.button_reply.title)) return "approved";
    if (/reject/i.test(o.button_reply.title)) return "rejected";
  }
  if (o?.list_reply?.title) {
    if (/approve/i.test(o.list_reply.title)) return "approved";
    if (/reject/i.test(o.list_reply.title)) return "rejected";
  }
  if (o?.body) {
    if (/^\s*approve(d)?\s*$/i.test(o.body)) return "approved";
    if (/^\s*reject(ed)?\s*$/i.test(o.body)) return "rejected";
  }
  return null;
}

async function processDoc(wsClient: MongoClient, doc: any) {
  const decision = extractDecision(doc.raw_response_json);
  if (!decision) return;               // not an approval flow
  if (doc.raw_response_json && !isFlowUnused(doc.raw_response_json)) return; // ignore in-progress flows

  // 1) If meta contains passId/approvalToken, we can skip the map
  const metaPassId = doc?.meta?.passId as string | undefined;
  const metaToken  = doc?.meta?.approvalToken as string | undefined;

  let passId: string | undefined = metaPassId;
  let approvalToken: string | undefined = metaToken;

  // 2) Else map context_message_id -> ws_outbound_map.messageId
  if (!passId) {
    const ctxId = doc.context_message_id;
    if (!ctxId) return;

    const mapClient = new MongoClient(appUriForMap);
    let map: any;
    try {
      await mapClient.connect();
      map = await mapClient.db(appDbForMap).collection(MAP_COLL).findOne({ messageId: ctxId });
    } finally {
      await mapClient.close();
    }
    if (!map?.passId) return;

    passId = String(map.passId);
    approvalToken = map.approvalToken ? String(map.approvalToken) : undefined;
  }

  // 3) Update VisitorPass (token-first, then fallback to passId-only)
  const query: any = { passId };
  if (approvalToken) query.approvalToken = approvalToken;

  let pass = await VisitorPass.findOne(query);
  if (!pass) pass = await VisitorPass.findOne({ passId });
  if (!pass) return;

  pass.approvalStatus = decision; // "approved" | "rejected"
  pass.approvalRespondedAt = new Date();
  pass.approvalToken = null;      // prevent reuse
  await pass.save();

  // 4) mark processed
  await wsClient.db(wsDbName).collection(WS_COLL)
    .updateOne({ _id: doc._id }, { $set: { processed_by_watcher: true, processedAt: new Date() } });

  console.log(`✅ VisitorPass ${pass.passId} -> ${decision}`);
}

async function start() {
  await mongoose.connect(appUriMain);

  const wsClient = new MongoClient(wsUri);
  await wsClient.connect();
  const coll = wsClient.db(wsDbName).collection(WS_COLL);
  console.log("🔔 Watching whatsappresponses…");

  const pipeline = [{ $match: { operationType: { $in: ["insert", "update", "replace"] } } }];
  let cs: any;

  async function handle(change: any) {
    try {
      const doc = change.fullDocument ?? change;
      if (!doc || doc.processed_by_watcher === true) return;
      await processDoc(wsClient, doc);
    } catch (e: any) {
      console.error("process error:", e.message || e);
    }
  }

  try {
    cs = coll.watch(pipeline, { fullDocument: "updateLookup" });
    cs.on("change", handle);
    cs.on("error", (err: any) => {
      console.error("changeStream error:", err?.message || err);
      startPolling();
    });
    cs.on("close", () => {
      console.warn("changeStream closed → polling fallback");
      startPolling();
    });
  } catch (e: any) {
    console.error("open changeStream failed:", e?.message || e);
    startPolling();
  }

  function startPolling() {
    setInterval(async () => {
      const docs = await coll.find({ processed_by_watcher: { $ne: true } })
        .sort({ createdAt: 1 }).limit(20).toArray();
      for (const d of docs) await handle(d);
    }, 5000);
  }
}

if (require.main === module) {
  start().catch(e => {
    console.error("watcher fatal:", e);
    process.exit(1);
  });
}
