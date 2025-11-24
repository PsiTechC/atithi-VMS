
// lib/ws.ts
import axios from "axios";
import https from "https";
import { MongoClient } from "mongodb";

const HOST = "whatsapp-api-backend-production.up.railway.app";
//const HOST = "https://e237dfec0dc7.ngrok-free.app";
const RESOLVE_IP = process.env.WS_API_IP || "66.33.22.191";
const USE_RESOLVE = (process.env.WS_USE_RESOLVE || "true").toLowerCase() === "true";
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_BEARER_TOKEN;

// optional: save outbound mapping so webhook can resolve pass later
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "visitormanagement";
const outboxCollection = "ws_outbound_map";

async function saveOutboundMap(doc: {
  messageId: string;
  passId: string;
  approvalToken: string;
  hostPhone: string;
}) {
  if (!mongoUri) return;
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    await db.collection(outboxCollection).insertOne({ ...doc, createdAt: new Date() });
  } finally {
    await client.close();
  }
}

// --- Minimal response types (no axios types) --- //
type WsMessage = { id?: string };
type WsEnvelope = { messages?: WsMessage[] };
type WsSendResponse = {
  messages?: WsMessage[];
  metaResponse?: WsEnvelope;
  [k: string]: unknown;
};

export async function sendHostApprovalMessage(
  toNumber: string,
  p: {
    hostName: string;
    visitorName: string;
    visitorPhone: string;
    comingFrom: string;
    purpose: string;
    passId?: string;
    approvalToken?: string;
  },
  // Optional: client name to map to template variable {{1}}
  clientName?: string
) {
  if (!WHATSAPP_API_KEY) throw new Error("Missing WHATSAPP_API_KEY");

  const url = USE_RESOLVE
    ? `https://${RESOLVE_IP}/api/send-message`
    : `https://${HOST}/api/send-message`;

  const httpsAgent =
    USE_RESOLVE ? new https.Agent({ servername: HOST, rejectUnauthorized: true }) : undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": WHATSAPP_API_KEY,
    ...(USE_RESOLVE ? { Host: HOST } : {}),
  };

  //const template_name = "atithi_host_3";
  const template_name = "atithi_host_4";
  const to =
    toNumber.startsWith("+") || toNumber.startsWith("00") ? toNumber : `+91${toNumber}`;

  // Template parameters mapping:
  // New template expects: {{1}}=clientName, {{2}}=hostName, {{3}}=visitorName,
  // {{4}}=visitorPhone, {{5}}=comingFrom, {{6}}=purpose
  const parameters: string[] = []
  // push clientName (if provided) else fallback to hostName to preserve older behavior
  parameters.push(clientName || p.hostName || "Host")
  parameters.push(p.hostName || "")
  parameters.push(p.visitorName || "")
  parameters.push(p.visitorPhone || "")
  parameters.push(p.comingFrom || "")
  parameters.push(p.purpose || "")

  const payload: Record<string, unknown> = {
    to_number: to,
    template_name,
    whatsapp_request_type: "TEMPLATE",
    parameters,
  };

  // if your gateway echoes meta back to webhook, include it
  if (p.passId || p.approvalToken) {
    (payload as any).meta = { passId: p.passId, approvalToken: p.approvalToken };
  }

  // Config without importing axios types
  const config: any = {
    headers,
    proxy: false,
    ...(httpsAgent ? { httpsAgent } : {}),
  };

  const resp = await axios.post(url, payload, config);
  const data = resp.data as WsSendResponse;

  const messageId =
    data?.messages?.[0]?.id || data?.metaResponse?.messages?.[0]?.id || undefined;

  if (messageId && p.passId && p.approvalToken) {
    await saveOutboundMap({
      messageId,
      passId: p.passId,
      approvalToken: p.approvalToken,
      hostPhone: to,
    });
  }

  return data;
}

/**
 * Send host approval message to multiple phone numbers
 * @param phoneNumbers Array of phone numbers to send to
 * @param p Visitor and host details
 * @param clientName Optional client name
 * @returns Array of results indicating success/failure for each number
 */
export async function sendHostApprovalToMultipleNumbers(
  phoneNumbers: string[],
  p: {
    hostName: string;
    visitorName: string;
    visitorPhone: string;
    comingFrom: string;
    purpose: string;
    passId?: string;
    approvalToken?: string;
  },
  clientName?: string
): Promise<{ phone: string; success: boolean; error?: string; messageId?: string }[]> {
  const results: { phone: string; success: boolean; error?: string; messageId?: string }[] = [];

  // Send to each phone number in parallel
  const sendPromises = phoneNumbers.map(async (phoneNumber) => {
    try {
      const response = await sendHostApprovalMessage(phoneNumber, p, clientName);
      const messageId =
        response?.messages?.[0]?.id || response?.metaResponse?.messages?.[0]?.id || undefined;

      results.push({
        phone: phoneNumber,
        success: true,
        messageId,
      });
    } catch (error: any) {
      results.push({
        phone: phoneNumber,
        success: false,
        error: error?.message || String(error),
      });
    }
  });

  // Wait for all sends to complete
  await Promise.allSettled(sendPromises);

  return results;
}
