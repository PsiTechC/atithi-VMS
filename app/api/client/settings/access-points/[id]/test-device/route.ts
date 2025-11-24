import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/mongodb'
import AccessPoint from '@/models/AccessPoint'
import { requireUser } from '@/lib/auth'

// Use the project's mqtt helper (CommonJS) - require it
const mqttCmd = require('@/lib/mqtt/mqttCommand')

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // auth
    try {
      requireUser(request, ['client-admin'])
    } catch {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const url = new URL(request.url)
    const parts = url.pathname.split('/')
    // expected path: /api/client/settings/access-points/:id/test-device
    // parts: ["", "api","client","settings","access-points", ":id","test-device"]
    const id = parts[parts.length - 2]
    // basic validation for ObjectId
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid access point id' }, { status: 400 })
    }
    if (!id) return NextResponse.json({ error: 'Access Point ID required' }, { status: 400 })

    const ap = await AccessPoint.findById(id)
    if (!ap) return NextResponse.json({ error: 'Access Point not found' }, { status: 404 })
    if (!ap.deviceId) return NextResponse.json({ error: 'No deviceId configured for this access point' }, { status: 400 })

    // Send a START command and wait for ACK via the mqttcontrol CLI process manager
    try {
  // require the mqttControlClient manager (spawn wrapper for mqttcontrol.js)
  // use a static module request so Next's bundler can resolve it
  const mqttClient = require('@/lib/mqtt/mqttControlClient')

      // mqttcontrol expects lower-case commands like 'start'
      const cmd = 'start'
      console.log(`Sending START to device ${ap.deviceId} via mqttcontrol (cmd=${cmd})`)
      const resp = await mqttClient.sendCommandOnceAck(ap.deviceId, cmd, 10000)
      console.log('mqttcontrol response:', resp)
      return NextResponse.json({ success: true, payload: resp })
    } catch (err: any) {
      console.error('MQTT START error:', err)
      return NextResponse.json({ error: 'Failed to send START command' }, { status: 500 })
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
