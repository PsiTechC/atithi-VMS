// // /app/api/visitor-pass/overview/route.ts
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import VisitorPass from "@/models/VisitorPass";
// import { requireUser } from "@/lib/auth";

// // Small helpers to compute date ranges in server's local timezone
// function startOfDay(d: Date) {
//   const x = new Date(d);
//   x.setHours(0, 0, 0, 0);
//   return x;
// }
// function addDays(d: Date, n: number) {
//   const x = new Date(d);
//   x.setDate(x.getDate() + n);
//   return x;
// }
// function startOfMonth(d: Date) {
//   return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
// }
// function startOfNextMonth(d: Date) {
//   return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
// }
// function startOfLastMonth(d: Date) {
//   return new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0);
// }

// export async function GET(req: NextRequest) {
//   try {
//     await dbConnect();

//     // Block direct HTML hits
//     const accept = req.headers.get("accept") || "";
//     if (accept.includes("text/html")) return new Response("Not Found", { status: 404 });

//     // Auth + tenant scope
//     const user = requireUser(req, ["super-admin", "client-admin", "client-user"]);
//     if (user.role !== "super-admin" && !user.clientId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const baseQuery: any = {};
//     if (user.role !== "super-admin") baseQuery.clientId = user.clientId;

//     const now = new Date();
//     const todayStart = startOfDay(now);
//     const tomorrowStart = addDays(todayStart, 1);
//     const thisMonthStart = startOfMonth(now);
//     const nextMonthStart = startOfNextMonth(now);
//     const lastMonthStart = startOfLastMonth(now);

//     // -------- Stats --------

//     // Today’s visitors (by check-in date in [todayStart, tomorrowStart))
//     const todayCount = await VisitorPass.countDocuments({
//       ...baseQuery,
//       checkInDate: { $gte: todayStart, $lt: tomorrowStart },
//     });

//     // Currently on-site (no checkout + not expired based on several fields)
//     const onSiteCount = await VisitorPass.countDocuments({
//       ...baseQuery,
//       $and: [
//         { $or: [{ checkOutDate: null }, { checkOutDate: { $exists: false } }] },
//         { $or: [{ checkOutTime: null }, { checkOutTime: { $exists: false } }] },
//         // not explicitly expired flags
//         { $or: [{ status: { $ne: "expired" } }, { status: { $exists: false } }] },
//         { $or: [{ passStatus: { $ne: "expired" } }, { passStatus: { $exists: false } }] },
//         { $or: [{ expired: { $ne: true } }, { expired: { $exists: false } }] },
//         { $or: [{ isExpired: { $ne: true } }, { isExpired: { $exists: false } }] },
//         // validity windows not in the past (or absent)
//         { $or: [{ expiryDate: { $gt: now } }, { expiryDate: null }, { expiryDate: { $exists: false } }] },
//         { $or: [{ validTo: { $gt: now } }, { validTo: null }, { validTo: { $exists: false } }] },
//         { $or: [{ validUntil: { $gt: now } }, { validUntil: null }, { validUntil: { $exists: false } }] },
//         // expected checkout time only implies expired if status is active/checked_in
//         {
//           $or: [
//             { expectedCheckOutTime: { $gt: now } },
//             { expectedCheckOutTime: null },
//             { expectedCheckOutTime: { $exists: false } },
//             { status: { $nin: ["checked_in", "active"] } },
//           ],
//         },
//       ],
//     });

//     // This month & last month totals
//     const thisMonthCount = await VisitorPass.countDocuments({
//       ...baseQuery,
//       checkInDate: { $gte: thisMonthStart, $lt: nextMonthStart },
//     });

//     const lastMonthCount = await VisitorPass.countDocuments({
//       ...baseQuery,
//       checkInDate: { $gte: lastMonthStart, $lt: thisMonthStart },
//     });

//     const monthPercent =
//       lastMonthCount > 0
//         ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100
//         : thisMonthCount > 0
//         ? 100
//         : 0;

