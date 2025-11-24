// // // /app/api/visitor-pass/all/route.ts
// // import { NextResponse } from "next/server";
// // import type { NextRequest } from "next/server";
// // import { dbConnect } from "@/lib/mongodb";
// // import VisitorPass from "@/models/VisitorPass";
// // import { requireUser } from "@/lib/auth";
// // import { Types } from "mongoose";

// // export async function GET(req: NextRequest) {
// //   try {
// //     await dbConnect();

// //     // Block direct HTML hits
// //     const accept = req.headers.get("accept") || "";
// //     if (accept.includes("text/html")) {
// //       return new Response("Not Found", { status: 404 });
// //     }

// //     // Auth + roles
// //     const user = requireUser(req, ["super-admin", "client-admin", "client-user"]);
// //     if (user.role !== "super-admin" && !user.clientId) {
// //       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// //     }

// //     const { searchParams } = new URL(req.url);
// //     const passId = searchParams.get("passId");

// //     // Single pass lookup (still tenant-scoped unless super-admin)
// //     if (passId) {
// //       const query: any = { passId };
// //       if (user.role !== "super-admin") query.clientId = user.clientId;

// //       const pass = await VisitorPass.findOne(query).lean();
// //       if (!pass) return NextResponse.json({ error: "Pass not found" }, { status: 404 });
// //       return NextResponse.json({ pass });
// //     }

// //     // ---- Batched fetch: 50 per page, newest-first ----
// //     const limitParam = Number(searchParams.get("limit") || 50);
// //     const limit = Math.max(1, Math.min(limitParam, 50)); // hard cap 50
// //     const cursor = searchParams.get("cursor"); // last _id from previous page (string)

// //     const query: any = {};
// //     if (user.role !== "super-admin") query.clientId = user.clientId;

// //     // For newest-first paging, fetch documents with _id < cursor (older than last one)
// //     if (cursor && Types.ObjectId.isValid(cursor)) {
// //       query._id = { $lt: new Types.ObjectId(cursor) };
// //     }

// //     // Only return fields you render to shrink payloads
// //     const projection = {
// //       passId: 1,
// //       name: 1,
// //       phone: 1,
// //       photoUrl: 1,
// //       comingFrom: 1,
// //       purposeOfVisit: 1,
// //       host: 1,
// //       visitorIdText: 1,
// //       checkInDate: 1,
// //       checkOutDate: 1,
// //       clientId: 1,
// //     };

// //     // Sort by newest first using monotonic _id, fetch one extra to detect hasMore
// //     const docs = await VisitorPass.find(query, projection).sort({ _id: -1 }).limit(limit + 1).lean();

// //     const hasMore = docs.length > limit;
// //     const page = hasMore ? docs.slice(0, -1) : docs;
// //     const nextCursor = page.length ? String(page[page.length - 1]._id) : null;

// //     return NextResponse.json({ passes: page, nextCursor, hasMore });
// //   } catch (error) {
// //     const errorMessage =
// //       typeof error === "object" && error !== null && "message" in error
// //         ? (error as { message?: string }).message
// //         : "Failed to fetch pass details";
// //     return NextResponse.json({ error: errorMessage }, { status: 500 });
// //   }
// // }
// // /app/api/visitor-pass/all/route.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import VisitorPass from "@/models/VisitorPass";
// import { requireUser } from "@/lib/auth";

// export async function GET(req: NextRequest) {
//   try {
//     await dbConnect();

//     // No HTML browsing
//     const accept = req.headers.get("accept") || "";
//     if (accept.includes("text/html")) {
//       return new Response("Not Found", { status: 404 });
//     }

//     // Auth
//     const user = requireUser(req, ["super-admin", "client-admin", "client-user"]);
//     if (user.role !== "super-admin" && !user.clientId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const passIdParam = searchParams.get("passId");

//     // Single pass fetch (tenant-scoped unless super-admin)
//     if (passIdParam) {
//       const query: any = { passId: isNaN(Number(passIdParam)) ? passIdParam : Number(passIdParam) };
//       if (user.role !== "super-admin") query.clientId = user.clientId;

//       const pass = await VisitorPass.findOne(query).lean();
//       if (!pass) return NextResponse.json({ error: "Pass not found" }, { status: 404 });
//       return NextResponse.json({ pass });
//     }

