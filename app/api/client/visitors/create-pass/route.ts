

import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import Visitor from "@/models/Visitor"
import VisitorPass from "@/models/VisitorPass"
import QRCode from "qrcode-generator"
import { saveFileToLocal } from "@/lib/localStorage";
import { randomUUID } from "crypto";
import  {sendHostApprovalMessage, sendHostApprovalToMultipleNumbers}  from "@/lib/ws";

// Augment globalThis to include clientName
declare global {
  var clientName: string | undefined;
}

export const runtime = "nodejs"

// Generate unique passId like 20250924-<uuid>
function generatePassId(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

// Generate a base64 PNG QR code image from passId
async function generateQRCode(passId: string): Promise<string> {
  const qr = QRCode(0, "L");
  qr.addData(`VISITOR_PASS:${passId}`);
  qr.make();
  return qr.createDataURL(8, 0); // base64 PNG
}

async function savePhotoToPublic(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const MAX_BYTES = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_BYTES) throw new Error("Photo is too large. Max 5MB.");

  const allowedTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
  if (!allowedTypes.has(file.type)) throw new Error("Unsupported image type. Use PNG/JPG/WEBP.");

  const url = await saveFileToLocal(file, "Visitors");
return url;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const clientSession = req.cookies.get("client-session");
    if (!clientSession) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    const clientId = clientSession.value;
    if (!clientId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const Client = (await import("@/models/Client")).default;
    const client = await Client.findById(clientId);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    globalThis.clientName = client.name;

    // ✅ Always parse FormData
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const visitorType = formData.get("visitorType") as string;
    const comingFrom = formData.get("comingFrom") as string;
    const purposeOfVisit = formData.get("purposeOfVisit") as string;
  const host = formData.get("host") as string;
  const hostIdFromForm = formData.get("hostId") as string | null;
    const idType = formData.get("idType") as string;
    const visitorIdText = formData.get("visitorIdText") as string;
    const checkInDateStr = formData.get("checkInDate") as string;
    const expectedCheckOutTimeStr = formData.get("expectedCheckOutTime") as string;
    const email = formData.get("email") as string;
    const notes = formData.get("notes") as string;
    const phone = formData.get("phone") as string;
    const photoFile = formData.get("photo") as File | null;

    // Accept either a host name/text or an explicit hostId from the form
    if (!name || !visitorType || !comingFrom || !purposeOfVisit || (!host && !hostIdFromForm) || !idType || !visitorIdText || !checkInDateStr || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const checkInDate = new Date(checkInDateStr);
    const checkOutDate = null;
    const checkoutHours: number = client.defaultCheckoutHour || 12;
    const expectedCheckOutTime = expectedCheckOutTimeStr
      ? new Date(expectedCheckOutTimeStr)
      : new Date(checkInDate.getTime() + checkoutHours * 60 * 60 * 1000);

    // Generate unique passId + QR
    const today = new Date();
    const passId = generatePassId(today);
    const qrCode = await generateQRCode(passId);

    // Find or create Visitor
    let visitor = await Visitor.findOne({ phone, clientId });
    if (!visitor) {
      visitor = await Visitor.create({
        clientId,
        name,
        passId,
        email: email || "",
        phone,
        company: comingFrom,
      });
    } else {
      visitor.passId = passId;
      await visitor.save();
    }

        const photoUrl = await savePhotoToPublic(photoFile);
        
    //const templateName = process.env.WHATSAPP_HOST_APPROVAL_TEMPLATE || 'atithi_host_1'

    // Try to resolve host to a Host document (prefer hostId if provided, then id, name, phone or email)
    const Host = (await import("@/models/Host")).default;
    let hostRecord = null;
    try {
      // Prefer explicit hostId from the form (sent when a host was chosen in the UI)
      if (hostIdFromForm && /^[0-9a-fA-F]{24}$/.test(hostIdFromForm)) {
        hostRecord = await Host.findOne({ _id: hostIdFromForm, clientId });
      }
      // If host looks like an ObjectId, try findById first
      if (!hostRecord && host && /^[0-9a-fA-F]{24}$/.test(host)) {
        hostRecord = await Host.findOne({ _id: host, clientId });
      }
      // If not found, try exact name match
      if (!hostRecord) {
        hostRecord = await Host.findOne({ clientId, name: host });
      }
      // fallback: partial name, phone digits or email
      if (!hostRecord) {
        hostRecord = await Host.findOne({ clientId, $or: [ { name: new RegExp(`^${host}$`, 'i') }, { phone: host }, { email: host } ] });
      }
    } catch (e) {
            // Non-fatal - keep hostRecord null and continue
      console.debug("Host lookup failed", e);
      hostRecord = null;
    }

              // const res = await fetch(url, {
              //   method: 'POST',
              //   headers: { 'content-type': 'application/json' },
              //   body: JSON.stringify({ name: hostRecord.name, number: hostRecord.phone, templateName: templateName, parameters: [visitorPass.name || '', passData.comingFrom || '', passData.purposeOfVisit || '', approveUrl, rejectUrl] })

    // Prepare visitor pass data
    // const passData: any = {
    //   name,
    //   visitorType,
    //   comingFrom,
    //   purposeOfVisit,
    //   host: hostRecord ? hostRecord.name : host,
    //   idType,
    //   visitorIdText,
    //   passId,
    //   visitorId: visitor._id,
    //   phone: visitor.phone,
    //   checkInDate,
    //   checkOutDate,
    //   expectedCheckOutTime,
    //   email,
    //   notes,
    //   photoUrl,
    //   qrCode,
    //   status: "active",
    //   clientId,
    // };

    // Prepare visitor pass data
const passData: any = {
  name,
  visitorType,
  comingFrom,
  purposeOfVisit,
  host: hostRecord ? hostRecord.name : host,
  idType,
  visitorIdText,
  passId,
  visitorId: visitor._id,
  phone: visitor.phone,
  checkInDate,
  checkOutDate,
  expectedCheckOutTime,
  email,
  notes,
  photoUrl,
  qrCode,
  clientId,
};

// Default status; if host has approvalRequired → mark waiting
let approvalRequired = false;
let approvalStatus: "approved" | "pending" = "approved";
// let status: "active" | "waiting for approval" = "active";

// // If we resolved a Host document, attach its _id and check approval requirement
// if (hostRecord) {
//   passData.hostId = hostRecord._id;
//   passData.host = hostRecord.name;
//   if (hostRecord.approvalRequired) {
//     approvalRequired = true;
//     approvalStatus = "pending";
//     status = "waiting for approval";
//     passData.approvalRequired = true;
//     passData.approvalStatus = "pending";
//     passData.approvalToken = randomUUID();
//     passData.approvalRequestedAt = new Date();
//   }
// }


let status: "active" = "active"; // valid enum value

if (hostRecord.approvalRequired) {
  approvalRequired = true;
  approvalStatus = "pending";
  passData.approvalRequired = true;
  passData.approvalStatus = "pending";
  passData.approvalToken = randomUUID();
  passData.approvalRequestedAt = new Date();
  // status remains "active"
}


// Always include top-level status
passData.status = status;


    // If we resolved a Host document, attach its _id and check approval requirement
    if (hostRecord) {
      passData.hostId = hostRecord._id;
      passData.host = hostRecord.name;
      if (hostRecord.approvalRequired) {
        passData.approvalRequired = true;
        passData.approvalStatus = 'pending';
        passData.approvalToken = randomUUID();
        passData.approvalRequestedAt = new Date();
      }
    }

    // If approval was required, send WhatsApp approval request to host (best-effort)
    let waSent = false
    let waError: string | null = null
    let waDetails: any[] = []

    const visitorPass = await VisitorPass.create(passData);

    if (hostRecord && hostRecord.approvalRequired && visitorPass.approvalToken) {
  try {
    // Get all phone numbers from the host (prefer phones array, fallback to single phone)
    const phoneNumbers = hostRecord.phones && hostRecord.phones.length > 0
      ? hostRecord.phones
      : hostRecord.phone
        ? [hostRecord.phone]
        : [];

    if (phoneNumbers.length === 0) {
      throw new Error("No phone numbers found for host");
    }

    // Send approval message to all phone numbers
    const results = await sendHostApprovalToMultipleNumbers(
      phoneNumbers,
      {
        hostName: hostRecord.name || "Host",
        visitorName: visitorPass.name || "",
        visitorPhone: visitorPass.phone || "",
        comingFrom: passData.comingFrom || "",
        purpose: passData.purposeOfVisit || "",
        passId,
        approvalToken: visitorPass.approvalToken!,
      },
      client.name
    );

    // Track results for each number
    waDetails = results;

    // Consider it sent if at least one succeeded
    const successCount = results.filter(r => r.success).length;
    waSent = successCount > 0;

    // If all failed, set error message
    if (successCount === 0) {
      waError = `Failed to send to all ${phoneNumbers.length} number(s)`;
    } else if (successCount < phoneNumbers.length) {
      waError = `Sent to ${successCount}/${phoneNumbers.length} number(s)`;
    }

    console.log(`WhatsApp approval sent to ${successCount}/${phoneNumbers.length} number(s)`, results);
  } catch (e: any) {
    waSent = false;
    waError = String(e?.message || e);
    console.error("Host approval send failed:", waError);
  }
}

    return NextResponse.json(
      {
        success: true,
        passId,
        visitorPass: {
          id: visitorPass._id,
          name: visitorPass.name,
          passId: visitorPass.passId,
          visitorIdText: visitorPass.visitorIdText,
          qrCode: visitorPass.qrCode,
          checkInDate: visitorPass.checkInDate,
          checkOutDate: visitorPass.checkOutDate,
          host: visitorPass.host,
          hostId: visitorPass.hostId || null,
          approvalRequired: visitorPass.approvalRequired || false,
          approvalStatus: visitorPass.approvalStatus || 'approved',
        },
        whatsapp: {
          sent: waSent,
          error: waError,
          details: waDetails.length > 0 ? waDetails : undefined
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create pass error:", error);
    return NextResponse.json({ error: error.message || "Failed to create visitor pass" }, { status: 500 });
  }
}
