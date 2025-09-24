// import { S3Client } from "@aws-sdk/client-s3";
// import { PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
// import { Upload } from "@aws-sdk/lib-storage";
// import { randomUUID } from "crypto";
// import path from "path";
// import axios from "axios";


// // Environment variables
// const accountId = process.env.R2_ACCOUNT_ID!;
// const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
// const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
// const region = process.env.R2_REGION;
// const bucket = process.env.R2_BUCKET!;
// const publicBase = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
// //const endpoint = process.env.R2_ENDPOINT;

// // Debug logging for troubleshooting signature issues
// console.log("[R2 DEBUG] ENVIRONMENT VARIABLES:");
// console.log({
//   R2_ACCOUNT_ID: accountId,
//   R2_ACCESS_KEY_ID: accessKeyId,
//   R2_SECRET_ACCESS_KEY: secretAccessKey,
//   R2_REGION: region,
//   R2_BUCKET: bucket,
//   R2_PUBLIC_URL: publicBase
// });

// const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

// export const r2Client = new S3Client({
//   region: region, // Cloudflare R2 APAC region
//   endpoint,
//   forcePathStyle: true,
//   credentials: { accessKeyId, secretAccessKey },
//   maxAttempts: 3,
// });

// console.log("[R2 DEBUG] S3Client config:", {
//   region,
//   endpoint,
//   forcePathStyle: true,
//   credentials: { accessKeyId, secretAccessKey },
//   bucket
// });

// // Utility functions
// export function keyToPublicUrl(key: string) {
//     if (!publicBase) throw new Error("R2_PUBLIC_URL is not set for public buckets");
//     return `${publicBase}/${key.replace(/^\/+/, "")}`;
// }

// export function slugify(input: string, { max = 80 } = {}) {
//     return (input || "unnamed")
//         .normalize("NFKD")
//         .replace(/[\u0300-\u036f]/g, "")
//         .replace(/[^a-zA-Z0-9]+/g, "-")
//         .replace(/^-+|-+$/g, "")
//         .toLowerCase()
//         .slice(0, max);
// }

// export function extFromMimeOrName(mime: string | undefined, filename?: string) {
//     const explicit = filename ? path.extname(filename) : "";
//     if (explicit) return explicit;
//     if (mime === "image/png") return ".png";
//     if (mime === "image/jpeg") return ".jpg";
//     if (mime === "image/webp") return ".webp";
//     return ".bin";
// }

// // Key for client logo: ClientName/client-logo/logo.ext
// export function clientLogoKey(clientName: string, file: { type?: string; name?: string }) {
//     const clientSlug = slugify(clientName);
//     const ext = extFromMimeOrName(file.type, file.name);
//     return `${clientSlug}/client-logo/logo${ext}`;
// }

// // Key for visitor image: ClientName/Visitors/uuid.ext
// export function visitorImageKey(clientName: string, file: { type?: string; name?: string }) {
//     const clientSlug = slugify(clientName);
//     const ext = extFromMimeOrName(file.type, file.name);
//     return `${clientSlug}/Visitors/${randomUUID()}${ext}`;
// }

// // NEW: Key for host image: ClientName/Hosts/uuid.ext
// export function hostImageKey(clientName: string, file: { type?: string; name?: string }) {
//     const clientSlug = slugify(clientName);
//     const ext = extFromMimeOrName(file.type, file.name);
//     return `${clientSlug}/Hosts/${randomUUID()}${ext}`;
// }

// // Upload buffer to R2
// export async function uploadBufferToR2(opts: {
//     buffer: Buffer;
//     key: string;
//     contentType?: string;
//     cacheControl?: string;
// }): Promise<{ key: string; url: string }> {
//     try {
//         console.log(`[R2 Upload] Starting upload for key: ${opts.key}`);
//         console.log(`[R2 Upload] Buffer size: ${opts.buffer.length} bytes`);
//         console.log(`[R2 Upload] Content type: ${opts.contentType || "application/octet-stream"}`);

//         const upload = new Upload({
//             client: r2Client,
//             params: {
//                 Bucket: bucket,
//                 Key: opts.key,
//                 Body: opts.buffer,
//                 ContentType: opts.contentType || "application/octet-stream",
//                 CacheControl: opts.cacheControl ?? "public, max-age=31536000, immutable",
//             },
//         });

//         await upload.done();
//         console.log(`[R2 Upload] Successfully uploaded: ${opts.key}`);

//         const url = publicBase ? keyToPublicUrl(opts.key) : "";
//         return { key: opts.key, url };
//     } catch (error: any) {
//         console.error(`[R2 Upload] Error uploading ${opts.key}:`, error);
//         console.error(`[R2 Upload] Error details:`, {
//             message: error.message,
//             code: error.code,
//             statusCode: error.statusCode,
//             region: region ,
//             endpoint,
//             bucket
//         });
//         throw error;
//     }
// }

// // Delete from R2
// export async function deleteFromR2(key: string): Promise<void> {
//     try {
//         await r2Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
//         await r2Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
//     } catch {
//         // ignore not found
//     }
// }



// export async function uploadFileToR2Public(file: File, subfolder = "uploads"): Promise<string> {
//   const buffer = Buffer.from(await file.arrayBuffer());
//   const ext = path.extname(file.name) || ".jpg";
//   const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
//   const accountId = process.env.R2_ACCOUNT_ID!;
//   const bucket = process.env.R2_BUCKET!;
//   const publicBase = process.env.R2_PUBLIC_URL || "";

//   // Construct the upload URL
//   const uploadUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${subfolder}/${fileName}`;

//   // Upload using HTTP PUT
//   await axios.put(uploadUrl, buffer, {
//     headers: {
//       "Content-Type": file.type || "application/octet-stream"
//     }
//   });

//   // Return the public URL
//   return `${publicBase}/${subfolder}/${fileName}`;
// }