// import { NextRequest, NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import VisitorPass from "@/models/VisitorPass";


// /**
//  * Manual checkout (triggered by dashboard button)
//  * Endpoint: PUT /api/visitor-pass/[passId]/checkout
//  */
// export async function PUT(req: NextRequest, { params }: { params: { passId: string } }) {
//   try {
//     await dbConnect();
//     const { passId } = params;
//     const body = await req.json();
//     const method = body?.method || "client";

//     const pass = await VisitorPass.findOne({ passId });

//     if (!pass) {
//       return NextResponse.json({ error: "Visitor pass not found" }, { status: 404 });
//     }

//     if (pass.status === "checked_out" || pass.checkOutDate) {
//       return NextResponse.json({ message: "Visitor is already checked out" });
//     }

//     const now = new Date();

//     // Update checkout info
//     pass.checkOutDate = now;
//     pass.status = "checked_out";

//     // Add movement history entry for manual checkout
//     pass.movementHistory.push({
//       timestamp: now,
//       type: "check_out",
//       method,
//       accessPointName: "Client Dashboard"
//     });

//     await pass.save();

//     return NextResponse.json({ success: true, message: "Visitor checked out successfully" });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "Failed to check out visitor" },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import VisitorPass from "@/models/VisitorPass";
import mongoose from "mongoose";

export async function PUT(
  req: NextRequest,
  context: any
) {
  try {
    await dbConnect();
    // route folder is [id] so Next provides `context.params.id`. Support `passId` as fallback.
    const passId = context?.params?.id || context?.params?.passId;
    const body = await req.json();
    const method = body?.method || "client";

    // 🔥 Try matching either the custom passId field OR the MongoDB _id
    const query = mongoose.isValidObjectId(passId)
      ? { _id: passId }
      : { passId: passId };

    const pass = await VisitorPass.findOne(query);

    if (!pass) {
      return NextResponse.json(
        { error: `Visitor pass not found for ID: ${passId}` },
        { status: 404 }
      );
    }

    if (pass.status === "checked_out" || pass.checkOutDate) {
      return NextResponse.json({ message: "Visitor is already checked out" });
    }

    const now = new Date();
    pass.checkOutDate = now;
    pass.status = "checked_out";

    pass.movementHistory.push({
      timestamp: now,
      type: "check_out",
      // normalize method values to match schema enums
      method: (function normalizeMethod(m: any) {
        if (!m) return "manual";
        const key = String(m).toLowerCase();
        if (key === "client") return "manual";
        if (["mobile", "passid", "pass-id", "pass_id", "passid"].includes(key)) return "mobile";
        if (key === "qr") return "qr";
        if (key === "manual") return "manual";
        return "unknown";
      })(method),
      accessPointName: "Client Dashboard",
    });

    await pass.save();

    // Return updated pass to let frontend refresh UI without extra fetch
    const passObj = pass.toObject ? pass.toObject() : pass;
    console.log(`Visitor ${pass.passId || pass._id} checked out by ${method}`);

    return NextResponse.json({ success: true, message: "Visitor checked out successfully", pass: passObj });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to check out visitor" },
      { status: 500 }
    );
  }
}
