// app/api/super-admin/clients/route.ts
import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import Client from "@/models/Client"
import { dbConnect } from "@/lib/mongodb"
import { saveFileToLocal } from "@/lib/localStorage"

import { checkSMTP } from "@/lib/mailer";

// Check SMTP config at startup
checkSMTP().then(ok => {
  if (ok) {
    console.log("[Mailer] SMTP server is ready.");
  } else {
    console.error("[Mailer] SMTP server is NOT ready. Check your SMTP config.");
  }
});




export const runtime = "nodejs" // ensure Node runtime for fs operations

function toBool(v: FormDataEntryValue | null): boolean {
  // Switch/checkbox in HTML forms sends "on" when checked; absent when not present.
  if (v === null) return false
  const s = String(v).trim().toLowerCase()
  return s === "true" || s === "1" || s === "on" || s === "yes"
}

function toDate(v: FormDataEntryValue | null): Date | null {
  if (!v) return null
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? null : d
}

async function saveUploadToPublic(file: File | null): Promise<string | null> {
  // Use R2 for logo upload
  if (!file || file.size === 0) return null;
  const MAX_BYTES = 2 * 1024 * 1024; // 2MB
  if (file.size > MAX_BYTES) {
    throw new Error("Logo is too large. Max 2MB.");
  }
  const allowedTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
  if (!allowedTypes.has(file.type)) {
    throw new Error("Unsupported image type. Use PNG/JPG/WEBP.");
  }
//   const arrayBuffer = await file.arrayBuffer();
//   const buffer = Buffer.from(arrayBuffer);
//   //Import R2 helpers
//   const { clientLogoKey, uploadBufferToR2 } = await import("@/lib/r2");
//  // Use clientname for folder structure
//   const key = clientLogoKey(String(file.name || "client"), file);
//   const { url } = await uploadBufferToR2({
//     buffer,
//     key,
//     contentType: file.type,
//   });
   const url = await saveFileToLocal(file, "ClientLogos");
  return url;
}

/** GET /api/super-admin/clients */
export async function GET() {
  await dbConnect()
  const clients = await Client.find().sort({ createdAt: -1 })
  return NextResponse.json(clients)
}

/** POST /api/super-admin/clients  (multipart/form-data) */
export async function POST(req: Request) {
  try {
    await dbConnect()

    // Parse the multipart body
    const form = await req.formData()

    // Basic fields
    const name = String(form.get("name") || "").trim()
    const email = String(form.get("email") || "").trim()
    const contacts = String(form.get("contacts") || "").trim()
    const address = String(form.get("address") || "").trim()
    const instructions = String(form.get("instructions") || "").trim()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 })
    }

    // Dates & booleans
    const licenseStart = toDate(form.get("licenseStart"))
    if (!licenseStart) {
      return NextResponse.json({ error: "License start date is required." }, { status: 400 })
    }
    let licenseEnd = toDate(form.get("licenseEnd"))
    if (!licenseEnd) {
      // Default to 1 year and 1 month from start
      licenseEnd = new Date(licenseStart)
      licenseEnd.setFullYear(licenseEnd.getFullYear() + 1)
      licenseEnd.setMonth(licenseEnd.getMonth() + 1)
    }
    const isActive = toBool(form.get("isActive"))
    const otpRequired = toBool(form.get("otpRequired"))

    // File (logo)
    const logoFile = form.get("logo")
    const logoUrl = await saveUploadToPublic(logoFile instanceof File ? logoFile : null)

    // Generate a password for the client invite
    function genPassword(len = 12) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
      let password = "";
      for (let i = 0; i < len; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    }

    // Create the client document
    const plainPassword = genPassword(12);
    const bcrypt = (await import("bcryptjs")).default;
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const client = await Client.create({
      name,
      email,
      contacts,
      address,
      instructions,
      licenseStart,
      licenseEnd,
      isActive,
      otpRequired,
      logoUrl, // nullable if no upload
      status: isActive ? 'active' : 'suspended',
      licenseExpiry: licenseEnd,
      users: 0,
      lastActive: new Date(),
      passwordHash,
      passwordSetAt: new Date(),
      plainPassword,
    })

    // Send invite email after client creation
    const { sendInviteEmail } = await import("@/lib/mailer");
    const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
    const loginUrl = `${baseUrl}/login`;

    try {
      console.log(`[Mailer] Sending invite email to ${email}...`);
      await sendInviteEmail({
        to: email,
        clientName: name,
        loginUrl,
        emailForLogin: email,
        plainPassword,
      });
      console.log(`[Mailer] Invite email sent to ${email}`);
    } catch (mailErr) {
      console.error(`[Mailer] Failed to send invite email to ${email}:`, mailErr);
    }

    return NextResponse.json(client, { status: 201 })
  } catch (err: any) {
    console.error("Create client error:", err)
    return NextResponse.json({ error: err.message || "Failed to create client" }, { status: 500 })
  }
}

