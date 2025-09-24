import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import IdType from '@/models/IdType';
import { requireUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireUser(request);
    if (!user || !user.clientId) {
      return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
    }
    // Only return ID types for the logged-in client
    const idTypes = await IdType.find({ clientId: user.clientId }).sort({ createdAt: -1 });
    return NextResponse.json(idTypes);
  } catch (error: any) {
    console.error('Error fetching ID types:', error);
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
    const { name, description, required } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const idType = new IdType({
      name,
      description,
      required: required || false,
      clientId
    });

    await idType.save();
    return NextResponse.json(idType, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ID type:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'ID Type with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
