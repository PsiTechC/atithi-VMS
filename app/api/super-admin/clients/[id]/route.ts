// import { NextResponse } from "next/server"
// import { randomUUID } from "crypto"
// import { mkdir, unlink, writeFile } from "fs/promises"
// import path from "path"
// import { Types } from "mongoose"
// import Client from "@/models/Client"
// import { dbConnect } from "@/lib/mongodb"

// export const runtime = "nodejs"
// export const dynamic = "force-dynamic"

// function toBool(v: FormDataEntryValue | null) {
//     if (v === null) return false
//     const s = String(v).trim().toLowerCase()
//     return s === "true" || s === "1" || s === "on" || s === "yes"
// }

// function toDate(v: FormDataEntryValue | null): Date | null {
//     if (!v) return null
//     const d = new Date(String(v))
//     return isNaN(d.getTime()) ? null : d
// }

// async function saveUploadToPublic(file: File | null): Promise<string | null> {
//     if (!file || file.size === 0) return null
//     const MAX = 2 * 1024 * 1024
//     if (file.size > MAX) throw new Error("Logo is too large (max 2MB).")
//     const ok = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"])
//     if (!ok.has(file.type)) throw new Error("Unsupported image type.")

//     const dir = path.join(process.cwd(), "public", "uploads")
//     await mkdir(dir, { recursive: true })
//     const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg"
//     const filename = `${randomUUID()}${ext}`
//     const dest = path.join(dir, filename)
//     const buf = Buffer.from(await file.arrayBuffer())
//     await writeFile(dest, buf)
//     return `/uploads/${filename}`
// }

// /** GET /api/super-admin/clients/:id  -> single client */
// export async function GET(_: Request, { params }: { params: { id: string } }) {
//     await dbConnect()
//     if (!Types.ObjectId.isValid(params.id)) {
//         return NextResponse.json({ error: "Invalid id" }, { status: 400 })
//     }
//     const client = await Client.findById(params.id)
//     if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })
//     return NextResponse.json(client)
// }

// /** PATCH /api/super-admin/clients/:id  -> update via multipart/form-data */
// export async function PATCH(req: Request, { params }: { params: { id: string } }) {
//     try {
//         await dbConnect()
//         if (!Types.ObjectId.isValid(params.id)) {
//             return NextResponse.json({ error: "Invalid id" }, { status: 400 })
//         }

//         const current = await Client.findById(params.id)
//         if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

//         const form = await req.formData()

//         const name = String(form.get("name") ?? current.name).trim()
//         const email = String(form.get("email") ?? current.email).trim() // map to primaryEmail if needed
//         const contacts = String(form.get("contacts") ?? current.contacts ?? "").trim()
//         const address = String(form.get("address") ?? current.address ?? "").trim()
//         const instructions = String(form.get("instructions") ?? current.instructions ?? "").trim()

//         const licenseStart = toDate(form.get("licenseStart")) ?? current.licenseStart
//         const licenseEnd = toDate(form.get("licenseEnd")) ?? current.licenseEnd
//         const isActive = form.has("isActive") ? toBool(form.get("isActive")) : !!current.isActive
//         const otpRequired = form.has("otpRequired") ? toBool(form.get("otpRequired")) : !!current.otpRequired

//         // optional new logo
//         const logo = form.get("logo")
//         let logoUrl = current.logoUrl as string | null
//         if (logo instanceof File && logo.size > 0) {
//             const newUrl = await saveUploadToPublic(logo)

//             // (optional) delete old on-disk file if it lived under /uploads
//             if (logoUrl && logoUrl.startsWith("/uploads/")) {
//                 const oldPath = path.join(process.cwd(), "public", logoUrl)
//                 try { await unlink(oldPath) } catch { }
//             }
//             logoUrl = newUrl
//         }

//         current.set({
//             name,
//             email,
//             contacts,
//             address,
//             instructions,
//             licenseStart,
//             licenseEnd,
//             isActive,
//             otpRequired,
//             logoUrl,
//         })
//         await current.save()

//         return NextResponse.json({ ok: true })
//     } catch (err: any) {
//         console.error("Update client error:", err)
//         return NextResponse.json({ error: err.message || "Failed to update client" }, { status: 500 })
//     }
// }




// // app/api/super-admin/clients/[id]/route.ts
// import { NextResponse } from "next/server"
// import { randomUUID } from "crypto"
// import { mkdir, unlink, writeFile } from "fs/promises"
// import path from "path"
// import { Types } from "mongoose"
// import Client from "@/models/Client"
// import { dbConnect } from "@/lib/mongodb"

// export const runtime = "nodejs"
// export const dynamic = "force-dynamic"

// function toBool(v: FormDataEntryValue | null) {
//     if (v === null) return false
//     const s = String(v).trim().toLowerCase()
//     return s === "true" || s === "1" || s === "on" || s === "yes"
// }

// function toDate(v: FormDataEntryValue | null): Date | null {
//     if (!v) return null
//     const d = new Date(String(v))
//     return isNaN(d.getTime()) ? null : d
// }

