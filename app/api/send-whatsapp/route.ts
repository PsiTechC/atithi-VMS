
// import { NextRequest, NextResponse } from "next/server";
// import {
//   sendingWhatsapp,
//   //sendingWhatsappTemplate,
//    //sendingWhatsappInteractiveTemplate, // ✅ add this import
// } from "@/lib/whatsapp";

// export const runtime = "nodejs";

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     // ✅ Case 3: Default (PDF with document)
//     const { name, number, pdfUrl, mediaName } = body;
//     if (!name || !number || !pdfUrl) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const result = await sendingWhatsapp(
//       name,
//       number,
//       pdfUrl,
//       mediaName || "VisitorPass.pdf"
//     );

//     if (result.status === "error") {
//       return NextResponse.json({ error: result.error }, { status: 500 });
//     }

//     return NextResponse.json({ result: result.result });
//   } catch (error: any) {
//     console.error("❌ send-whatsapp route error:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to send WhatsApp message" },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import {
  sendingWhatsapp,
} from "@/lib/whatsapp";

// 🧩 Added imports for database and model
import {dbConnect} from "@/lib/mongodb";
import VisitorPass from "@/models/VisitorPass";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // ✅ Case 3: Default (PDF with document)
    const { name, number, pdfUrl, mediaName, passId } = body; // 🧩 added passId
    if (!name || !number || !pdfUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await sendingWhatsapp(
      name,
      number,
      pdfUrl,
      mediaName || "VisitorPass.pdf"
    );

    // 🧩 Connect DB once
    await dbConnect();

    // 🧩 Record WhatsApp send history
    const timestamp = new Date();
    const status =
      result.status === "error" ? "failure" : "success";

    if (passId) {
      await VisitorPass.updateOne(
        { passId },
        {
          $push: {
            whatsappHistory: { timestamp, status },
          },
        }
      );
    }

    if (result.status === "error") {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ result: result.result });
  } catch (error: any) {
    console.error("❌ send-whatsapp route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send WhatsApp message" },
      { status: 500 }
    );
  }
}
