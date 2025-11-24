# #!/usr/bin/env python3
# """
# Fleet MQTT console for ESP32 + A7670C devices
# ----------------------------------------------
# • Per-device topics:
#     cmd:  devices/<DEVICE_ID>/cmd
#     resp: devices/<DEVICE_ID>/resp
# • Broadcast commands:
#     devices/all/cmd   (payload: "start|ped|stop" or "<DEVICE_ID> <cmd>")
# • From the terminal, type:
#     <DEVICE_ID> <command>
#     all <command>

# Examples:
#   NODE001 start
#   NODE007 stop
#   all ped
#   NODE003 setid:NODE555

# 'help' for help, 'add <DEVICE_ID>' to track a new device at runtime, 'list' to show IDs.
# """

# import paho.mqtt.client as mqtt
# import threading
# from datetime import datetime

# # ────────── Broker config ──────────
# BROKER_URL  = "connection.eulerianbots.com"
# BROKER_PORT = 1883
# KEEPALIVE   = 60

# # ────────── Device IDs you want to track ──────────
# # Add your fleet IDs here. You can also add at runtime: `add NODE123`
# DEVICE_IDS = [
#     "DS000001",
#     "DS000002",
#     "DS000003",
#     "DS000004",
#     "DS000005",
#     "DS000006",
#     "NODE002",
#     "NODE001",
#     # "NODE007",
# ]

# # ────────── Topic formats ──────────
# CMD_TOPIC_FMT       = "devices/{id}/cmd"
# RESP_TOPIC_FMT      = "devices/{id}/resp"
# BROADCAST_CMD_TOPIC = "devices/all/cmd"

# # ────────── MQTT callbacks ──────────
# def on_connect(client, userdata, flags, rc):
#     if rc != 0:
#         print(f"❌ MQTT connect failed (rc={rc})")
#         return
#     print("✅ Connected to broker")

#     # subscribe to resp topics for all known devices
#     if DEVICE_IDS:
#         subs = [(RESP_TOPIC_FMT.format(id=i), 0) for i in DEVICE_IDS]
#         client.subscribe(subs)
#         print("📡 Subscribed to responses:", ", ".join(i for i in DEVICE_IDS))
#     else:
#         # fallback: wildcard if you didn't pre-list devices
#         client.subscribe(("devices/+/resp", 0))
#         print("📡 Subscribed to responses: devices/+/resp")

# def on_message(client, userdata, msg):
#     payload = msg.payload.decode(errors="replace")
#     tstamp  = datetime.now().isoformat(timespec="seconds")

#     if msg.topic.endswith("/resp"):
#         print(f"\n💬 {tstamp} ← {msg.topic}\n{payload}")
#     else:
#         print(f"\n{tstamp}  {msg.topic}\n{payload}")

# def on_disconnect(client, userdata, rc):
#     print("⚠️  Disconnected. paho will retry...")

# # ────────── CLI thread ──────────
# def command_loop(client: mqtt.Client):
#     def print_help():
#         ids = ", ".join(DEVICE_IDS) if DEVICE_IDS else "(none; you can still use 'all ...' or 'add <ID>')"
#         print(
#             "\nCommands:\n"
#             "  <DEVICE_ID> <command>    e.g.  NODE007 start\n"
#             "  all <command>            e.g.  all stop\n"
#             "  add <DEVICE_ID>          subscribe to that device's /resp\n"
#             "  list                     show tracked device IDs\n"
#             "  help                     this text\n"
#             "  quit / exit              leave console\n"
#             f"\nTracked devices: {ids}\n"
#             "Valid commands: start | ped | stop | setid:<NEWID>\n"
#         )

#     print_help()

#     while True:
#         try:
#             line = input(">>> ").strip()
#         except (EOFError, KeyboardInterrupt):
#             line = "quit"

#         if not line:
#             continue

#         low = line.lower()

#         if low in {"quit", "exit"}:
#             client.disconnect()
#             break

#         if low == "help":
#             print_help()
#             continue

#         if low == "list":
#             print("Devices:", ", ".join(DEVICE_IDS) if DEVICE_IDS else "(none)")
#             continue

#         if low.startswith("add "):
#             new_id = line.split(" ", 1)[1].strip()
#             if not new_id:
#                 print("Usage: add <DEVICE_ID>")
#                 continue
#             if new_id not in DEVICE_IDS:
#                 DEVICE_IDS.append(new_id)
#                 client.subscribe((RESP_TOPIC_FMT.format(id=new_id), 0))
#                 print(f"➕ Subscribed to {RESP_TOPIC_FMT.format(id=new_id)}")
#             else:
#                 print("Already tracking", new_id)
#             continue

#         # Expect "<id> <cmd>" or "all <cmd>"
#         if " " not in line:
#             print("⚠️  Use: <DEVICE_ID> <command>  or  all <command>")
#             continue

#         target, cmd = line.split(" ", 1)
#         target = target.strip()
#         cmd    = cmd.strip()

#         if not cmd:
#             print("⚠️  Command cannot be empty")
#             continue

#         if target.lower() == "all":
#             # Broadcast command
#             client.publish(BROADCAST_CMD_TOPIC, cmd, qos=0, retain=False)
#             print(f"➡️  Sent '{cmd}' to {BROADCAST_CMD_TOPIC}")
#             continue

#         # Per-device command
#         topic = CMD_TOPIC_FMT.format(id=target)
#         client.publish(topic, cmd, qos=0, retain=False)
#         print(f"➡️  Sent '{cmd}' to {topic}")

# # ────────── main ──────────
# def main():
#     client = mqtt.Client(client_id="PythonFleetConsole", clean_session=True)
#     client.on_connect    = on_connect
#     client.on_message    = on_message
#     client.on_disconnect = on_disconnect

#     # Backoff for auto-reconnect
#     client.reconnect_delay_set(min_delay=1, max_delay=30)

#     client.connect(BROKER_URL, BROKER_PORT, keepalive=KEEPALIVE)

#     # Start CLI in a thread; paho network loop runs forever
#     threading.Thread(target=command_loop, args=(client,), daemon=True).start()
#     try:
#         client.loop_forever()
#     except KeyboardInterrupt:
#         print("\nExiting...")
#         client.disconnect()

# if __name__ == "__main__":
#     main()
