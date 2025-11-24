// const express = require("express");
// // require the local mqtt helper using a relative path (server.js is in lib/mqtt)
// const { sendDeviceCommandOnceAck } = require("./mqttCommand");

// const app = express();
// app.use(express.json());

// // Route to send a command to a specific device
// app.post("/send-command", async (req, res) => {
//   const { deviceId, command } = req.body;

//   if (!deviceId || !command) {
//     return res.status(400).json({ error: "deviceId and command are required" });
//   }

//   try {
//     const response = await sendDeviceCommandOnceAck(deviceId, command);
//     res.json({
//       deviceId,
//       command,
//       response: response || "No response (timeout)",
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(3000, () => console.log("🚀 Test server running on port 3000"));