// async function saveUploadToPublic(file: File | null): Promise<string | null> {
//         // Use R2 for logo upload
//         if (!file || file.size === 0) return null;
//         const MAX = 2 * 1024 * 1024;
//         if (file.size > MAX) throw new Error("Logo is too large (max 2MB).");
//         const ok = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
//         if (!ok.has(file.type)) throw new Error("Unsupported image type.");
//         const arrayBuffer = await file.arrayBuffer();
//         const buffer = Buffer.from(arrayBuffer);
//         // Import R2 helpers
//         const { clientLogoKey, uploadBufferToR2 } = await import("@/lib/r2");
//         // Use client name for folder structure
//         const key = clientLogoKey(String(file.name || "client"), file);
//         const { url } = await uploadBufferToR2({
//             buffer,
//             key,
//             contentType: file.type,
//         });
//         return url;
// }

// /** GET /api/super-admin/clients/:id -> single client */
// export async function GET(_: Request, { params }: { params: { id: string } }) {
//     await dbConnect()
//     if (!Types.ObjectId.isValid(params.id)) {
//         return NextResponse.json({ error: "Invalid id" }, { status: 400 })
//     }
//     const client = await Client.findById(params.id)
//     if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })
//     return NextResponse.json(client)
// }

// /** PATCH /api/super-admin/clients/:id -> update via multipart/form-data */
// export async function PATCH(req: Request, { params }: { params: { id: string } }) {
//     try {
//         await dbConnect()
//         if (!Types.ObjectId.isValid(params.id)) {
//             return NextResponse.json({ error: "Invalid id" }, { status: 400 })
//         }

//         const current = await Client.findById(params.id)
//         if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

//         const form = await req.formData()

//         const name = String(form.get("name") ?? current.name).trim()
//         const email = String(form.get("email") ?? current.email).trim() // map to primaryEmail if needed
//         const contacts = String(form.get("contacts") ?? current.contacts ?? "").trim()
//         const address = String(form.get("address") ?? current.address ?? "").trim()
//         const instructions = String(form.get("instructions") ?? current.instructions ?? "").trim()

//         const licenseStart = toDate(form.get("licenseStart")) ?? current.licenseStart
//         const licenseEnd = toDate(form.get("licenseEnd")) ?? current.licenseEnd
//         const isActive = form.has("isActive") ? toBool(form.get("isActive")) : !!current.isActive
//         const otpRequired = form.has("otpRequired") ? toBool(form.get("otpRequired")) : !!current.otpRequired

//         // optional new logo
//         const logo = form.get("logo")
//         let logoUrl = current.logoUrl as string | null
//         if (logo instanceof File && logo.size > 0) {
//             const newUrl = await saveUploadToPublic(logo)
//             if (logoUrl && logoUrl.startsWith("/uploads/")) {
//                 const oldPath = path.join(process.cwd(), "public", logoUrl)
//                 try { await unlink(oldPath) } catch { }
//             }
//             logoUrl = newUrl
//         }

//         current.set({
//             name,
//             email,          // or primaryEmail: email
//             contacts,
//             address,
//             instructions,
//             licenseStart,
//             licenseEnd,
//             isActive,
//             otpRequired,
//             logoUrl,
//         })
//         await current.save()

//         return NextResponse.json({ ok: true })
//     } catch (err: any) {
//         console.error("Update client error:", err)
//         return NextResponse.json({ error: err.message || "Failed to update client" }, { status: 500 })
//     }
// }

// /** POST /api/super-admin/clients/:id -> actions: activate/suspend */
// export async function POST(req: Request, { params }: { params: { id: string } }) {
//     try {
//         await dbConnect()
//         if (!Types.ObjectId.isValid(params.id)) {
//             return NextResponse.json({ error: "Invalid id" }, { status: 400 })
//         }

//         const { action } = await req.json().catch(() => ({} as any))
//         if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 })

//         const client = await Client.findById(params.id)
//         if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

//         switch (String(action).toLowerCase()) {
//             case "activate": {
//                 client.isActive = true
//                 client.status = "active"
//                 await client.save()
//                 return NextResponse.json({ ok: true, status: "active" })
//             }
//             case "suspend": {
//                 client.isActive = false
//                 client.status = "suspended"
//                 await client.save()
//                 return NextResponse.json({ ok: true, status: "suspended" })
//             }
//             // You can add "resend-invite" here later if you have an Invite model + mailer
//             default:
//                 return NextResponse.json({ error: "Unknown action" }, { status: 400 })
//         }
//     } catch (err: any) {
//         console.error("Action error:", err)
//         return NextResponse.json({ error: err.message || "Failed to update status" }, { status: 500 })
//     }
// }

// /** DELETE /api/super-admin/clients/:id -> delete client (hard delete here; switch to soft if you prefer) */
// export async function DELETE(_: Request, { params }: { params: { id: string } }) {
//     try {
//         await dbConnect()
//         if (!Types.ObjectId.isValid(params.id)) {
//             return NextResponse.json({ error: "Invalid id" }, { status: 400 })
//         }

