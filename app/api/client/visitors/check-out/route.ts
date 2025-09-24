// import { NextRequest, NextResponse } from "next/server"
// import { dbConnect } from "@/lib/mongodb"
// import VisitorPass from "@/models/VisitorPass"

// export async function POST(req: NextRequest) {
//   try {
//     await dbConnect()

//     const { passId } = await req.json()
//     const clientSession = req.cookies.get("client-session")
//     const clientId = clientSession?.value

//     console.log("[CheckOut] passId:", passId)
//     console.log("[CheckOut] clientId:", clientId)

//     if (!passId) {
//       return NextResponse.json({ error: "Pass ID is required" }, { status: 400 })
//     }
//     if (!clientId) {
//       return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
//     }

//     const query = {
//       passId,
//       clientId,
//       status: { $in: ["active", "checked_in"] }
//     }
//     console.log("[CheckOut] Query:", query)

//     const visitorPass = await VisitorPass.findOne(query)
//     console.log("[CheckOut] visitorPass:", visitorPass)

//     if (!visitorPass) {
//       return NextResponse.json({ error: "Invalid or inactive pass ID" }, { status: 404 })
//     }

//     // Update status to checked_out
//     visitorPass.status = "checked_out"
//     visitorPass.checkOutDate = new Date()
//     await visitorPass.save()
//     console.log("[CheckOut] Pass status updated to checked_out")

//     return NextResponse.json({
//       success: true,
//       pass: {
//         id: visitorPass._id,
//         passId: visitorPass.passId,
//         status: visitorPass.status,
//         checkOutDate: visitorPass.checkOutDate
//       }
//     })

//   } catch (error) {
//     console.error("Check out error:", error)
//     return NextResponse.json({ error: "Failed to check out" }, { status: 500 })
//   }
// }


import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import VisitorPass from "@/models/VisitorPass"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

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
      status: { $in: ["active", "checked_in", "checked_out"] },
    })

    if (!visitorPass) {
      return NextResponse.json({ error: "Invalid or inactive pass ID" }, { status: 404 })
    }

    const now = new Date()

    // // ✅ close the latest open history entry (if any)
    // if (Array.isArray(visitorPass.movementHistory) && visitorPass.movementHistory.length) {
    //   const openIdx = [...visitorPass.movementHistory]
    //     .map((h, i) => ({ h, i }))
    //     .reverse()
    //     .find(({ h }) => h.type === "check_in")?.i

    //   if (openIdx !== undefined) {
    //     // mark this as checkout
    //     visitorPass.movementHistory.push({
    //       timestamp: now,
    //       type: "check_out",
    //       accessPointId: accessPointId || undefined,
    //       accessPointName: accessPointName || undefined,
    //       method: method || "unknown",
    //     })
    //   }
    // } else {
    //   // if no history yet, still log checkout
    //   visitorPass.movementHistory = [
    //     {
    //       timestamp: now,
    //       type: "check_out",
    //       accessPointId: accessPointId || undefined,
    //       accessPointName: accessPointName || undefined,
    //       method: method || "unknown",
    //     },
    //   ]
    // }

     // Log the event
    visitorPass.movementHistory.push({
      timestamp: now,
      type: "check_out",
      accessPointId: accessPointId || undefined,
      accessPointName: accessPointName || undefined,
      method: method || "unknown",
    })

    visitorPass.checkOutDate = now // last actual checkout timestamp

    // ✅ after checkout, keep pass active until expiry
    if (visitorPass.expectedCheckOutTime && visitorPass.expectedCheckOutTime < now) {
      visitorPass.status = "expired"
    } else {
      visitorPass.status = "active" // allows re-entry before expiry
    }

    await visitorPass.save()

    return NextResponse.json({
      success: true,
      pass: {
        id: visitorPass._id,
        passId: visitorPass.passId,
        status: visitorPass.status,
        checkOutDate: visitorPass.checkOutDate,
      },
    })
  } catch (error) {
    console.error("Check out error:", error)
    return NextResponse.json({ error: "Failed to check out" }, { status: 500 })
  }
}
