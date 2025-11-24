const { spawn } = require('child_process')
const readline = require('readline')
const path = require('path')

// Simple process manager to interact with the existing CLI `mqttcontrol.js`.
// It spawns `node mqttcontrol.js`, writes commands to its stdin in CLI format
// and parses stdout lines to resolve pending requests when a device publishes a /resp.

const pending = new Map() // deviceId -> [ { resolve, reject, timer } ]
let child = null
let rl = null
let awaitingPayloadFor = null // deviceId for which next stdout line is payload

function startChild() {
  if (child) return
  const fs = require('fs')
  // try several candidate locations for mqttcontrol.js (project root and lib/mqtt)
  const candidates = [
    path.join(process.cwd(), 'lib', 'mqtt', 'mqttcontrol.js'),
    path.join(process.cwd(), 'mqttcontrol.js'),
    path.join(__dirname, 'mqttcontrol.js'),
  ]
  let scriptPath = null
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      scriptPath = c
      break
    }
  }
  if (!scriptPath) {
    console.error('mqttControlClient: mqttcontrol.js not found in candidates:', candidates)
    // throw so caller sees failure
    throw new Error('mqttcontrol.js not found')
  }
  console.log('Starting mqttcontrol child from', scriptPath)
  child = spawn(process.execPath, [scriptPath], {
    cwd: path.dirname(scriptPath),
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  rl = readline.createInterface({ input: child.stdout })

  rl.on('line', handleLine)

  child.stderr.on('data', (d) => {
    try {
      const msg = d.toString()
      console.error('[mqttcontrol stderr]', msg)
    } catch (e) {
      console.error('[mqttcontrol stderr] <unparsable>')
    }
  })

  child.on('exit', (code, sig) => {
    console.warn('mqttcontrol child exited', code, sig)
    // reject all pending
    for (const [deviceId, arr] of pending.entries()) {
      for (const p of arr) {
        try {
          p.reject(new Error('mqttcontrol process exited'))
        } catch (e) {}
        clearTimeout(p.timer)
      }
    }
    pending.clear()
    child = null
    awaitingPayloadFor = null
    // auto-restart after short delay
    setTimeout(() => startChild(), 1000)
  })
}

function handleLine(line) {
  if (!line) return
  line = line.toString().trim()
  // detect topic lines like: "💬 2025-10-24T... ← devices/DS000003/resp"
  const topicMatch = line.match(/←\s+devices\/([^\/\s]+)\/resp/)
  if (topicMatch) {
    awaitingPayloadFor = topicMatch[1]
    return
  }

  // If we were awaiting a payload for a device, treat this line as its payload
  if (awaitingPayloadFor) {
    const deviceId = awaitingPayloadFor
    awaitingPayloadFor = null
    const payload = line
    const queue = pending.get(deviceId)
    if (queue && queue.length > 0) {
      const entry = queue.shift()
      clearTimeout(entry.timer)
      try {
        entry.resolve({ deviceId, payload })
      } catch (e) {
        // ignore
      }
      if (queue.length === 0) pending.delete(deviceId)
    } else {
      console.log('mqttControlClient: received response for', deviceId, 'but no pending request')
    }
    return
  }

  // other stdout lines
  // (we log them for diagnostics)
  // console.log('[mqttcontrol]', line)
}

function ensureStarted() {
  if (!child) startChild()
}

function sendCommandOnceAck(deviceId, command, timeoutMs = 10000) {
  ensureStarted()
  return new Promise((resolve, reject) => {
    if (!child || !child.stdin.writable) {
      return reject(new Error('mqttcontrol process not available'))
    }

    const timer = setTimeout(() => {
      // remove from queue
      const q = pending.get(deviceId)
      if (q) {
        const idx = q.findIndex((p) => p.timer === timer)
        if (idx !== -1) q.splice(idx, 1)
        if (q.length === 0) pending.delete(deviceId)
      }
      reject(new Error('timeout waiting for device response'))
    }, timeoutMs)

    const entry = { resolve, reject, timer }
    if (!pending.has(deviceId)) pending.set(deviceId, [])
    pending.get(deviceId).push(entry)

    const line = `${deviceId} ${command}\n`
    try {
      child.stdin.write(line, 'utf8', (err) => {
        if (err) {
          clearTimeout(timer)
          // cleanup
          const q = pending.get(deviceId)
          if (q) {
            const i = q.indexOf(entry)
            if (i !== -1) q.splice(i, 1)
            if (q.length === 0) pending.delete(deviceId)
          }
          reject(err)
        } else {
          // written ok
          // console.log('mqttControlClient: wrote to mqttcontrol:', line.trim())
        }
      })
    } catch (err) {
      clearTimeout(timer)
      const q = pending.get(deviceId)
      if (q) {
        const i = q.indexOf(entry)
        if (i !== -1) q.splice(i, 1)
        if (q.length === 0) pending.delete(deviceId)
      }
      reject(err)
    }
  })
}

module.exports = {
  sendCommandOnceAck,
  // exposed for diagnostics
  _internal: {
    ensureStarted,
    _pending: pending,
  },
}
