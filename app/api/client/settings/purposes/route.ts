import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Purpose from '@/models/Purpose';
import { requireUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const user = await requireUser(request);
    if (!user || !user.clientId) {
      return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
    }
    // Only return purposes for the logged-in client
    const purposes = await Purpose.find({ clientId: user.clientId }).sort({ createdAt: -1 });
    return NextResponse.json(purposes);
  } catch (error: any) {
    console.error('Error fetching purposes:', error);
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
    const { name, description } = body;
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const purpose = new Purpose({
      name,
      description,
      clientId: user.clientId
    });
    await purpose.save();
    return NextResponse.json(purpose, { status: 201 });
  } catch (error: any) {
    console.error('Error creating purpose:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Purpose with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

