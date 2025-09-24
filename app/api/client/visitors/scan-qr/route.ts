import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import VisitorPass from "@/models/VisitorPass"

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const { qrData } = await req.json()

    if (!qrData) {
      return NextResponse.json({ error: "QR data is required" }, { status: 400 })
    }

    // Decode QR data (assuming it's base64 encoded pass ID)
    let passId: string
    try {
      const decoded = Buffer.from(qrData, 'base64').toString()
      if (decoded.startsWith('VISITOR_PASS:')) {
        passId = decoded.replace('VISITOR_PASS:', '')
      } else {
        // Try to find by QR code directly
        const visitorPass = await VisitorPass.findOne({
          qrCode: qrData,
          status: { $in: ['active', 'checked_in'] }
        })

        if (!visitorPass) {
          return NextResponse.json({ error: "Invalid QR code" }, { status: 404 })
        }

        passId = visitorPass.visitorIdText
      }
    } catch (error) {
      return NextResponse.json({ error: "Invalid QR code format" }, { status: 400 })
    }

    // Find the visitor pass
    const visitorPass = await VisitorPass.findOne({
      visitorIdText: passId,
      status: { $in: ['active', 'checked_in'] }
    }).populate('clientId', 'name')

    if (!visitorPass) {
      return NextResponse.json({ error: "Invalid or inactive pass" }, { status: 404 })
    }

    // Check if pass is expired
    if (visitorPass.checkOutDate < new Date()) {
      visitorPass.status = 'expired'
      await visitorPass.save()
      return NextResponse.json({ error: "Pass has expired" }, { status: 400 })
    }

    // Update status to checked_in if not already
    if (visitorPass.status === 'active') {
      visitorPass.status = 'checked_in'
      await visitorPass.save()
    }

    return NextResponse.json({
      success: true,
      visitor: {
        name: visitorPass.name,
        visitorType: visitorPass.visitorType,
        purposeOfVisit: visitorPass.purposeOfVisit,
        host: visitorPass.host,
        checkInDate: visitorPass.checkInDate,
        checkOutDate: visitorPass.checkOutDate
      },
      pass: {
        id: visitorPass._id,
        passId: visitorPass.visitorIdText,
        status: visitorPass.status
      }
    })

  } catch (error) {
    console.error("QR scan error:", error)
    return NextResponse.json({ error: "Failed to process QR scan" }, { status: 500 })
  }
}
