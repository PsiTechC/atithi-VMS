// watch-whatsapp-responses.js
require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

// ---- WS DB (where inbound WhatsApp replies are saved) ----
const WS_URI = process.env.MONGODB_URI_WS;
const WS_DB  = process.env.DB_NAME_WS || "chatbot";
const WS_COLLECTION = "whatsappresponses";

// ---- App DB (where VisitorPass + mapping live) ----
const APP_URI = process.env.MONGODB_URI;                  // e.g., your Next.js app DB
const APP_DB  = process.env.MONGODB_DB || "visitormanagement";
const MAP_COLLECTION  = "ws_outbound_map";                // { messageId, passId, approvalToken }
const PASS_COLLECTION = "visitorpasses";                  // VisitorPass docs

// --------------- helpers ---------------
function parseJsonMaybe(raw) {
  if (!raw) return null;
  try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
  catch { return raw; }
}

function extractDecisionFromRaw(raw) {
  const obj  = parseJsonMaybe(raw) || {};
  const text = typeof obj === "string" ? obj : JSON.stringify(obj);

  // generic match
  if (/approve/i.test(text)) return "approved";
  if (/reject/i.test(text))  return "rejected";

  // common shapes
  const t1 = obj?.button_reply?.title || obj?.list_reply?.title;
  if (t1) {
    if (/approve/i.test(t1)) return "approved";
    if (/reject/i.test(t1))  return "rejected";
  }
  const body = obj?.body;
  if (body) {
    if (/^\s*approve(d)?\s*$/i.test(body)) return "approved";
    if (/^\s*reject(ed)?\s*$/i.test(body))  return "rejected";
  }
  return null;
}

function extractMetaFromDoc(doc) {
  const meta = doc?.meta || {};
  return {
    passId:       meta?.passId ? String(meta.passId) : undefined,
    approvalToken: meta?.approvalToken ? String(meta.approvalToken) : undefined,
  };
}

async function resolveFromMap(contextMessageId) {
  if (!APP_URI) return null;
  const c = new MongoClient(APP_URI);
  try {
    await c.connect();
    const row = await c.db(APP_DB).collection(MAP_COLLECTION).findOne({ messageId: String(contextMessageId) });
    if (!row?.passId) return null;
    return {
      passId: String(row.passId),
      approvalToken: row.approvalToken ? String(row.approvalToken) : undefined,
    };
  } finally {
    await c.close();
  }
}


async function updateVisitorPass(passId, approvalToken, decision) {
  if (!APP_URI) return { ok: false, reason: "no-app-uri" };
  const c = new MongoClient(APP_URI);
  try {
    await c.connect();
    const coll = c.db(APP_DB).collection(PASS_COLLECTION);
    const now = new Date();

    // token-first
    if (approvalToken) {
      const qToken = { passId, approvalToken };
      const u1 = await coll.updateOne(
        qToken,
        {
          $set: { approvalStatus: decision, approvalRespondedAt: now },
          $unset: { approvalToken: "" }
        }
      );
      if (u1.matchedCount > 0) {
        const docAfter = await coll.findOne({ passId });
        return { ok: true, passId: docAfter?.passId || passId, decision };
      }
    }

    // passId-only fallback
    const u2 = await coll.updateOne(
      { passId },
      {
        $set: { approvalStatus: decision, approvalRespondedAt: now },
        $unset: { approvalToken: "" }
      }
    );
    if (u2.matchedCount === 0) {
      return { ok: false, reason: "pass-not-found" };
    }
    const docAfter = await coll.findOne({ passId });
    return { ok: true, passId: docAfter?.passId || passId, decision };
  } catch (e) {
    console.error("[WATCHER][UPD] error:", e?.message || e);
    return { ok: false, reason: "exception" };
  } finally {
    await c.close();
  }
}

// async function updateVisitorPass(passId, approvalToken, decision) {
//   if (!APP_URI) return { ok: false, reason: "no-app-uri" };
//   const c = new MongoClient(APP_URI);
//   try {
//     await c.connect();
//     const coll = c.db(APP_DB).collection(PASS_COLLECTION);
//     const now = new Date();

//     // Base fields we always set
//     const setBase = {
//       approvalStatus: decision,          // "approved" | "rejected"
//       approvalRespondedAt: now,
//     };

//     // Try token-first (if we have one)
//     let res = await coll.findOneAndUpdate(
//       approvalToken ? { passId, approvalToken } : { passId },
//       {
//         $set: {
//           ...setBase,
//           ...(decision === "approved" ? { status: "active" } : {}),
//         },
//         $unset: { approvalToken: "" },
//       },
//       { returnDocument: "after" }
//     );

//     // If approved and no checkInDate present yet, set it once (without clobbering)
//     if (res.value && decision === "approved" && !res.value.checkInDate) {
//       res = await coll.findOneAndUpdate(
//         { _id: res.value._id, checkInDate: { $in: [null, undefined] } },
//         { $set: { checkInDate: now } },
//         { returnDocument: "after" }
//       );
//     }