//     // Top purpose today
//     const topPurposeAgg = await VisitorPass.aggregate([
//       { $match: { ...baseQuery, checkInDate: { $gte: todayStart, $lt: tomorrowStart } } },
//       {
//         $project: {
//           purpose: {
//             $ifNull: ["$purposeOfVisit", { $ifNull: ["$purpose", "Other"] }],
//           },
//         },
//       },
//       { $group: { _id: "$purpose", count: { $sum: 1 } } },
//       { $sort: { count: -1 } },
//       { $limit: 1 },
//     ]);

//     const topPurpose = topPurposeAgg.length
//       ? { name: topPurposeAgg[0]._id as string, count: topPurposeAgg[0].count as number }
//       : null;

//     // Recent visitors (newest by checkInDate, tie-break by _id)
//     const recentLimit = Number(new URL(req.url).searchParams.get("recentLimit") || 50);
//     const safeRecentLimit = Math.max(1, Math.min(recentLimit, 50));

//     const recentVisitors = await VisitorPass.find(
//       { ...baseQuery, checkInDate: { $type: "date" } },
//       {
//         passId: 1,
//         name: 1,
//         phone: 1,
//         photoUrl: 1,
//         comingFrom: 1,
//         company: 1,
//         purposeOfVisit: 1,
//         purpose: 1,
//         host: 1,
//         visitorIdText: 1,
//         checkInDate: 1,
//         checkOutDate: 1,
//         checkOutTime: 1,
//         status: 1,
//         passStatus: 1,
//         expired: 1,
//         isExpired: 1,
//         expiryDate: 1,
//         validTo: 1,
//         validUntil: 1,
//         expectedCheckOutTime: 1,
//       }
//     )
//       .sort({ checkInDate: -1, _id: -1 })
//       .limit(safeRecentLimit)
//       .lean();

//     return NextResponse.json({
//       todayCount,
//       onSiteCount,
//       thisMonthCount,
//       lastMonthCount,
//       monthPercent,
//       topPurpose, // { name, count } | null
//       recentVisitors,
//     });
//   } catch (error) {
//     const msg =
//       typeof error === "object" && error !== null && "message" in error
//         ? (error as any).message
//         : "Failed to compute overview";
//     return NextResponse.json({ error: msg }, { status: 500 });
//   }
// }


