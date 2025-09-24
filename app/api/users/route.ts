
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { requireUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendUserInviteMail } from "@/lib/mailer"; // 🔹 add a mailer helper for users
import type { IClient as ClientType } from "@/models/Client";

export const dynamic = "force-dynamic";

// 🔹 List users
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const me = requireUser(req, ["client-admin", "client-user"]);

        const { searchParams } = new URL(req.url);
        const limit = Math.min(Number(searchParams.get("limit") || 200), 1000);
        const sort = (searchParams.get("sort") || "desc").toLowerCase() === "asc" ? 1 : -1;

        const users = await User.find({ clientId: me.clientId })
            .sort({ createdAt: sort })
            .limit(limit)
            .lean();

        return NextResponse.json({ users });
    } catch (err: any) {
        const msg = err?.message || "Failed to fetch users";
        const status =
            msg === "Missing bearer token" || msg === "Invalid token"
                ? 401
                : msg === "Forbidden"
                    ? 403
                    : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}

// 🔹 Invite a new user
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const me = requireUser(req, ["client-admin"]);

        const { name, email, role = "client-user", status = "pending" } = await req.json();
        if (!name || !email) {
            return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
        }

        // Generate a random temporary password
        const plainPassword = crypto.randomBytes(6).toString("base64url"); // ~8–10 chars
        const passwordHash = await bcrypt.hash(plainPassword, 12);

        // Save user with password hash only
        const user = await User.create({
            clientId: me.clientId,
            name,
            email: email.toLowerCase(),
            role,
            status,
            passwordHash,
        });

        // 🔹 Fetch client name for the invite mail
        const { default: Client } = await import("@/models/Client");
        const client = (await Client.findById(me.clientId).lean()) as ClientType | null;

        const clientName: string = client?.name || "Your Organization";

        // Send invite email with plain password
        await sendUserInviteMail({
            to: email,
            name,
            clientName,// you might want to fetch actual client name
            tempPassword: plainPassword,
        });

        return NextResponse.json({ success: true, user });
    } catch (err: any) {
        if (String(err?.message || "").includes("duplicate key")) {
            return NextResponse.json(
                { error: "A user with this email already exists for this client" },
                { status: 409 }
            );
        }
        const msg = err?.message || "Failed to create user";
        const status =
            msg === "Missing bearer token" || msg === "Invalid token"
                ? 401
                : msg === "Forbidden"
                    ? 403
                    : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}

// PATCH: Update user status (suspend/activate)
export async function PATCH(req: NextRequest) {
    try {
        await dbConnect();
        const me = requireUser(req, ["client-admin"]);
        const { userId, status } = await req.json();
        if (!userId || !status) {
            return NextResponse.json({ error: "User ID and status are required" }, { status: 400 });
        }
        if (!['active', 'suspended'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }
        const user = await User.findOneAndUpdate(
            { _id: userId, clientId: me.clientId },
            { status },
            { new: true }
        );
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, user });
    } catch (err: any) {
        const msg = err?.message || "Failed to update user status";
        const status =
            msg === "Missing bearer token" || msg === "Invalid token"
                ? 401
                : msg === "Forbidden"
                    ? 403
                    : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}

// DELETE: Remove user
export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const me = requireUser(req, ["client-admin"]);
        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }
        const user = await User.findOneAndDelete({ _id: userId, clientId: me.clientId });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (err: any) {
        const msg = err?.message || "Failed to delete user";
        const status =
            msg === "Missing bearer token" || msg === "Invalid token"
                ? 401
                : msg === "Forbidden"
                    ? 403
                    : 500;
        return NextResponse.json({ error: msg }, { status });
    }
}