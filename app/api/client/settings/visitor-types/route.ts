
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireUser(request);
    if (!user || !user.clientId) {
      return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
    }
    // Only return visitor types for the logged-in client
    const visitorTypes = await VisitorType.find({ clientId: user.clientId }).sort({ createdAt: -1 });
    return NextResponse.json(visitorTypes);
  } catch (error: any) {
    console.error('Error fetching visitor types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireUser(request);
    if (!user || !user.clientId) {
      return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
    }
    const body = await request.json();
    const { name, description, color, accessLevel } = body;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const visitorType = new VisitorType({
      name,
      description,
      color,
      accessLevel,
      clientId: user.clientId
    });
    await visitorType.save();
    return NextResponse.json(visitorType, { status: 201 });
  } catch (error: any) {
    console.error('Error creating visitor type:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Visitor Type with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import VisitorType from '@/models/VisitorType';
import { requireUser } from '@/lib/auth';
