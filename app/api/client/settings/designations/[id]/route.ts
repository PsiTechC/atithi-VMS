import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Designation from '@/models/Designation';
import { requireUser } from '@/lib/auth';
// Edit designation
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
        const designation = await Designation.findOneAndUpdate(
            { _id: id, clientId },
            { name, description },
            { new: true }
        );
        if (!designation) {
            return NextResponse.json({ error: 'Designation not found' }, { status: 404 });
        }
        return NextResponse.json(designation);
    } catch (error: any) {
        console.error('Error updating designation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Delete designation
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
        const result = await Designation.deleteOne({ _id: id, clientId });
        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Designation not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting designation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}