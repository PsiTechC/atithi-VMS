import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import Client from "@/models/Client";
import { requireUser } from "@/lib/auth"; // your helper to decode JWT/session


export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const user = requireUser(req, ["client-admin"]);
        const client = await Client.findById(user.clientId);

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            defaultCheckoutHour: client.defaultCheckoutHour ?? 0, // fallback to 0
        });
    } catch (err) {
        console.error("Fetch checkout hour error:", err);
        return NextResponse.json({ error: "Failed to fetch default checkout hour" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // Authenticated client-admin only
        const session = requireUser(req, ["client-admin"]);
        const clientId = session.clientId;

        const body = await req.json();
        const { currentPassword, newPassword, confirmPassword, defaultCheckoutHour } = body;

        const client = await Client.findById(clientId);
        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // ✅ Update Default Checkout Hour if provided
        if (typeof defaultCheckoutHour !== "undefined") {
            if (isNaN(defaultCheckoutHour) || defaultCheckoutHour < 0) {
                return NextResponse.json({ error: "Invalid checkout hour" }, { status: 400 });
            }
            client.defaultCheckoutHour = defaultCheckoutHour;
            await client.save();
            return NextResponse.json({ success: true, message: "Default checkout hour updated successfully" });
        }

        // ✅ Change Password flow
        if (!newPassword || !confirmPassword) {
            return NextResponse.json({ error: "Both password fields are required" }, { status: 400 });
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
        }

        // If password already exists, validate currentPassword
        if (client.passwordHash) {
            if (!currentPassword) {
                return NextResponse.json({ error: "Current password is required" }, { status: 400 });
            }
            const isMatch = await bcrypt.compare(currentPassword, client.passwordHash);
            if (!isMatch) {
                return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
            }
        }

        // Hash and save new password
        client.passwordHash = await bcrypt.hash(newPassword, 12);
        client.passwordSetAt = new Date();
        await client.save();

        return NextResponse.json({ success: true, message: "Password updated successfully" });
    } catch (err: any) {
        console.error("Security settings error:", err);
        return NextResponse.json({ error: "Failed to update security settings" }, { status: 500 });
    }
}
