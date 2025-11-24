// import { NextRequest, NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import VisitorPass from "@/models/VisitorPass";

// /**
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import VisitorPass from "@/models/VisitorPass";

/**
 * Auto check-out expired passes
 * Trigger: POST /api/client/visitors/auto-checkout
 */
export async function POST(req: NextRequest) {
	try {
		await dbConnect();
		const now = new Date();

		// Find passes whose expected checkout time has passed but still not checked out
		const passes = await VisitorPass.find({
			checkOutDate: null,
			expectedCheckOutTime: { $lte: now },
			status: { $in: ["active", "checked_in"] },
		});

		let updated = 0;
		for (const pass of passes) {
			pass.checkOutDate = now;
			pass.status = "expired";
			pass.movementHistory.push({
				timestamp: now,
				type: "check_out",
				method: "auto",
				accessPointName: "System Auto Checkout",
			});
			await pass.save();
			updated++;
		}

		return NextResponse.json({ success: true, updated });
	} catch (error) {
		console.error("Auto-checkout error:", error);
		return NextResponse.json(
			{ error: "Failed to auto check-out passes" },
			{ status: 500 }
		);
	}
}
// //   try {