//     // --------- Batched listing by passId DESC ----------
//     const limitParam = Number(searchParams.get("limit") || 50);
//     const limit = Math.max(1, Math.min(limitParam, 50)); // hard cap 50
//     const cursorParam = searchParams.get("cursor"); // last passId from previous page (number)
//     const cursorPassId = cursorParam ? Number(cursorParam) : null;

//     const query: any = {};
//     if (user.role !== "super-admin") query.clientId = user.clientId;

//     // If we have a cursor, ask for strictly smaller passIds (older)
//     if (cursorPassId !== null && !Number.isNaN(cursorPassId)) {
//       query.passId = { $lt: cursorPassId };
//     }

//     // Keep payload lean
//     const projection = {
//       passId: 1,
//       name: 1,
//       phone: 1,
//       photoUrl: 1,
//       comingFrom: 1,
//       purposeOfVisit: 1,
//       host: 1,
//       visitorIdText: 1,
//       checkInDate: 1,
//       checkOutDate: 1,
//       clientId: 1,
//     };

//     // Newest first by passId
//     const docs = await VisitorPass.find(query, projection)
//       .sort({ passId: -1 })     // <-- highest passId first
//       .limit(limit + 1)         // fetch one extra to detect hasMore
//       .lean();

//     const hasMore = docs.length > limit;
//     const page = hasMore ? docs.slice(0, -1) : docs;
//     const nextCursor = page.length ? Number(page[page.length - 1].passId) : null;

//     return NextResponse.json({ passes: page, nextCursor, hasMore });
//   } catch (error) {
//     const errorMessage =
//       typeof error === "object" && error !== null && "message" in error
//         ? (error as { message?: string }).message
//         : "Failed to fetch pass details";
//     return NextResponse.json({ error: errorMessage }, { status: 500 });
//   }
// }

// // /app/api/visitor-pass/all/route.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import VisitorPass from "@/models/VisitorPass";
// import { requireUser } from "@/lib/auth";
// import { Types } from "mongoose";

// export async function GET(req: NextRequest) {
//   try {
//     await dbConnect();
//     const accept = req.headers.get("accept") || "";
//     if (accept.includes("text/html")) return new Response("Not Found", { status: 404 });

//     const user = requireUser(req, ["super-admin", "client-admin", "client-user"]);
//     if (user.role !== "super-admin" && !user.clientId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);
//     const passIdParam = searchParams.get("passId");
//     if (passIdParam) {
//       const query: any = { passId: isNaN(Number(passIdParam)) ? passIdParam : Number(passIdParam) };
//       if (user.role !== "super-admin") query.clientId = user.clientId;
//       const pass = await VisitorPass.findOne(query).lean();
//       if (!pass) return NextResponse.json({ error: "Pass not found" }, { status: 404 });
//       return NextResponse.json({ pass });
//     }

//     const limitParam = Number(searchParams.get("limit") || 50);
//     const limit = Math.max(1, Math.min(limitParam, 50));

//     const cursorDateStr = searchParams.get("cursorDate");
//     const cursorIdStr = searchParams.get("cursorId");

//     const query: any = {};
//     if (user.role !== "super-admin") query.clientId = user.clientId;

//     // Ensure we only page over real dates
//     query.checkInDate = { $type: "date" };

//     if (cursorDateStr && cursorIdStr && Types.ObjectId.isValid(cursorIdStr)) {
//       const cursorDate = new Date(cursorDateStr);
//       const cursorId = new Types.ObjectId(cursorIdStr);
//       query.$or = [
//         { checkInDate: { $lt: cursorDate } },
//         { checkInDate: cursorDate, _id: { $lt: cursorId } },
//       ];
//     }

//     const projection = {
//       passId: 1,
//       name: 1,
//       phone: 1,
//       photoUrl: 1,
//       comingFrom: 1,
//       purposeOfVisit: 1,
//       host: 1,
//       visitorIdText: 1,
//       checkInDate: 1,
//       checkOutDate: 1,
//       clientId: 1,
//     };

//     const docs = await VisitorPass.find(query, projection)
//       .sort({ checkInDate: -1, _id: -1 })
//       .limit(limit + 1)
//       .lean();

//     const hasMore = docs.length > limit;
//     const page = hasMore ? docs.slice(0, -1) : docs;

//     // If page ended up empty (e.g., boundary equal), stop paging
//     if (page.length === 0) {
//       return NextResponse.json({
//         passes: [],
//         nextCursor: null,
//         hasMore: false,
//       });
//     }

