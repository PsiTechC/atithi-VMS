import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import VisitorPass from "@/models/VisitorPass";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    // Find passes where checkOutDate is null and expectedCheckOutTime has passed
    const now = new Date();
    const passes = await VisitorPass.find({
      checkOutDate: null,
      expectedCheckOutTime: { $lte: now },
      status: { $in: ["active", "checked_in"] }
    });
    let updated = 0;
    for (const pass of passes) {
      pass.checkOutDate = now;
      pass.status = "expired";
      await pass.save();
      updated++;
    }
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to auto check-out passes" }, { status: 500 });
  }
}
