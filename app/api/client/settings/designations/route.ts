
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Designation from '@/models/Designation';
import { requireUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    let clientId;
    try {
      clientId = requireUser(request, ["client-admin"]).clientId;
    } catch {
      return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
    }
    const designations = await Designation.find({ clientId }).sort({ createdAt: -1 });
    return NextResponse.json(designations);
  } catch (error: any) {
    console.error('Error fetching designations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    let clientId;
    try {
      clientId = requireUser(request, ["client-admin"]).clientId;
    } catch {
      return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
    }
    const body = await request.json();
    const { name, description } = body;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const designation = new Designation({
      name,
      description,
      clientId
    });
    await designation.save();
    return NextResponse.json(designation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating designation:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Designation with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