//     const last = page[page.length - 1];
//     const nextCursor = {
//       cursorDate: last.checkInDate ? new Date(last.checkInDate).toISOString() : null,
//       cursorId: String(last._id),
//     };

//     return NextResponse.json({
//       passes: page,
//       nextCursor: hasMore ? nextCursor : null,
//       hasMore,
//     });
//   } catch (error) {
//     const errorMessage =
//       typeof error === "object" && error !== null && "message" in error
//         ? (error as { message?: string }).message
//         : "Failed to fetch pass details";
//     return NextResponse.json({ error: errorMessage }, { status: 500 });
//   }
// }

// /app/api/visitor-pass/all/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import VisitorPass from "@/models/VisitorPass";
import { requireUser } from "@/lib/auth";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Block direct HTML hits
    const accept = req.headers.get("accept") || "";
    if (accept.includes("text/html")) return new Response("Not Found", { status: 404 });

    // Auth + tenant scope
    const user = requireUser(req, ["super-admin", "client-admin", "client-user"]);
    if (user.role !== "super-admin" && !user.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const passIdParam = searchParams.get("passId");

    // ---------- Single pass ----------
    if (passIdParam) {
      const query: any = { passId: isNaN(Number(passIdParam)) ? passIdParam : Number(passIdParam) };
      if (user.role !== "super-admin") query.clientId = user.clientId;

      const pass = await VisitorPass.findOne(query).lean();
      if (!pass) return NextResponse.json({ error: "Pass not found" }, { status: 404 });
      return NextResponse.json({ pass });
    }

    // ---------- Batched listing (newest-first by checkInDate, tie-break _id) ----------
    const limitParam = Number(searchParams.get("limit") || 15);
    const limit = Math.max(1, Math.min(limitParam, 15)); // cap at 50

    const cursorDateStr = searchParams.get("cursorDate");
    const cursorIdStr = searchParams.get("cursorId");

    const query: any = {};
    if (user.role !== "super-admin") query.clientId = user.clientId;

    // Only page across docs that actually have a date in checkInDate
    query.checkInDate = { $type: "date" };

    // Cursor: fetch strictly older than (cursorDate, cursorId)
    if (cursorDateStr && cursorIdStr && Types.ObjectId.isValid(cursorIdStr)) {
      const cursorDate = new Date(cursorDateStr);
      const cursorId = new Types.ObjectId(cursorIdStr);
      query.$or = [
        { checkInDate: { $lt: cursorDate } },
        { checkInDate: cursorDate, _id: { $lt: cursorId } },
      ];
    }

    // ✅ Projection now includes status + expiry-related fields used by the frontend
    const projection = {
      passId: 1,
      name: 1,
      phone: 1,
      photoUrl: 1,
      qrCode:1,
      comingFrom: 1,
      company: 1,
      email: 1,
      purposeOfVisit: 1,
      purpose: 1,
      host: 1,
      visitorIdText: 1,

      checkInDate: 1,
      checkOutDate: 1,
      checkOutTime: 1,

      // status-related
      status: 1,
  approvalRequired: 1,
  approvalStatus: 1,
      passStatus: 1,
      expired: 1,
      isExpired: 1,
      expiryDate: 1,
      validTo: 1,
      validUntil: 1,
      expectedCheckOutTime: 1,

      clientId: 1,
    };

    const docs = await VisitorPass.find(query, projection)
      .sort({ checkInDate: -1, _id: -1 })
      .limit(limit + 1) // fetch one extra to detect hasMore
      .lean();

    const hasMore = docs.length > limit;
    const page = hasMore ? docs.slice(0, -1) : docs;

    // If this page is empty, stop paging
    if (page.length === 0) {
      return NextResponse.json({
        passes: [],
        nextCursor: null,
        hasMore: false,
      });
    }

    // Next cursor = last item on this page
    const last = page[page.length - 1];
    const nextCursor = {
      cursorDate: last.checkInDate ? new Date(last.checkInDate).toISOString() : null,
      cursorId: String(last._id),
    };

    return NextResponse.json({
      passes: page,
      nextCursor: hasMore ? nextCursor : null,
      hasMore,
    });
  } catch (error) {
    const errorMessage =
      typeof error === "object" && error !== null && "message" in error
        ? (error as { message?: string }).message
        : "Failed to fetch pass details";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
