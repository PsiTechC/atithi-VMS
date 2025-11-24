import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import VisitorPass from "@/models/VisitorPass";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const ids = Array.isArray(body.ids) ? body.ids : [];
    if (!ids.length) return NextResponse.json({ statuses: [] });

    // split provided ids into passIds (custom IDs like 20251014-...) and real ObjectIds
    const passIds: string[] = []
    const objectIds: mongoose.Types.ObjectId[] = []
    for (const id of ids) {
      if (/^[0-9a-fA-F]{24}$/.test(String(id))) {
        objectIds.push(new mongoose.Types.ObjectId(String(id)))
      } else {
        passIds.push(String(id))
      }
    }

    const orClauses: any[] = []
    if (passIds.length) orClauses.push({ passId: { $in: passIds } })
    if (objectIds.length) orClauses.push({ _id: { $in: objectIds } })
    if (orClauses.length === 0) return NextResponse.json({ statuses: [] })

    const passes = await VisitorPass.find({ $or: orClauses }).select('passId _id approvalStatus approvalRequired');
    const statuses = passes.map(p => ({ id: p.passId || String(p._id), approvalStatus: p.approvalStatus || null, approvalRequired: Boolean(p.approvalRequired) }));
    return NextResponse.json({ statuses });
  } catch (err: any) {
    console.error('statuses error', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
