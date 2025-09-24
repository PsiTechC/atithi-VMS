import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Department from '@/models/Department';
import { requireUser } from '@/lib/auth';
// Edit department
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
                let clientId;
                try {
                    clientId = requireUser(request, ["client-admin"]).clientId;
                } catch {
                    return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
                }
        const body = await request.json();
        const { id, name, description } = body;
        if (!id || !name) {
            return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
        }
        const department = await Department.findOneAndUpdate(
            { _id: id, clientId },
            { name, description },
            { new: true }
        );
        if (!department) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }
        return NextResponse.json(department);
    } catch (error: any) {
        console.error('Error updating department:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Delete department
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
                let clientId;
                try {
                    clientId = requireUser(request, ["client-admin"]).clientId;
                } catch {
                    return NextResponse.json({ error: "Authentication required. Please log in again." }, { status: 401 });
                }
        const body = await request.json();
        const { id } = body;
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }
        const result = await Department.deleteOne({ _id: id, clientId });
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting department:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}