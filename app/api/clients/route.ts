// app/api/super-admin/clients/route.ts
import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { mkdir, writeFile } from "fs/promises"
import path from "path"
import Client from "@/models/Client"
import { dbConnect } from "@/lib/mongodb"

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
  if (!file || file.size === 0) return null

  // Basic guardrails (tune as needed)
  const MAX_BYTES = 2 * 1024 * 1024 // 2MB
  if (file.size > MAX_BYTES) {
    throw new Error("Logo is too large. Max 2MB.")
  }

  const allowedTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"])
  if (!allowedTypes.has(file.type)) {
    throw new Error("Unsupported image type. Use PNG/JPG/WEBP.")
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadsDir, { recursive: true })

  // Generate a stable extension and unique name
  const ext =
    file.type === "image/png"
      ? ".png"
      : file.type === "image/webp"
        ? ".webp"
        : ".jpg"

  const filename = `${randomUUID()}${ext}`
  const dest = path.join(uploadsDir, filename)

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await writeFile(dest, buffer)

  // Public URL (served by Next static files)
  return `/uploads/${filename}`
}

/** GET /api/super-admin/clients */
export async function GET() {
  await dbConnect()
  const clients = await Client.find().sort({ createdAt: -1 })
  return NextResponse.json(clients)
}

// /** POST /api/super-admin/clients  (multipart/form-data) */
// export async function POST(req: Request) {
//   try {
//     await dbConnect()

//     // Parse the multipart body
//     const form = await req.formData()

//     // Basic fields
//     const name = String(form.get("name") || "").trim()
//     const email = String(form.get("email") || "").trim()
//     const contacts = String(form.get("contacts") || "").trim()
//     const address = String(form.get("address") || "").trim()
//     const instructions = String(form.get("instructions") || "").trim()

//     if (!name || !email) {
//       return NextResponse.json({ error: "Name and email are required." }, { status: 400 })
//     }

//     // Dates & booleans
//     const licenseStart = toDate(form.get("licenseStart"))
//     const licenseEnd = toDate(form.get("licenseEnd"))
//     if (!licenseStart || !licenseEnd) {
//       return NextResponse.json({ error: "Valid license start/end dates are required." }, { status: 400 })
//     }
//     const isActive = toBool(form.get("isActive"))
//     const otpRequired = toBool(form.get("otpRequired"))

//     // File (logo)
//     const logoFile = form.get("logo")
//     const logoUrl = await saveUploadToPublic(logoFile instanceof File ? logoFile : null)

//     // Create the client document
//     const client = await Client.create({
//       name,
//       email,
//       contacts,
//       address,
//       instructions,
//       licenseStart,
//       licenseEnd,
//       isActive,
//       otpRequired,
//       logoUrl, // nullable if no upload
//     })

//     return NextResponse.json(client, { status: 201 })
//   } catch (err: any) {
//     console.error("Create client error:", err)
//     return NextResponse.json({ error: err.message || "Failed to create client" }, { status: 500 })
//   }
// }

