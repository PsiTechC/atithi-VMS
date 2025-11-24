#!/usr/bin/env node
/**
 * Fleet MQTT Console for ESP32 + A7670C Devices (JavaScript version)
 * ---------------------------------------------------------------
 * • Per-device topics:
 *     cmd:  devices/<DEVICE_ID>/cmd
 *     resp: devices/<DEVICE_ID>/resp
 * • Broadcast commands:
 *     devices/all/cmd   (payload: "start|ped|stop" or "<DEVICE_ID> <cmd>")
 * 
 * Examples:
 *   NODE001 start
 *   NODE007 stop
 *   all ped
 *   NODE003 setid:NODE555
 * 
 * Commands:
 *   <DEVICE_ID> <command>
 *   all <command>
 *   add <DEVICE_ID>
 *   list
 *   help
 *   quit / exit
 */

import mqtt from "mqtt";
import readline from "readline";

// ────────── Broker Config ──────────
const BROKER_URL = "mqtt://connection.eulerianbots.com";
const BROKER_PORT = 1883;
const KEEPALIVE = 60;

// ────────── Device IDs to Track ──────────
let DEVICE_IDS = [
  "DS000001",
  "DS000002",
  "DS000003",
  "DS000004",
  "DS000005",
  "DS000006",
  "NODE002",
  "NODE001",
  // "NODE007",
];

// ────────── Topic Formats ──────────
const CMD_TOPIC_FMT = (id) => `devices/${id}/cmd`;
const RESP_TOPIC_FMT = (id) => `devices/${id}/resp`;
const BROADCAST_CMD_TOPIC = "devices/all/cmd";

// ────────── MQTT Client Setup ──────────
const client = mqtt.connect(BROKER_URL, {
  port: BROKER_PORT,
  keepalive: KEEPALIVE,
  clientId: `JSFleetConsole_${Math.random().toString(16).slice(2)}`,
  reconnectPeriod: 2000,
  clean: true,
});

// ────────── MQTT Event Handlers ──────────
client.on("connect", () => {
  console.log("✅ Connected to broker");

  if (DEVICE_IDS.length > 0) {
    DEVICE_IDS.forEach((id) => {
      const topic = RESP_TOPIC_FMT(id);
      client.subscribe(topic);
    });
    console.log("📡 Subscribed to responses:", DEVICE_IDS.join(", "));
  } else {
    client.subscribe("devices/+/resp");
    console.log("📡 Subscribed to responses: devices/+/resp");
  }
});

client.on("message", (topic, payloadBuf) => {
  const payload = payloadBuf.toString("utf8");
  const timestamp = new Date().toISOString().split(".")[0];

  if (topic.endsWith("/resp"))
    console.log(`\n💬 ${timestamp} ← ${topic}\n${payload}`);
  else console.log(`\n${timestamp}  ${topic}\n${payload}`);
});

client.on("error", (err) => {
  console.error("❌ MQTT error:", err.message);
});

client.on("reconnect", () => {
  console.log("🔄 Reconnecting...");
});

client.on("close", () => {
  console.log("⚠️  Disconnected. Retrying...");
});

// ────────── Command Line Interface ──────────
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: ">>> ",
});

function printHelp() {
  const ids = DEVICE_IDS.length
    ? DEVICE_IDS.join(", ")
    : "(none; you can still use 'all ...' or 'add <ID>')";
  console.log(`
Commands:
  <DEVICE_ID> <command>    e.g.  NODE007 start
  all <command>            e.g.  all stop
  add <DEVICE_ID>          subscribe to that device's /resp
  list                     show tracked device IDs
  help                     this text
  quit / exit              leave console

Tracked devices: ${ids}
Valid commands: start | ped | stop | setid:<NEWID>
`);
}

function processLine(line) {
  line = line.trim();
  if (!line) return;

  const lower = line.toLowerCase();

  if (["quit", "exit"].includes(lower)) {
    console.log("👋 Exiting...");
    client.end(true, () => process.exit(0));
    return;
  }

  if (lower === "help") {
    printHelp();
    return;
  }

  if (lower === "list") {
    console.log("Devices:", DEVICE_IDS.length ? DEVICE_IDS.join(", ") : "(none)");
    return;
  }

  if (lower.startsWith("add ")) {
    const newId = line.split(" ")[1];
    if (!newId) return console.log("Usage: add <DEVICE_ID>");
    if (DEVICE_IDS.includes(newId)) {
      console.log(`Already tracking ${newId}`);
    } else {
      DEVICE_IDS.push(newId);
      client.subscribe(RESP_TOPIC_FMT(newId));
      console.log(`➕ Subscribed to ${RESP_TOPIC_FMT(newId)}`);
    }
    return;
  }

  if (!line.includes(" ")) {
    console.log("⚠️  Use: <DEVICE_ID> <command>  or  all <command>");
    return;
  }

  const [target, ...cmdParts] = line.split(" ");
  const cmd = cmdParts.join(" ").trim();

  if (!cmd) return console.log("⚠️  Command cannot be empty");

  if (target.toLowerCase() === "all") {
    client.publish(BROADCAST_CMD_TOPIC, cmd, { qos: 0, retain: false });
    console.log(`➡️  Sent '${cmd}' to ${BROADCAST_CMD_TOPIC}`);
    return;
  }

  const topic = CMD_TOPIC_FMT(target);
  client.publish(topic, cmd, { qos: 0, retain: false });
  console.log(`➡️  Sent '${cmd}' to ${topic}`);
}

// ────────── Main Execution ──────────
printHelp();
rl.prompt();

rl.on("line", (line) => {
  try {
    processLine(line);
  } catch (err) {
    console.error("❌ Error processing command:", err.message);
  }
  rl.prompt();
});

rl.on("SIGINT", () => {
  console.log("\n👋 Exiting...");
  client.end(true, () => process.exit(0));
});
