// // Debug script to test different parameter formats for atithi_v10
// require('dotenv').config();

// const WHATSAPP_API_KEY = "ef99d3d2-e032-4c04-8e27-9313b2e6b172";
// const apiUrl = "https://whatsapp-api-backend-production.up.railway.app/api/send-message";
// const phoneNumber = "+919503731093";

// const testCases = [
//   {
//     name: "Test 1: Check template exists with 0 parameters",
//     parameters: []
//   },
//   {
//     name: "Test 2: Only OTP (single parameter)",
//     parameters: ["123456"]
//   },
//   {
//     name: "Test 3: Two string parameters [clientName, otp]",
//     parameters: ["Taj Hotel", "123456"]
//   },
//   {
//     name: "Test 4: Three parameters (in case footer has variable)",
//     parameters: ["Taj Hotel", "123456", ""]
//   },
//   {
//     name: "Test 5: OTP only as number type",
//     parameters: [123456]
//   }
// ];

// async function runTest(testCase) {
//   console.log(`\n${"=".repeat(60)}`);
//   console.log(testCase.name);
//   console.log(`${"=".repeat(60)}`);

//   const requestBody = {
//     to_number: phoneNumber,
//     parameters: testCase.parameters,
//     template_name: "atithi_v10",
//     whatsapp_request_type: "TEMPLATE",
//   };

//   console.log("Parameters:", JSON.stringify(testCase.parameters));
//   console.log("Sending...");

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
//     console.log("Status:", response.status);

//     if (response.ok) {
//       console.log("✅ SUCCESS!");
//       console.log("Response:", JSON.stringify(result, null, 2));
//       return true;
//     } else {
//       console.log("❌ FAILED");
//       console.log("Error:", result.error || result.details || JSON.stringify(result));
//       return false;
//     }
//   } catch (error) {
//     console.error("❌ EXCEPTION:", error.message);
//     return false;
//   }
// }

// async function runAllTests() {
//   console.log("Testing WhatsApp OTP Template (atithi_v10)");
//   console.log("Phone:", phoneNumber);

//   for (const testCase of testCases) {
//     const success = await runTest(testCase);
//     if (success) {
//       console.log("\n🎉 Found working configuration!");
//       break;
//     }
//     // Wait 2 seconds between tests to avoid rate limiting
//     await new Promise(resolve => setTimeout(resolve, 2000));
//   }
// }

// runAllTests();