// /app/api/visitor-pass/overview/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import VisitorPass from "@/models/VisitorPass";
import { requireUser } from "@/lib/auth";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
}
function startOfLastMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0);
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const accept = req.headers.get("accept") || "";
    if (accept.includes("text/html")) return new Response("Not Found", { status: 404 });

    const user = requireUser(req, ["super-admin", "client-admin", "client-user"]);
    if (user.role !== "super-admin" && !user.clientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseQuery: any = {};
    if (user.role !== "super-admin") baseQuery.clientId = user.clientId;

    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = addDays(todayStart, 1);
    const thisMonthStart = startOfMonth(now);
    const nextMonthStart = startOfNextMonth(now);
    const lastMonthStart = startOfLastMonth(now);

    // ---- Stats ----
    const todayCount = await VisitorPass.countDocuments({
      ...baseQuery,
      checkInDate: { $gte: todayStart, $lt: tomorrowStart },
    });

    const onSiteCount = await VisitorPass.countDocuments({
      ...baseQuery,
      $and: [
        { $or: [{ checkOutDate: null }, { checkOutDate: { $exists: false } }] },
        { $or: [{ checkOutTime: null }, { checkOutTime: { $exists: false } }] },
        { $or: [{ status: { $ne: "expired" } }, { status: { $exists: false } }] },
        { $or: [{ passStatus: { $ne: "expired" } }, { passStatus: { $exists: false } }] },
        { $or: [{ expired: { $ne: true } }, { expired: { $exists: false } }] },
        { $or: [{ isExpired: { $ne: true } }, { isExpired: { $exists: false } }] },
        { $or: [{ expiryDate: { $gt: now } }, { expiryDate: null }, { expiryDate: { $exists: false } }] },
        { $or: [{ validTo: { $gt: now } }, { validTo: null }, { validTo: { $exists: false } }] },
        { $or: [{ validUntil: { $gt: now } }, { validUntil: null }, { validUntil: { $exists: false } }] },
        {
          $or: [
            { expectedCheckOutTime: { $gt: now } },
            { expectedCheckOutTime: null },
            { expectedCheckOutTime: { $exists: false } },
            { status: { $nin: ["checked_in", "active"] } },
          ],
        },
      ],
    });

    // ✅ Checked-out today (supports either checkOutDate or checkOutTime fields)
    const todayCheckedOutCount = await VisitorPass.countDocuments({
      ...baseQuery,
      $or: [
        { checkOutDate: { $gte: todayStart, $lt: tomorrowStart } },
        { checkOutTime: { $gte: todayStart, $lt: tomorrowStart } },
      ],
    });

    const thisMonthCount = await VisitorPass.countDocuments({
      ...baseQuery,
      checkInDate: { $gte: thisMonthStart, $lt: nextMonthStart },
    });

    const lastMonthCount = await VisitorPass.countDocuments({
      ...baseQuery,
      checkInDate: { $gte: lastMonthStart, $lt: thisMonthStart },
    });

    const monthPercent =
      lastMonthCount > 0
        ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100
        : thisMonthCount > 0
        ? 100
        : 0;

    const topPurposeAgg = await VisitorPass.aggregate([
      { $match: { ...baseQuery, checkInDate: { $gte: todayStart, $lt: tomorrowStart } } },
      {
        $project: {
          purpose: {
            $ifNull: ["$purposeOfVisit", { $ifNull: ["$purpose", "Other"] }],
          },
        },
      },
      { $group: { _id: "$purpose", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    let topPurpose = topPurposeAgg.length
      ? { name: topPurposeAgg[0]._id as string, count: topPurposeAgg[0].count as number }
      : null;

    // Fallback: if aggregation didn't return a top purpose (possible when dates/types mismatch),
    // compute a simple top-purpose from today's documents in JS as a safety net.
    if (!topPurpose) {
      try {
        const todaysDocs = await VisitorPass.find(
          { ...baseQuery, checkInDate: { $gte: todayStart, $lt: tomorrowStart } },
          { purposeOfVisit: 1, purpose: 1 }
        ).lean();

        const counts: Record<string, number> = {};
        for (const d of todaysDocs) {
          const p = (d.purposeOfVisit || d.purpose || 'Other') as string;
          counts[p] = (counts[p] || 0) + 1;
        }
        const entries = Object.entries(counts);
        if (entries.length) {
          entries.sort((a, b) => b[1] - a[1]);
          topPurpose = { name: entries[0][0], count: entries[0][1] };
        }
      } catch (e) {
        // swallow fallback errors and keep topPurpose as null
      }
    }

    const recentLimit = Number(new URL(req.url).searchParams.get("recentLimit") || 50);
    const safeRecentLimit = Math.max(1, Math.min(recentLimit, 50));

    const recentVisitors = await VisitorPass.find(
      { ...baseQuery, checkInDate: { $type: "date" } },
      {
        passId: 1,
        name: 1,
        phone: 1,
        photoUrl: 1,
        comingFrom: 1,
        company: 1,
        purposeOfVisit: 1,
        purpose: 1,
        host: 1,
        visitorIdText: 1,
        checkInDate: 1,
        checkOutDate: 1,
        checkOutTime: 1,
        status: 1,
        passStatus: 1,
        expired: 1,
        isExpired: 1,
        expiryDate: 1,
        validTo: 1,
        validUntil: 1,
        expectedCheckOutTime: 1,
      }
    )
      .sort({ checkInDate: -1, _id: -1 })
      .limit(safeRecentLimit)
      .lean();

    return NextResponse.json({
      todayCount,
      onSiteCount,
      todayCheckedOutCount, // <-- NEW
      thisMonthCount,
      lastMonthCount,
      monthPercent,
      topPurpose,
      recentVisitors,
    });
  } catch (error) {
    const msg =
      typeof error === "object" && error !== null && "message" in error
        ? (error as any).message
        : "Failed to compute overview";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
