// // Test script for WhatsApp OTP template (atithi_v10)
// // Usage: node test-whatsapp-otp.js <phone_number>
// // Example: node test-whatsapp-otp.js +919876543210

// // Load .env file
// require('dotenv').config();
// //WHATSAPP_API_KEY=ef99d3d2-e032-4c04-8e27-9313b2e6b172

// const WHATSAPP_API_KEY ="ef99d3d2-e032-4c04-8e27-9313b2e6b172";
// const apiUrl = "https://whatsapp-api-backend-production.up.railway.app/api/send-message";

// async function testOtpTemplate(phoneNumber) {
//   console.log("=== Testing WhatsApp OTP Template (atithi_v10) ===\n");

//   const testClientName = "Taj Hotel";
//   const testOtp = "123456";

//   const requestBody = {
//     to_number: phoneNumber,
//     parameters: [testOtp], // Testing with only OTP
//     template_name: "atithi_v10",
//     whatsapp_request_type: "TEMPLATE",
//   };

//   console.log("Phone number:", phoneNumber);
//   console.log("Testing with ONLY OTP parameter (no header variable)");
//   console.log("OTP (Body {{1}}):", testOtp);
//   console.log("\nRequest body:");
//   console.log(JSON.stringify(requestBody, null, 2));
//   console.log("\nSending...\n");

//   try {
//     const response = await fetch(apiUrl, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "x-api-key": WHATSAPP_API_KEY,
//       },
//       body: JSON.stringify(requestBody),
//     });

//     const result = await response.json();
//     console.log("HTTP Status:", response.status);
//     console.log("Response:", JSON.stringify(result, null, 2));

//     if (response.ok) {
//       console.log("\n✅ SUCCESS! OTP message sent successfully.");
//       console.log("Check WhatsApp on", phoneNumber);
//     } else {
//       console.log("\n❌ FAILED - Error from WhatsApp API");
//       if (result.error && result.error.message) {
//         console.log("Error message:", result.error.message);
//       }
//     }
//   } catch (error) {
//     console.error("\n❌ EXCEPTION:", error.message);
//   }
// }

// // Validate arguments
// const phoneNumber = process.argv[2];

// if (!phoneNumber) {
//   console.error("❌ Usage: node test-whatsapp-otp.js <phone_number>");
//   console.error("   Example: node test-whatsapp-otp.js +919876543210");
//   process.exit(1);
// }

// if (!WHATSAPP_API_KEY) {
//   console.error("❌ WHATSAPP_API_KEY environment variable not set");
//   console.error("   Set it in your .env file or export it:");
//   console.error("   export WHATSAPP_API_KEY=your_api_key_here");
//   process.exit(1);
// }

// testOtpTemplate(phoneNumber);
