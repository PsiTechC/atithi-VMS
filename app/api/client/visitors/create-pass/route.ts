


import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import Visitor from "@/models/Visitor"
import VisitorPass from "@/models/VisitorPass"
import QRCode from "qrcode-generator"
import { saveFileToLocal } from "@/lib/localStorage";
import { randomUUID } from "crypto";


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

  // const arrayBuffer = await file.arrayBuffer();
  // const buffer = Buffer.from(arrayBuffer);
  // const { visitorImageKey, uploadBufferToR2 } = await import("@/lib/r2");
  // let clientName = "client";
  // try {
  //   if (typeof globalThis.clientName === "string") clientName = globalThis.clientName;
  // } catch {}
  // const key = visitorImageKey(clientName, file);
  // const { url } = await uploadBufferToR2({ buffer, key, contentType: file.type });
  // return url;


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
    const idType = formData.get("idType") as string;
    const visitorIdText = formData.get("visitorIdText") as string;
    const checkInDateStr = formData.get("checkInDate") as string;
    const expectedCheckOutTimeStr = formData.get("expectedCheckOutTime") as string;
    const email = formData.get("email") as string;
    const notes = formData.get("notes") as string;
    const phone = formData.get("phone") as string;
    const photoFile = formData.get("photo") as File | null;

    if (!name || !visitorType || !comingFrom || !purposeOfVisit || !host || !idType || !visitorIdText || !checkInDateStr || !phone) {
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

    const visitorPass = await VisitorPass.create({
      name,
      visitorType,
      comingFrom,
      purposeOfVisit,
      host,
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
      status: "active",
      clientId,
    });

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
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create pass error:", error);
    return NextResponse.json({ error: error.message || "Failed to create visitor pass" }, { status: 500 });
  }
}

