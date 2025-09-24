import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import Visitor from "@/models/Visitor"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    // If accessed directly in browser (not XHR/fetch), return generic message
    const accept = req.headers.get('accept') || '';
    if (accept.includes('text/html')) {
      return new Response('Not Found', { status: 404 });
    }
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')
    // Get client ID from cookie
    const clientSession = req.cookies.get("client-session")
    const clientId = clientSession?.value

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }
    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required" }, { status: 400 })
    }

    // Only find visitor for this client
    const visitor = await Visitor.findOne({ phone, clientId })

    if (visitor) {
      return NextResponse.json({
        exists: true,
        visitor: {
          id: visitor._id,
          passId: visitor.passId,          
          name: visitor.name,
          email: visitor.email,
          company: visitor.company
        }
      })
    } else {
      return NextResponse.json({ exists: false })
    }
  } catch (error) {
    console.error("Check mobile error:", error)
    return NextResponse.json({ error: "Failed to check mobile number" }, { status: 500 })
  }
}
