// import { NextResponse } from "next/server";
// import { dbConnect } from "@/lib/mongodb";
// import VisitorPass from "@/models/VisitorPass";
// import Visitor from "@/models/Visitor";

// export async function GET(req: Request, { params }: { params: { id: string } }) {
// 	try {
// 		await dbConnect();
// 		const pass = await VisitorPass.findOne({ passId: params.id }).lean();
// 		if (!pass || Array.isArray(pass)) {
// 			return NextResponse.json({ error: "Visitor pass not found" }, { status: 404 });
// 		}
// 		const visitor = await Visitor.findById((pass as any).visitorId).lean();
// 		return NextResponse.json({ pass, visitor });
// 	} catch (error) {
// 		const errorMessage = typeof error === "object" && error !== null && "message" in error
// 			? (error as { message?: string }).message
// 			: "Failed to fetch visitor details";
// 		return NextResponse.json({ error: errorMessage || "Failed to fetch visitor details" }, { status: 500 });
// 	}
// }


// // app/api/visitor-pass/[passId]/route.ts (GET)
// import { NextRequest, NextResponse } from "next/server"
// import { dbConnect } from "@/lib/mongodb"
// import VisitorPass from "@/models/VisitorPass"
// import Visitor from "@/models/Visitor"

// export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
//   await dbConnect()

  
//   const pass = await VisitorPass.findOne({ passId: params.id })
//   if (!pass) return NextResponse.json({ error: "Not found" }, { status: 404 })

//   const visitor = await Visitor.findById(pass.visitorId).lean()

//   // Ensure movementHistory is present in the response
//   const passJson = pass.toObject()

//   return NextResponse.json({
//     pass: passJson,   // includes movementHistory array
//     visitor,
//     client: { name: /* your client name lookup if you have it */ "" }
//   })
// }

// app/api/visitor-pass/[id]/route.ts
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/mongodb";
import VisitorPass from "@/models/VisitorPass";
import Visitor from "@/models/Visitor";

// Describe the shape we expect from VisitorPass when using .lean()
type VisitorPassLean = {
  _id: Types.ObjectId;
  passId: string;
  visitorId?: Types.ObjectId | string | null;
  movementHistory?: Array<unknown>;
  // include any other fields you store on the pass:
  [key: string]: unknown;
};

export async function GET(_req: Request, context: any) {
  try {
    await dbConnect();

    const passParam: string | undefined =
      context?.params?.id ?? context?.params?.passId;
    if (!passParam) {
      return NextResponse.json({ error: "Missing pass id." }, { status: 400 });
    }

    // 👇 Tell Mongoose what type to return from lean()
    const pass = await VisitorPass.findOne({ passId: passParam })
      .lean<VisitorPassLean>()
      .exec();

    if (!pass) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Normalize visitorId to string if present
    const visitorId =
      typeof pass.visitorId === "string"
        ? pass.visitorId
        : pass.visitorId instanceof Types.ObjectId
        ? pass.visitorId.toString()
        : undefined;

    const visitor = visitorId ? await Visitor.findById(visitorId).lean() : null;

    // Ensure movementHistory is always an array in the response
    const movementHistory = Array.isArray(pass.movementHistory)
      ? pass.movementHistory
      : [];

    return NextResponse.json({
      pass: { ...pass, movementHistory },
      visitor,
      client: { name: "" }, // TODO: populate if you have client context
    });
  } catch (err: any) {
    console.error("GET /visitor-pass/[id] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