//         const current = await Client.findById(params.id)
//         if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

//         // Delete on-disk logo if it lives under /uploads
//         const logoUrl = (current.logoUrl as string | null) || null
//         if (logoUrl && logoUrl.startsWith("/uploads/")) {
//             const filePath = path.join(process.cwd(), "public", logoUrl)
//             try { await unlink(filePath) } catch { }
//         }

//         await current.deleteOne()

//         return NextResponse.json({ ok: true })
//     } catch (err: any) {
//         console.error("Delete client error:", err)
//         return NextResponse.json({ error: err.message || "Failed to delete client" }, { status: 500 })
//     }
// }


// app/api/super-admin/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { Types } from "mongoose";
import Client from "@/models/Client";
import { dbConnect } from "@/lib/mongodb";
import { saveFileToLocal } from "@/lib/localStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toBool(v: FormDataEntryValue | null) {
  if (v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "on" || s === "yes";
}

function toDate(v: FormDataEntryValue | null): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

async function saveUploadToPublic(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const MAX = 2 * 1024 * 1024;
  if (file.size > MAX) throw new Error("Logo is too large (max 2MB).");
  const ok = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
  if (!ok.has(file.type)) throw new Error("Unsupported image type.");

  //  const buffer = Buffer.from(await file.arrayBuffer());

  // // R2 helpers
  // const { clientLogoKey, uploadBufferToR2 } = await import("@/lib/r2");
  // const key = clientLogoKey(String(file.name || "client"), file);
  // const { url } = await uploadBufferToR2({
  //   buffer,
  //   key,
  //   contentType: file.type,
  // });
  const url = await saveFileToLocal(file, "ClientLogos");
  return url;
}

/** GET /api/super-admin/clients/:id -> single client */
export async function GET(_: Request, context: any) {
  await dbConnect();
  const id = context?.params?.id as string;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const client = await Client.findById(id);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

/** PATCH /api/super-admin/clients/:id -> update via multipart/form-data */
export async function PATCH(req: Request, context: any) {
  try {
    await dbConnect();
    const id = context?.params?.id as string;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const current = await Client.findById(id);
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const form = await req.formData();

    const name = String(form.get("name") ?? current.name).trim();
    const email = String(form.get("email") ?? current.email).trim();
    const contacts = String(form.get("contacts") ?? current.contacts ?? "").trim();
    const address = String(form.get("address") ?? current.address ?? "").trim();
    const instructions = String(form.get("instructions") ?? current.instructions ?? "").trim();

    const licenseStart = toDate(form.get("licenseStart")) ?? current.licenseStart;
    const licenseEnd = toDate(form.get("licenseEnd")) ?? current.licenseEnd;
    const isActive = form.has("isActive") ? toBool(form.get("isActive")) : !!current.isActive;
    const otpRequired = form.has("otpRequired") ? toBool(form.get("otpRequired")) : !!current.otpRequired;

    // optional new logo
    const logo = form.get("logo");
    let logoUrl = (current.logoUrl as string | null) || null;
    if (logo instanceof File && logo.size > 0) {
      const newUrl = await saveUploadToPublic(logo);
      if (logoUrl && logoUrl.startsWith("/uploads/")) {
        const oldPath = path.join(process.cwd(), "public", logoUrl);
        try {
          await unlink(oldPath);
        } catch {
          /* ignore */
        }
      }
      logoUrl = newUrl;
    }

    current.set({
      name,
      email,
      contacts,
      address,
      instructions,
      licenseStart,
      licenseEnd,
      isActive,
      otpRequired,
      logoUrl,
    });
    await current.save();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Update client error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update client" },
      { status: 500 }
    );
  }
}

/** POST /api/super-admin/clients/:id -> actions: activate/suspend */
export async function POST(req: Request, context: any) {
  try {
    await dbConnect();
    const id = context?.params?.id as string;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { action } = (await req.json().catch(() => ({} as any))) as { action?: string };
    if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

    switch (String(action).toLowerCase()) {
      case "activate": {
        client.isActive = true;
        client.status = "active";
        await client.save();
        return NextResponse.json({ ok: true, status: "active" });
      }
      case "suspend": {
        client.isActive = false;
        client.status = "suspended";
        await client.save();
        return NextResponse.json({ ok: true, status: "suspended" });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Action error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update status" },
      { status: 500 }
    );
  }
}

/** DELETE /api/super-admin/clients/:id -> delete client */
export async function DELETE(_: Request, context: any) {
  try {
    await dbConnect();
    const id = context?.params?.id as string;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const current = await Client.findById(id);
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Delete on-disk logo if it lives under /uploads
    const logoUrl = (current.logoUrl as string | null) || null;
    if (logoUrl && logoUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", logoUrl);
      try {
        await unlink(filePath);
      } catch {
        /* ignore */
      }
    }

    await current.deleteOne();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Delete client error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete client" },
      { status: 500 }
    );
  }
}

