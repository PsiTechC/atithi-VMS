// import { NextRequest, NextResponse } from "next/server"
// import { dbConnect } from "@/lib/mongodb"
// import VisitorPass from "@/models/VisitorPass"
// import "@/models/Client";

// export async function POST(req: NextRequest) {
//   try {
//     await dbConnect()

//     const { passId } = await req.json()
//     const clientSession = req.cookies.get("client-session")
//     const clientId = clientSession?.value

//     console.log("[CheckPass] passId:", passId)
//     console.log("[CheckPass] clientId:", clientId)

//     if (!passId) {
//       console.log("[CheckPass] Missing passId")
//       return NextResponse.json({ error: "Pass ID is required" }, { status: 400 })
//     }
//     if (!clientId) {
//       console.log("[CheckPass] Missing clientId")
//       return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
//     }

//     const query = {
//       passId,
//       clientId,
//       status: { $in: ['active', 'checked_in','checked_out','expired'] }
//     }
//     console.log("[CheckPass] Query:", query)

//     const visitorPass = await VisitorPass.findOne(query).populate('clientId', 'name')

//     console.log("[CheckPass] visitorPass:", visitorPass)

//     if (!visitorPass) {
//       console.log("[CheckPass] No matching pass found")
//       return NextResponse.json({ error: "Invalid or inactive pass ID" }, { status: 404 })
//     }

//     // Check if pass is expired (regardless of status)
//     if (visitorPass.checkOutDate < new Date()) {
//       visitorPass.status = 'expired';
//       await visitorPass.save();
//       console.log("[CheckPass] Pass expired");
//       return NextResponse.json({ error: "Pass has expired" }, { status: 400 });
//     }

//     // Update status to checked_in if not already
//     if (visitorPass.status === 'active') {
//       visitorPass.status = 'checked_in'
//       await visitorPass.save()
//       console.log("[CheckPass] Pass status updated to checked_in")
//     }

//     return NextResponse.json({
//       success: true,
//       visitor: {
//         name: visitorPass.name,
//         visitorType: visitorPass.visitorType,
//         purposeOfVisit: visitorPass.purposeOfVisit,
//         host: visitorPass.host,
//         checkInDate: visitorPass.checkInDate,
//         checkOutDate: visitorPass.checkOutDate
//       },
//       pass: {
//         id: visitorPass._id,
//         passId: visitorPass.passId,
//         status: visitorPass.status
//       }
//     })

//   } catch (error) {
//     console.error("Check pass error:", error)
//     return NextResponse.json({ error: "Failed to check pass" }, { status: 500 })
//   }
// }


import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import VisitorPass from "@/models/VisitorPass"
import "@/models/Client";

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    // If accessed directly in browser (not XHR/fetch), return generic message
    const accept = req.headers.get('accept') || '';
    if (accept.includes('text/html')) {
      return new Response('Not Found', { status: 404 });
    }

    const { passId, accessPointId, accessPointName, method } = await req.json()
    const clientSession = req.cookies.get("client-session")
    const clientId = clientSession?.value

    if (!passId) {
      return NextResponse.json({ error: "Pass ID is required" }, { status: 400 })
    }
    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    const visitorPass = await VisitorPass.findOne({
      passId,
      clientId,
      status: { $in: ["active", "checked_in", "checked_out", "expired"] },
    }).populate("clientId", "name")

    if (!visitorPass) {
      return NextResponse.json({ error: "Invalid or inactive pass ID" }, { status: 404 })
    }

    const now = new Date()

    // ✅ use expectedCheckOutTime, not checkOutDate, to decide expiry
    if (visitorPass.expectedCheckOutTime && visitorPass.expectedCheckOutTime < now) {
      visitorPass.status = "expired"
      await visitorPass.save()
      return NextResponse.json({ error: "Pass has expired", expired: true }, { status: 400 })
    }

    // ✅ allow re-entry (active OR checked_out → checked_in)
    if (visitorPass.status === "active" || visitorPass.status === "checked_out") {
      visitorPass.status = "checked_in"
       visitorPass.checkInDate = now
    }

    // ✅ always log this event in movementHistory
    visitorPass.movementHistory = visitorPass.movementHistory || []
    visitorPass.movementHistory.push({
      timestamp: now,
      type: "check_in",
      accessPointId: accessPointId || undefined,
      accessPointName: accessPointName || undefined,
      method: method || "unknown",
    })

    await visitorPass.save()

    return NextResponse.json({
      success: true,
      visitor: {
        name: visitorPass.name,
        visitorType: visitorPass.visitorType,
        purposeOfVisit: visitorPass.purposeOfVisit,
        host: visitorPass.host,
        checkInDate: visitorPass.checkInDate,
        checkOutDate: visitorPass.checkOutDate,
      },
      pass: {
        id: visitorPass._id,
        passId: visitorPass.passId,
        status: visitorPass.status,
      },
    })
  } catch (error) {
    console.error("Check pass error:", error)
    return NextResponse.json({ error: "Failed to check pass" }, { status: 500 })
  }
}
