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

    // Only find passes that are currently active/checked_in (do not match already checked_out)
    const visitorPass = await VisitorPass.findOne({
      passId,
      clientId,
      status: { $in: ["active", "checked_in","checked_out"] },
    })

    if (!visitorPass) {
      // Could be not-found, inactive, or already checked out
      return NextResponse.json({ error: "Invalid, inactive or already checked-out pass ID" }, { status: 404 })
    }

    const now = new Date()

    // Ensure movementHistory exists
    if (!Array.isArray(visitorPass.movementHistory)) visitorPass.movementHistory = []

    // If the last recorded movement is already a check_out, treat as already checked out
    // but allow checkout from a different access point (some sites track exits at multiple gates)
    const lastMovement = visitorPass.movementHistory.length > 0
      ? visitorPass.movementHistory[visitorPass.movementHistory.length - 1]
      : null

    if (lastMovement && lastMovement.type === 'check_out') {
      // Determine last movement access point identifier (prefer id, fallback to name)
      const lastApIdentifier = lastMovement.accessPointId || lastMovement.accessPointName || null
      const newApIdentifier = accessPointId || accessPointName || null

      const sameAccessPoint = (() => {
        // If both identifiers exist, compare them
        if (lastApIdentifier && newApIdentifier) return String(lastApIdentifier) === String(newApIdentifier)
        // If neither provided, treat as same access point (duplicate)
        if (!lastApIdentifier && !newApIdentifier) return true
        // One provided and the other not — treat as different
        return false
      })()

      if (sameAccessPoint) {
        return NextResponse.json({ error: 'Visitor already checked out at this access point' }, { status: 400 })
      }
      // otherwise allow check-out event to be recorded for a different access point
    }

    // Record checkout event
    visitorPass.movementHistory.push({
      timestamp: now,
      type: "check_out",
      accessPointId: accessPointId || undefined,
      accessPointName: accessPointName || undefined,
      method: method || "unknown",
    })

    visitorPass.checkOutDate = now // last actual checkout timestamp

    // After checkout, set status to checked_out (or expired if past expected time)
    if (visitorPass.expectedCheckOutTime && visitorPass.expectedCheckOutTime < now) {
      visitorPass.status = "expired"
    } else {
      visitorPass.status = "checked_out"
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
