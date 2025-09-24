
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Department from '@/models/Department';
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
    const departments = await Department.find({ clientId }).sort({ createdAt: -1 });
    return NextResponse.json(departments);
  } catch (error: any) {
    console.error('Error fetching departments:', error);
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
    const department = new Department({
      name,
      description,
      clientId
    });
    await department.save();
    return NextResponse.json(department, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Department with this name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
