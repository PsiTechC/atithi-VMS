import { NextRequest, NextResponse } from "next/server"
import { dbConnect } from "@/lib/mongodb"
import VisitorPass from "@/models/VisitorPass"

export async function GET(req: NextRequest) {
  try {
    await dbConnect()

    const accept = req.headers.get('accept') || ''
    if (accept.includes('text/html')) {
      return new Response('Not Found', { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')
    const clientSession = req.cookies.get('client-session')
    const clientId = clientSession?.value

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Find latest pass for this phone + client
    const lastPass = await VisitorPass.findOne({ phone, clientId })
      .sort({ checkInDate: -1 })
      .lean()
      .select('passId name purposeOfVisit host checkInDate expectedCheckOutTime visitorType visitorIdText email notes photoUrl status comingFrom idType company')

    return NextResponse.json({ lastPass: lastPass || null })
  } catch (err) {
    console.error('last-by-phone error:', err)
    return NextResponse.json({ error: 'Failed to fetch last pass' }, { status: 500 })
  }
}