//     // Fallback to passId-only if token path missed
//     if (!res.value && approvalToken) {
//       res = await coll.findOneAndUpdate(
//         { passId },
//         {
//           $set: {
//             ...setBase,
//             ...(decision === "approved" ? { status: "active" } : {}),
//           },
//           $unset: { approvalToken: "" },
//         },
//         { returnDocument: "after" }
//       );

//       if (res.value && decision === "approved" && !res.value.checkInDate) {
//         res = await coll.findOneAndUpdate(
//           { _id: res.value._id, checkInDate: { $in: [null, undefined] } },
//           { $set: { checkInDate: now } },
//           { returnDocument: "after" }
//         );
//       }
//     }

//     if (!res.value) return { ok: false, reason: "pass-not-found" };
//     return { ok: true, passId: res.value.passId, decision };
//   } catch (e) {
//     console.error("[WATCHER][UPD] error:", e?.message || e);
//     return { ok: false, reason: "exception" };
//   } finally {
//     await c.close();
//   }
// }



// --------------- watcher ---------------
async function startWatcher() {
  if (!WS_URI) {
    console.error("❌ Missing MONGODB_URI_WS");
    process.exit(1);
  }

  const client = new MongoClient(WS_URI);
  await client.connect();
  console.log("✅ Connected to WS DB");

  const db = client.db(WS_DB);
  const coll = db.collection(WS_COLLECTION);

  //const pipeline = [{ $match: { operationType: { $in: ["insert", "update", "replace"] } } }];
  const pipeline = [{ $match: { operationType: "insert" } }];

  const processDoc = async (doc) => {
    if (!doc) return;
    if (doc.processed_by_watcher) return; // already handled

    const decision = extractDecisionFromRaw(doc.raw_response_json);
    if (!decision) {
      // mark inspected to avoid infinite loop (optional)
      await coll.updateOne({ _id: doc._id }, { $set: { processed_by_watcher: true, processedAt: new Date(), reason: "no-decision" } });
      return;
    }

    // resolve pass
    let { passId, approvalToken } = extractMetaFromDoc(doc);
    if (!passId && doc.context_message_id) {
      const resolved = await resolveFromMap(doc.context_message_id);
      if (resolved) ({ passId, approvalToken } = resolved);
    }
    if (!passId) {
      await coll.updateOne({ _id: doc._id }, { $set: { processed_by_watcher: true, processedAt: new Date(), reason: "no-passId" } });
      console.warn("⚠️ watcher: no passId for context_message_id:", doc.context_message_id);
      return;
    }

    const res = await updateVisitorPass(passId, approvalToken, decision);
    if (res.ok) {
      console.log(`✅ watcher: VisitorPass ${res.passId} -> ${decision}`);
      await coll.updateOne(
        { _id: doc._id },
        { $set: { processed_by_watcher: true, processedAt: new Date(), result: { passId: res.passId, decision } } }
      );
    } else {
      console.warn("⚠️ watcher: update failed:", res.reason);
      await coll.updateOne(
        { _id: doc._id },
        { $set: { processed_by_watcher: true, processedAt: new Date(), reason: res.reason || "update-failed" } }
      );
    }
  };

  let changeStream;
  try {
    changeStream = coll.watch(pipeline, { fullDocument: "updateLookup" });
    console.log("🔔 Change stream opened on whatsappresponses");

    changeStream.on("change", async (change) => {
      try { await processDoc(change.fullDocument); }
      catch (e) { console.error("❌ watcher change error:", e?.message || e); }
    });

    changeStream.on("error", (err) => {
      console.error("❌ watcher stream error:", err?.message || err);
      startPollingFallback().catch((e) => console.error("poll fallback start failed:", e?.message || e));
    });

    changeStream.on("close", () => {
      console.warn("⚠️ watcher stream closed; starting poll fallback");
      startPollingFallback().catch((e) => console.error("poll fallback start failed:", e?.message || e));
    });
  } catch (err) {
    console.error("❌ watcher stream open failed:", err?.message || err);
    startPollingFallback().catch((e) => console.error("poll fallback start failed:", e?.message || e));
  }

  // polling fallback (every 5s)
  let polling = null;
  async function startPollingFallback() {
    if (polling) return;
    console.log("🔁 Polling fallback enabled (5s)");
    polling = setInterval(async () => {
      try {
        const docs = await coll.find({ processed_by_watcher: { $ne: true } }).limit(20).toArray();
        for (const doc of docs) {
          try { await processDoc(doc); }
          catch (e) { console.error("❌ watcher poll doc error:", e?.message || e); }
        }
      } catch (e) {
        console.error("❌ watcher poll error:", e?.message || e);
      }
    }, 5000);
  }
}

if (require.main === module) {
  startWatcher().catch((err) => {
    console.error("❌ Failed to start watcher:", err?.message || err);
    process.exit(1);
  });
}

module.exports = { startWatcher };
