import { NextResponse } from "next/server";
import License from "@/models/License";
import { dbConnect } from "@/lib/mongodb";

export async function GET() {
  await dbConnect();
  try {
    // Fetch all clients with license info
    const clients = await (await import("@/models/Client")).default.find({}).sort({ licenseEnd: 1 });
    return NextResponse.json({ licenses: clients });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch licenses" }, { status: 500 });
  }
}
